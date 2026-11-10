#include "CardBackSettings.h"
#include "app/ApplicationIdentity.h"

#include <QBuffer>
#include <QCoreApplication>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QImageReader>
#include <QImageWriter>
#include <QPainter>
#include <QSaveFile>
#include <QStandardPaths>
#include <QStringList>

#include <algorithm>

namespace cardsy::ui {
namespace {

constexpr auto PrivateFilePermissions = QFileDevice::ReadOwner | QFileDevice::WriteOwner;
constexpr auto PrivateDirectoryPermissions = PrivateFilePermissions | QFileDevice::ExeOwner;

CardBackResult failure(CardBackError error)
{
    switch (error) {
    case CardBackError::InvalidFile:
        return {error, CardBackSettings::tr("Choose a readable local image file.")};
    case CardBackError::UnsupportedFormat:
        return {error, CardBackSettings::tr("Choose a supported PNG or JPEG image.")};
    case CardBackError::InputTooLarge:
        return {error, CardBackSettings::tr("The image exceeds Cardsy's safety limits "
                                           "(20 MiB, 8192 pixels per side, 16 megapixels).")};
    case CardBackError::InvalidDimensions:
    case CardBackError::DecodeFailed:
        return {error, CardBackSettings::tr("The image is invalid, incomplete, or cannot be decoded safely.")};
    case CardBackError::StorageFailed:
        return {error, CardBackSettings::tr("Unable to update the private card back. "
                                           "Your current card back has been kept.")};
    case CardBackError::None:
        return {};
    }
    return {error, CardBackSettings::tr("Unable to change the card back.")};
}

CardBackResult decodeImage(const QString &fileName, QImage &normalized, bool managed)
{
    QFileInfo info(fileName);
    if (fileName.isEmpty() || !info.isFile() || !info.isReadable()
        || (managed && info.isSymLink())) {
        return failure(CardBackError::InvalidFile);
    }
    if (info.size() > CardBackSettings::MaximumInputBytes) {
        return failure(CardBackError::InputTooLarge);
    }
    QFile file(fileName);
    if (!file.open(QIODevice::ReadOnly)) {
        return failure(CardBackError::InvalidFile);
    }
    const auto bytes = file.read(CardBackSettings::MaximumInputBytes + 1);
    if (file.error() != QFileDevice::NoError) {
        return failure(CardBackError::InvalidFile);
    }
    if (bytes.size() > CardBackSettings::MaximumInputBytes) {
        return failure(CardBackError::InputTooLarge);
    }
    if (bytes.isEmpty()) {
        return failure(CardBackError::DecodeFailed);
    }
    QBuffer buffer;
    buffer.setData(bytes);
    if (!buffer.open(QIODevice::ReadOnly)) {
        return failure(CardBackError::DecodeFailed);
    }
    QImageReader reader(&buffer);
    reader.setDecideFormatFromContent(true);
    reader.setAutoTransform(true);
    const auto format = reader.format().toLower();
    const bool png = format == "png";
    const bool jpeg = format == "jpeg" || format == "jpg";
    if ((!png && !jpeg) || (managed && !png)) {
        return failure(CardBackError::UnsupportedFormat);
    }
    const auto size = reader.size();
    if (size.width() <= 0 || size.height() <= 0) {
        return failure(CardBackError::InvalidDimensions);
    }
    if (size.width() > CardBackSettings::MaximumInputDimension
        || size.height() > CardBackSettings::MaximumInputDimension
        || qint64{size.width()} * size.height() > CardBackSettings::MaximumInputPixels) {
        return failure(CardBackError::InputTooLarge);
    }
    if (managed && size != CardBackSettings::normalizedSize()) {
        return failure(CardBackError::InvalidDimensions);
    }
    // JPEG decoders may recover a partial image; do not accept missing end markers.
    if ((png && !bytes.endsWith(QByteArray::fromHex("0000000049454e44ae426082")))
        || (jpeg && !bytes.endsWith(QByteArray::fromHex("ffd9")))) {
        return failure(CardBackError::DecodeFailed);
    }
    if (size.width() > 2048 || size.height() > 2048) {
        reader.setScaledSize(size.scaled({2048, 2048}, Qt::KeepAspectRatio));
    }
    const auto decoded = reader.read();
    if (decoded.isNull() || reader.error() != QImageReader::UnknownError) {
        return failure(CardBackError::DecodeFailed);
    }
    normalized = QImage(CardBackSettings::normalizedSize(), QImage::Format_RGB32);
    if (normalized.isNull()) {
        return failure(CardBackError::DecodeFailed);
    }
    normalized.fill(Qt::white);
    const auto scale = std::max(static_cast<qreal>(normalized.width()) / decoded.width(),
                                static_cast<qreal>(normalized.height()) / decoded.height());
    const QSizeF sourceSize(normalized.width() / scale, normalized.height() / scale);
    const QRectF source((decoded.width() - sourceSize.width()) / 2,
                         (decoded.height() - sourceSize.height()) / 2,
                         sourceSize.width(), sourceSize.height());
    QPainter painter(&normalized);
    painter.setRenderHint(QPainter::SmoothPixmapTransform);
    painter.drawImage(QRectF(normalized.rect()), decoded, source);
    painter.end();
    return {};
}

}

CardBackResult CardBackSettings::readImage(const QString &fileName, QImage &normalized, bool managed)
{
    if (QImageReader::allocationLimit() <= 0 || QImageReader::allocationLimit() > 64) {
        QImageReader::setAllocationLimit(64);
    }
    return decodeImage(fileName, normalized, managed);
}

CardBackSettings::CardBackSettings(QObject *parent)
    : CardBackSettings(QStandardPaths::writableLocation(QStandardPaths::AppDataLocation), parent)
{
    if (QCoreApplication::applicationName() == QString::fromLatin1(build::ApplicationId)
        && QCoreApplication::organizationName().isEmpty() && !QFileInfo(directory_).exists()) {
        migrateDevelopmentBack();
    }
}

CardBackSettings::CardBackSettings(const QString &dataDirectory, QObject *parent)
    : QObject(parent), directory_(dataDirectory.isEmpty() ? QString{} : QDir::cleanPath(dataDirectory))
{
    if (QImageReader::allocationLimit() <= 0 || QImageReader::allocationLimit() > 64) {
        QImageReader::setAllocationLimit(64);
    }
    restore();
}

QString CardBackSettings::managedPath() const
{
    return directory_.isEmpty() ? QString{} : QDir(directory_).filePath(QStringLiteral("card-back.png"));
}

QString CardBackSettings::fileFilter()
{
    const auto formats = QImageReader::supportedImageFormats();
    QStringList extensions;
    if (formats.contains("png")) {
        extensions << QStringLiteral("*.png");
    }
    if (formats.contains("jpeg") || formats.contains("jpg")) {
        extensions << QStringLiteral("*.jpg") << QStringLiteral("*.jpeg");
    }
    return tr("Local images (%1)").arg(extensions.join(QLatin1Char(' ')));
}

void CardBackSettings::migrateDevelopmentBack()
{
    const auto legacyDirectory = app::developmentDataDirectory();
    if (directory_.isEmpty() || !QDir::isAbsolutePath(directory_) || legacyDirectory.isEmpty()) {
        return;
    }
    const auto legacyPath = QDir(legacyDirectory).filePath(QStringLiteral("card-back.png"));
    const QFileInfo legacy(legacyPath);
    if (!legacy.exists() && !legacy.isSymLink()) {
        return;
    }
    QImage candidate;
    if (QFileInfo(legacyDirectory).isSymLink() || !readImage(legacyPath, candidate, true)) {
        startupWarning_ = tr("The development card back is invalid or unavailable. "
                             "Using the default; the old private copy was left untouched.");
        return;
    }
    if (!persistImage(candidate)) {
        startupWarning_ = tr("The development card back could not be migrated. "
                             "Using the default; the old private copy was left untouched.");
        return;
    }
    if (!QFile::remove(legacyPath)) {
        startupWarning_ = tr("The card back was migrated, but its old development copy "
                             "could not be removed.");
    }
}

void CardBackSettings::restore()
{
    if (directory_.isEmpty() || !QDir::isAbsolutePath(directory_)) {
        startupWarning_ = tr("Cardsy's private data location is unavailable. Using the default card back.");
        return;
    }
    const QFileInfo saved(managedPath());
    if (!saved.exists() && !saved.isSymLink()) {
        return;
    }
    QImage candidate;
    if (!QFileInfo(directory_).isSymLink() && readImage(managedPath(), candidate, true)) {
        image_ = candidate;
        return;
    }
    startupWarning_ = tr("The saved card back is unavailable or invalid. Using the default card back.");
    if (!QFileInfo(directory_).isSymLink() && (saved.isFile() || saved.isSymLink())) {
        if (!QFile::remove(managedPath())) {
            startupWarning_ += tr(" The invalid private copy could not be removed.");
        }
    }
}

bool CardBackSettings::prepareDirectory()
{
    if (directory_.isEmpty() || !QDir::isAbsolutePath(directory_)) {
        return false;
    }
    const QFileInfo directory(directory_);
    if (directory.isSymLink() || (directory.exists() && !directory.isDir())) {
        return false;
    }
    if (!QDir().mkpath(directory_)
        || !QFile::setPermissions(directory_, PrivateDirectoryPermissions)) {
        return false;
    }
    const QFileInfo saved(managedPath());
    return !saved.isSymLink() && (!saved.exists() || saved.isFile());
}

CardBackResult CardBackSettings::installImage(const QString &fileName)
{
    const QFileInfo source(fileName);
    if (source.exists() && source.canonicalFilePath() == QFileInfo(managedPath()).canonicalFilePath()) {
        return failure(CardBackError::InvalidFile);
    }
    QImage candidate;
    const auto decoded = readImage(fileName, candidate);
    if (!decoded) {
        return decoded;
    }
    return persistImage(candidate);
}

CardBackResult CardBackSettings::persistImage(const QImage &candidate)
{
    if (!prepareDirectory()) {
        return failure(CardBackError::StorageFailed);
    }
    QSaveFile file(managedPath());
    file.setDirectWriteFallback(false);
    if (!file.open(QIODevice::WriteOnly) || !file.setPermissions(PrivateFilePermissions)) {
        return failure(CardBackError::StorageFailed);
    }
    QImageWriter writer(&file, "png");
    if (!writer.write(candidate) || !file.commit()) {
        return failure(CardBackError::StorageFailed);
    }
    image_ = candidate;
    emit changed();
    return {};
}

CardBackResult CardBackSettings::useDefault()
{
    if (directory_.isEmpty() || !QDir::isAbsolutePath(directory_)) {
        return failure(CardBackError::StorageFailed);
    }
    const QFileInfo directory(directory_);
    if (directory.isSymLink() || (directory.exists() && !directory.isDir())
        || (!directory.exists() && !prepareDirectory())) {
        return failure(CardBackError::StorageFailed);
    }
    const QFileInfo saved(managedPath());
    if (saved.exists() || saved.isSymLink()) {
        if (QFileInfo(directory_).isSymLink() || !QFile::remove(managedPath())) {
            return failure(CardBackError::StorageFailed);
        }
    }
    image_ = QImage{};
    emit changed();
    return {};
}

}
