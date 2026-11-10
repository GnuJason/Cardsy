#include "CardBackCollection.h"
#include "CardBackIdentity.h"

#include <QCryptographicHash>
#include <QDir>
#include <QFile>
#include <QImageWriter>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSaveFile>
#include <QSet>

#include <algorithm>

namespace cardsy::ui {
namespace {

constexpr auto FilePermissions = QFileDevice::ReadOwner | QFileDevice::WriteOwner;
constexpr auto DirectoryPermissions = FilePermissions | QFileDevice::ExeOwner;
constexpr qint64 MaximumManifestBytes = 8 * 1024 * 1024;

CardBackResult storageFailure()
{
    return {CardBackError::StorageFailed,
            CardBackCollection::tr("Unable to update the private image collection. "
                                  "Existing collection records have been kept.")};
}

bool validId(const QString &id)
{
    return id.size() == 64 && std::all_of(id.begin(), id.end(), [](QChar c) {
        return (c >= QLatin1Char('0') && c <= QLatin1Char('9'))
            || (c >= QLatin1Char('a') && c <= QLatin1Char('f'));
    });
}

QString imageId(const QImage &image)
{
    const auto pixels = image.convertToFormat(QImage::Format_RGBA8888);
    QCryptographicHash hash(QCryptographicHash::Sha256);
    for (int row = 0; row < pixels.height(); ++row) {
        hash.addData(QByteArray::fromRawData(
            reinterpret_cast<const char *>(pixels.constScanLine(row)), pixels.width() * 4));
    }
    return QString::fromLatin1(hash.result().toHex());
}

QString modeKey(CardBackMode mode)
{
    switch (mode) {
    case CardBackMode::Default: return QStringLiteral("default");
    case CardBackMode::SingleImage: return QStringLiteral("single");
    case CardBackMode::RandomCollection: return QStringLiteral("collection");
    }
    return {};
}

template<typename T>
void shuffle(QList<T> &values, QRandomGenerator &random)
{
    for (qsizetype end = values.size(); end > 1; --end) {
        values.swapItemsAt(end - 1, random.bounded(static_cast<quint32>(end)));
    }
}

}

CardBackCollection::CardBackCollection(const QString &dataDirectory, QObject *parent)
    : QObject(parent), dataDirectory_(dataDirectory.isEmpty() ? QString{} : QDir::cleanPath(dataDirectory)),
      directory_(dataDirectory_.isEmpty() ? QString{}
          : QDir(dataDirectory_).filePath(QStringLiteral("back-collection")))
{
    restore();
    if (writable_ && !migrationComplete_) {
        migrate();
    }
    connect(&watcher_, &QFileSystemWatcher::fileChanged, this, [this](const QString &path) {
        for (auto &item : items_) {
            if (managedPath(item.id) == path) {
                refresh(item);
            }
        }
        refreshWatches();
        emit changed();
    });
    connect(&watcher_, &QFileSystemWatcher::directoryChanged, this, [this] {
        for (auto &item : items_) {
            const QFileInfo file(managedPath(item.id));
            if (!safeStorage() || file.exists() != item.file.exists()
                || file.isSymLink() != item.file.isSymLink() || file.size() != item.file.size()
                || file.lastModified() != item.file.lastModified()) {
                refresh(item);
            }
        }
        refreshWatches();
        emit changed();
    });
    refreshWatches();
    if (!startupWarning_.isEmpty()) {
        qWarning("%s", qPrintable(startupWarning_));
    }
}

QString CardBackCollection::manifestPath() const
{
    return dataDirectory_.isEmpty() ? QString{}
        : QDir(dataDirectory_).filePath(QStringLiteral("card-back-collection.json"));
}

QString CardBackCollection::managedPath(const QString &id) const
{
    return !directory_.isEmpty() && validId(id)
        ? QDir(directory_).filePath(id + QStringLiteral(".png")) : QString{};
}

bool CardBackCollection::safeStorage() const
{
    if (dataDirectory_.isEmpty() || !QDir::isAbsolutePath(dataDirectory_)) {
        return false;
    }
    for (const auto &path : {dataDirectory_, directory_}) {
        const QFileInfo info(path);
        if (info.isSymLink() || (info.exists() && !info.isDir())) {
            return false;
        }
    }
    const QFileInfo manifest(manifestPath());
    return !manifest.isSymLink() && (!manifest.exists() || manifest.isFile());
}

bool CardBackCollection::prepareStorage()
{
    if (!writable_ || !safeStorage()) {
        return false;
    }
    for (const auto &path : {dataDirectory_, directory_}) {
        if (!QFileInfo::exists(path)
            && (!QDir().mkpath(path) || !QFile::setPermissions(path, DirectoryPermissions))) {
            return false;
        }
    }
    return true;
}

CardBackResult CardBackCollection::save(const QList<CollectionItem> &items, CardBackMode mode,
                                       bool migrationComplete)
{
    if (!prepareStorage() || modeKey(mode).isEmpty()) {
        return storageFailure();
    }
    QJsonArray ids;
    for (const auto &item : items) {
        ids.append(item.id);
    }
    const QJsonObject object{{QStringLiteral("version"), 1},
                             {QStringLiteral("mode"), modeKey(mode)},
                             {QStringLiteral("migrationComplete"), migrationComplete},
                             {QStringLiteral("images"), ids}};
    const auto bytes = QJsonDocument(object).toJson();
    if (bytes.size() > MaximumManifestBytes) {
        return storageFailure();
    }
    QSaveFile file(manifestPath());
    file.setDirectWriteFallback(false);
    if (!file.open(QIODevice::WriteOnly) || !file.setPermissions(FilePermissions)
        || file.write(bytes) != bytes.size() || !file.commit()) {
        return storageFailure();
    }
    return {};
}

void CardBackCollection::restore()
{
    if (!safeStorage()) {
        writable_ = false;
        startupWarning_ = tr("Private collection storage is unavailable. Existing data was left untouched.");
        return;
    }
    const QFileInfo manifest(manifestPath());
    if (!manifest.exists()) {
        QImage single;
        if (CardBackSettings::readImage(QDir(dataDirectory_).filePath(
                QStringLiteral("card-back.png")), single, true)) {
            mode_ = CardBackMode::SingleImage;
        }
        return;
    }
    QFile file(manifestPath());
    QJsonParseError error;
    const auto bytes = file.open(QIODevice::ReadOnly)
        ? file.read(MaximumManifestBytes + 1) : QByteArray{};
    const auto document = QJsonDocument::fromJson(bytes, &error);
    const auto object = document.object();
    const auto key = object.value(QStringLiteral("mode")).toString();
    bool valid = file.error() == QFileDevice::NoError && bytes.size() <= MaximumManifestBytes
        && error.error == QJsonParseError::NoError && document.isObject()
        && object.value(QStringLiteral("version")).toInt() == 1
        && object.value(QStringLiteral("migrationComplete")).isBool()
        && object.value(QStringLiteral("images")).isArray()
        && (key == "default" || key == "single" || key == "collection");
    QSet<QString> seen;
    QList<CollectionItem> loaded;
    for (const auto value : object.value(QStringLiteral("images")).toArray()) {
        const auto id = value.toString();
        if (!validId(id) || seen.contains(id)) {
            valid = false;
            break;
        }
        seen.insert(id);
        CollectionItem item;
        item.id = id;
        refresh(item);
        loaded.append(item);
    }
    if (!valid) {
        writable_ = false;
        startupWarning_ = tr("The saved collection configuration is invalid or unreadable. "
                             "It was not overwritten. Using the default back.");
        return;
    }
    items_ = loaded;
    mode_ = key == "single" ? CardBackMode::SingleImage
        : key == "collection" ? CardBackMode::RandomCollection : CardBackMode::Default;
    migrationComplete_ = object.value(QStringLiteral("migrationComplete")).toBool();
}

void CardBackCollection::refresh(CollectionItem &item)
{
    item.file = QFileInfo(managedPath(item.id));
    item.thumbnail = {};
    item.warning.clear();
    QImage image;
    if (!safeStorage() || !CardBackSettings::readImage(item.file.filePath(), image, true)
        || imageId(image) != item.id) {
        item.warning = tr("Saved image missing or invalid. New games use the built-in fallback.");
        return;
    }
    item.thumbnail = image.scaled(60, 84, Qt::KeepAspectRatio, Qt::SmoothTransformation);
}

void CardBackCollection::refreshWatches()
{
    QStringList desired;
    if (safeStorage()) {
        for (const auto &path : {dataDirectory_, directory_}) {
            if (QFileInfo(path).isDir()) {
                desired << path;
            }
        }
        for (const auto &item : items_) {
            const auto path = managedPath(item.id);
            const QFileInfo info(path);
            if (info.isFile() && !info.isSymLink()) {
                desired << path;
            }
        }
    }
    const auto current = watcher_.files() + watcher_.directories();
    for (const auto &path : current) {
        if (!desired.contains(path)) {
            watcher_.removePath(path);
        }
    }
    for (const auto &path : desired) {
        if (!current.contains(path) && !watcher_.addPath(path)) {
            qWarning("Cardsy could not watch a private collection image or directory.");
        }
    }
}

CardBackResult CardBackCollection::setMode(CardBackMode mode)
{
    if (mode == mode_) {
        return {};
    }
    const auto result = save(items_, mode, migrationComplete_);
    if (!result) {
        return result;
    }
    mode_ = mode;
    emit modeChanged();
    return {};
}

CardBackResult CardBackCollection::add(const QImage &image, bool &duplicate)
{
    const auto id = imageId(image);
    duplicate = std::any_of(items_.begin(), items_.end(),
                            [&id](const auto &item) { return item.id == id; });
    if (duplicate) {
        return {};
    }
    if (!prepareStorage()) {
        return storageFailure();
    }
    const auto path = managedPath(id);
    const QFileInfo target(path);
    // An unreferenced file may belong to a user or an interrupted import; never overwrite it.
    if (target.exists() || target.isSymLink()) {
        return storageFailure();
    }
    QSaveFile file(path);
    file.setDirectWriteFallback(false);
    QImageWriter writer(&file, "png");
    if (!file.open(QIODevice::WriteOnly) || !file.setPermissions(FilePermissions)
        || !writer.write(image) || !file.commit()) {
        return storageFailure();
    }
    CollectionItem item;
    item.id = id;
    item.thumbnail = image.scaled(60, 84, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    item.file = QFileInfo(path);
    auto next = items_;
    next.append(item);
    const auto result = save(next, mode_, migrationComplete_);
    if (!result) {
        if (!QFile::remove(path)) {
            qWarning("Cardsy could not remove an unrecorded import after a failed configuration save.");
        }
        return result;
    }
    items_ = next;
    return {};
}

CardBackImportSummary CardBackCollection::importImages(
    const QStringList &sources, const std::function<bool(int)> &progress)
{
    CardBackImportSummary summary;
    int processed = 0;
    for (const auto &source : sources) {
        if (progress && !progress(processed)) {
            summary.canceled = true;
            break;
        }
        QImage image;
        auto result = CardBackSettings::readImage(source, image);
        bool duplicate = false;
        if (result) {
            result = add(image, duplicate);
        }
        if (!result) {
            ++summary.failed;
            summary.details << tr("%1: %2").arg(QFileInfo(source).fileName(), result.message);
        } else if (duplicate) {
            ++summary.duplicates;
        } else {
            ++summary.imported;
        }
        ++processed;
    }
    if (summary.imported) {
        refreshWatches();
        emit changed();
    }
    return summary;
}

CardBackResult CardBackCollection::removeImages(const QStringList &ids)
{
    if (ids.isEmpty()) {
        return {};
    }
    if (!writable_ || !safeStorage()) {
        return storageFailure();
    }
    const QSet<QString> selected(ids.begin(), ids.end());
    QList<CollectionItem> next;
    QStringList paths;
    for (const auto &id : selected) {
        if (std::none_of(items_.begin(), items_.end(),
                         [&id](const auto &item) { return item.id == id; })) {
            return {CardBackError::InvalidFile, tr("The selected collection image no longer exists.")};
        }
    }
    for (const auto &item : items_) {
        if (!selected.contains(item.id)) {
            next.append(item);
            continue;
        }
        const QFileInfo file(managedPath(item.id));
        if (file.isSymLink() || (file.exists() && !file.isFile())) {
            return storageFailure();
        }
        if (file.exists()) {
            paths << file.filePath();
        }
    }
    const auto result = save(next, mode_, migrationComplete_);
    if (!result) {
        return result;
    }
    items_ = next;
    bool failed = false;
    for (const auto &path : paths) {
        const QFileInfo file(path);
        if (file.isSymLink() || !file.isFile() || !QFile::remove(path)) {
            failed = true;
        }
    }
    refreshWatches();
    emit changed();
    if (failed) {
        return {CardBackError::StorageFailed,
                tr("Collection records removed, but some private files could not be deleted. "
                   "Current-game images and original source files are unchanged.")};
    }
    return {};
}

CardBackResult CardBackCollection::clear()
{
    QStringList ids;
    for (const auto &item : items_) {
        ids << item.id;
    }
    return removeImages(ids);
}

void CardBackCollection::migrate()
{
    const auto legacyDirectory = QDir(dataDirectory_).filePath(QStringLiteral("card-backs"));
    bool failed = QFileInfo(legacyDirectory).isSymLink()
        || (QFileInfo::exists(legacyDirectory) && !QFileInfo(legacyDirectory).isDir());
    bool found = false;
    if (!failed) {
        for (unsigned index = 0; index < 52; ++index) {
            const auto path = QDir(legacyDirectory).filePath(
                cardBackKey(static_cast<CardId>(index)) + QStringLiteral(".png"));
            const QFileInfo file(path);
            if (!file.exists() && !file.isSymLink()) {
                continue;
            }
            found = true;
            QImage image;
            bool duplicate = false;
            if (!CardBackSettings::readImage(path, image, true) || !add(image, duplicate)) {
                failed = true;
            }
        }
    }
    const auto nextMode = found && !items_.isEmpty() ? CardBackMode::RandomCollection : mode_;
    const auto result = save(items_, nextMode, !failed);
    if (!result) {
        failed = true;
    } else {
        mode_ = nextMode;
        migrationComplete_ = !failed;
    }
    if (failed) {
        startupWarning_ = tr("Some legacy card images could not be migrated. "
                             "Original private files were preserved; migration will retry next launch.");
    } else if (found) {
        startupWarning_ = tr("Legacy card images were copied into the randomized collection. "
                             "Old private copies were retained for recovery; card associations are no longer used.");
    }
}

GameCardBacks CardBackCollection::beginGame(QRandomGenerator &random) const
{
    GameCardBacks result;
    if (!safeStorage()) {
        qWarning("Cardsy cannot read the private collection for this game; using built-in backs.");
        return result;
    }
    QList<QString> candidates;
    for (const auto &item : items_) {
        if (item.warning.isEmpty()) {
            candidates << item.id;
        }
    }
    shuffle(candidates, random);
    QList<QString> ids;
    QList<QImage> images;
    for (const auto &id : candidates) {
        QImage image;
        if (!CardBackSettings::readImage(managedPath(id), image, true) || imageId(image) != id) {
            qWarning("Cardsy skipped an unavailable collection image while starting a game.");
            continue;
        }
        ids << id;
        images << image;
        if (ids.size() == 52) {
            break;
        }
    }
    if (ids.isEmpty()) {
        return result;
    }
    QList<int> assignments;
    for (int index = 0; index < 52; ++index) {
        assignments << index % ids.size();
    }
    shuffle(assignments, random);
    for (unsigned index = 0; index < 52; ++index) {
        result.ids[index] = ids[assignments[index]];
        result.images[index] = images[assignments[index]];
    }
    return result;
}

}
