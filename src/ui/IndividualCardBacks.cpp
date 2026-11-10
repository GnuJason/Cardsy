#include "IndividualCardBacks.h"
#include "CardBackIdentity.h"

#include <QDir>
#include <QFile>
#include <QImageWriter>
#include <QSaveFile>

namespace cardsy::ui {
namespace {

constexpr auto FilePermissions = QFileDevice::ReadOwner | QFileDevice::WriteOwner;
constexpr auto DirectoryPermissions = FilePermissions | QFileDevice::ExeOwner;

bool valid(CardId id)
{
    return static_cast<unsigned>(id) < 52;
}

CardBackResult storageFailure()
{
    return {CardBackError::StorageFailed,
            IndividualCardBacks::tr("Unable to update private card images. "
                                   "The previous assignment has been kept.")};
}

CardBackResult invalidIdentity()
{
    return {CardBackError::InvalidFile, IndividualCardBacks::tr("Choose a standard playing card.")};
}

}

IndividualCardBacks::IndividualCardBacks(const QString &dataDirectory, QObject *parent)
    : QObject(parent), dataDirectory_(dataDirectory),
      directory_(dataDirectory.isEmpty() ? QString{}
          : QDir(dataDirectory).filePath(QStringLiteral("card-backs")))
{
    connect(&watcher_, &QFileSystemWatcher::fileChanged, this, [this](const QString &path) {
        for (unsigned index = 0; index < entries_.size(); ++index) {
            const auto id = static_cast<CardId>(index);
            if (managedPath(id) == path) {
                refresh(id, true);
                break;
            }
        }
        refreshWatches();
    });
    connect(&watcher_, &QFileSystemWatcher::directoryChanged, this, [this] {
        for (unsigned index = 0; index < entries_.size(); ++index) {
            refresh(static_cast<CardId>(index), false);
        }
        refreshWatches();
    });
    for (unsigned index = 0; index < entries_.size(); ++index) {
        refresh(static_cast<CardId>(index), true);
    }
    refreshWatches();
}

QString IndividualCardBacks::managedPath(CardId id) const
{
    return valid(id) && !directory_.isEmpty()
        ? QDir(directory_).filePath(cardBackKey(id) + QStringLiteral(".png")) : QString{};
}

bool IndividualCardBacks::safeDirectory() const
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
    return true;
}

bool IndividualCardBacks::prepareDirectory()
{
    if (!safeDirectory()) {
        return false;
    }
    if (QFileInfo(directory_).exists()) {
        return QFileInfo(directory_).isWritable();
    }
    return QDir().mkpath(directory_) && QFile::setPermissions(directory_, DirectoryPermissions);
}

const QImage &IndividualCardBacks::image(CardId id) const
{
    static const QImage empty;
    return valid(id) ? entries_[static_cast<unsigned>(id)].image : empty;
}

bool IndividualCardBacks::hasAssignment(CardId id) const
{
    return valid(id) && (entries_[static_cast<unsigned>(id)].file.exists()
                        || entries_[static_cast<unsigned>(id)].file.isSymLink());
}

QString IndividualCardBacks::warning(CardId id) const
{
    return valid(id) ? entries_[static_cast<unsigned>(id)].warning : invalidIdentity().message;
}

void IndividualCardBacks::refresh(CardId id, bool force)
{
    auto &entry = entries_[static_cast<unsigned>(id)];
    const QFileInfo file(managedPath(id));
    const bool safe = safeDirectory();
    if (!force && safe && file.exists() == entry.file.exists()
        && file.isSymLink() == entry.file.isSymLink() && file.size() == entry.file.size()
        && file.lastModified() == entry.file.lastModified()) {
        return;
    }
    entry.file = file;
    entry.image = {};
    entry.warning.clear();
    if (!safe) {
        entry.warning = tr("Private image storage is unavailable. Using the default back.");
    } else if (file.exists() || file.isSymLink()) {
        const auto result = CardBackSettings::readImage(file.filePath(), entry.image, true);
        if (!result) {
            entry.warning = tr("Saved image unavailable or invalid. Using the default back.");
        }
    }
    emit changed(id);
}

void IndividualCardBacks::refreshWatches()
{
    QStringList desired;
    if (safeDirectory()) {
        for (const auto &path : {dataDirectory_, directory_}) {
            if (QFileInfo(path).isDir()) {
                desired << path;
            }
        }
        for (unsigned index = 0; index < entries_.size(); ++index) {
            const auto path = managedPath(static_cast<CardId>(index));
            const QFileInfo file(path);
            if (file.isFile() && !file.isSymLink()) {
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
            qWarning("Cardsy could not watch a private card-back file or directory.");
        }
    }
}

CardBackResult IndividualCardBacks::assign(CardId id, const QString &source)
{
    if (!valid(id)) {
        return invalidIdentity();
    }
    QImage candidate;
    const auto decoded = CardBackSettings::readImage(source, candidate);
    if (!decoded) {
        return decoded;
    }
    if (!prepareDirectory()) {
        return storageFailure();
    }
    const QFileInfo target(managedPath(id));
    if (target.isSymLink() || (target.exists() && !target.isFile())) {
        return storageFailure();
    }
    if (QFileInfo(source).canonicalFilePath() == target.canonicalFilePath()) {
        return {CardBackError::InvalidFile, tr("Choose an original image, not its private copy.")};
    }
    QSaveFile file(target.filePath());
    file.setDirectWriteFallback(false);
    if (!file.open(QIODevice::WriteOnly) || !file.setPermissions(FilePermissions)) {
        return storageFailure();
    }
    QImageWriter writer(&file, "png");
    if (!writer.write(candidate) || !file.commit()) {
        return storageFailure();
    }
    auto &entry = entries_[static_cast<unsigned>(id)];
    entry.image = candidate;
    entry.file = QFileInfo(target.filePath());
    entry.warning.clear();
    refreshWatches();
    emit changed(id);
    return {};
}

CardBackResult IndividualCardBacks::reset(CardId id)
{
    if (!valid(id)) {
        return invalidIdentity();
    }
    if (!safeDirectory()) {
        return storageFailure();
    }
    const QFileInfo target(managedPath(id));
    if ((target.exists() || target.isSymLink())
        && (!target.isFile() || target.isSymLink() || !QFile::remove(target.filePath()))) {
        return storageFailure();
    }
    entries_[static_cast<unsigned>(id)] = {};
    refreshWatches();
    emit changed(id);
    return {};
}

CardBackResult IndividualCardBacks::resetRange(unsigned begin, unsigned end)
{
    bool failed = false;
    for (auto index = begin; index < end; ++index) {
        if (!reset(static_cast<CardId>(index))) {
            failed = true;
        }
    }
    if (failed) {
        return {CardBackError::StorageFailed,
                tr("Some card backs could not be reset. Those assignments have been kept; "
                   "any successful resets have been applied. Check private storage permissions.")};
    }
    return {};
}

CardBackResult IndividualCardBacks::resetSuit(Suit suit)
{
    if (!isValid(suit)) {
        return invalidIdentity();
    }
    const auto begin = static_cast<unsigned>(suit) * 13;
    return resetRange(begin, begin + 13);
}

CardBackResult IndividualCardBacks::resetAll()
{
    return resetRange(0, 52);
}

}
