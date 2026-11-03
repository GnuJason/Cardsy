#include "ImageTestSupport.h"
#include "ui/CardBackSettings.h"

#include <QDir>
#include <QFileInfo>
#include <QImageReader>
#include <QSignalSpy>
#include <QStandardPaths>
#include <QTemporaryDir>
#include <QTest>

using namespace cardsy::ui;
using namespace cardsy::ui::test;

class CardBackSettingsTest : public QObject
{
    Q_OBJECT

private slots:
    void acceptsRealFormatsRegardlessOfExtension_data()
    {
        QTest::addColumn<QByteArray>("format");
        QTest::newRow("png") << QByteArray("PNG");
        QTest::newRow("jpeg") << QByteArray("JPEG");
    }

    void acceptsRealFormatsRegardlessOfExtension()
    {
        QFETCH(QByteArray, format);
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.not-an-image-extension"));
        const auto original = encodeImage(syntheticImage(), format.constData());
        writeBytes(source, original);
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QSignalSpy changed(&settings, &CardBackSettings::changed);
        QVERIFY(settings.installImage(source));
        QVERIFY(settings.isCustom());
        QCOMPARE(settings.image().size(), CardBackSettings::normalizedSize());
        QCOMPARE(settings.image().format(), QImage::Format_RGB32);
        QVERIFY(settings.image().pixelColor(300, 420).green() > 200);
        QCOMPARE(changed.count(), 1);
        QCOMPARE(readBytes(source), original);
        QImageReader reader(settings.managedPath());
        QCOMPARE(reader.format(), QByteArray("png"));
        QCOMPARE(reader.size(), CardBackSettings::normalizedSize());
        QVERIFY(!reader.read().isNull());
        QVERIFY(QImageReader::allocationLimit() > 0);
        QVERIFY(QImageReader::allocationLimit() <= 64);
    }

    void invalidFiles_data()
    {
        QTest::addColumn<QByteArray>("bytes");
        QTest::newRow("non-image") << QByteArray("This is not an image.");
        QTest::newRow("empty") << QByteArray{};
        QTest::newRow("corrupt-png") << QByteArray::fromHex("89504e470d0a1a0a00000000");
        auto png = encodeImage(syntheticImage());
        QTest::newRow("truncated-png") << png.left(png.size() / 2);
        auto jpeg = encodeImage(syntheticImage(), "JPEG");
        QTest::newRow("truncated-jpeg") << jpeg.left(jpeg.size() - 2);
        QTest::newRow("unsupported-bmp") << encodeImage(syntheticImage(), "BMP");
    }

    void invalidFiles()
    {
        QFETCH(QByteArray, bytes);
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("bad.png"));
        writeBytes(source, bytes);
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QSignalSpy changed(&settings, &CardBackSettings::changed);
        const auto result = settings.installImage(source);
        QVERIFY(!result);
        QVERIFY(!result.message.isEmpty());
        QVERIFY(!result.message.contains(source));
        QVERIFY(!settings.isCustom());
        QVERIFY(!QFileInfo::exists(settings.managedPath()));
        QCOMPARE(changed.count(), 0);
    }

    void rejectsMissingDirectoryAndUnreadableSource()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QCOMPARE(settings.installImage(directory.filePath(QStringLiteral("absent"))).error,
                 CardBackError::InvalidFile);
        QCOMPARE(settings.installImage(directory.path()).error, CardBackError::InvalidFile);
        const auto source = directory.filePath(QStringLiteral("no-permission.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        QVERIFY(QFile::setPermissions(source, {}));
        const auto result = settings.installImage(source);
        QVERIFY(QFile::setPermissions(source, QFileDevice::ReadOwner | QFileDevice::WriteOwner));
        QCOMPARE(result.error, CardBackError::InvalidFile);
    }

    void rejectsEncodedFileOverLimit()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("too-large.png"));
        {
            QFile file(source);
            QVERIFY(file.open(QIODevice::WriteOnly));
            QVERIFY(file.resize(CardBackSettings::MaximumInputBytes + 1));
        }
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QCOMPARE(settings.installImage(source).error, CardBackError::InputTooLarge);
        QVERIFY(!settings.isCustom());
    }

    void rejectsExcessDimensionsBeforeDecoding_data()
    {
        QTest::addColumn<QSize>("size");
        QTest::newRow("width") << QSize(8193, 1);
        QTest::newRow("height") << QSize(1, 8193);
        QTest::newRow("pixel-count") << QSize(4096, 4097);
        QTest::newRow("very-large") << QSize(100000, 100000);
    }

    void rejectsExcessDimensionsBeforeDecoding()
    {
        QFETCH(QSize, size);
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("declared-large.png"));
        writeBytes(source, pngWithDeclaredSize(size));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QCOMPARE(settings.installImage(source).error, CardBackError::InputTooLarge);
        QVERIFY(!settings.isCustom());
    }

    void acceptsDimensionBoundaryAndDownscales()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("wide.png"));
        writeBytes(source, encodeImage(syntheticImage({8192, 8})));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        QCOMPARE(settings.image().size(), QSize(600, 840));
        const auto stored = QImage(settings.managedPath());
        QCOMPARE(stored.size(), QSize(600, 840));
        QVERIFY(stored.sizeInBytes() <= 600 * 840 * 4);
    }

    void normalizesCenterCoverWithoutSourceMetadataOrTransparency()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("bands.png"));
        auto image = syntheticImage({1200, 600});
        image.setText(QStringLiteral("Description"), QStringLiteral("Synthetic test metadata"));
        writeBytes(source, encodeImage(image));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        for (auto point : {QPoint(10, 10), QPoint(300, 420), QPoint(590, 830)}) {
            QCOMPARE(settings.image().pixelColor(point), QColor(Qt::green));
        }
        QVERIFY(QImage(settings.managedPath()).textKeys().isEmpty());
        QImage transparent({100, 100}, QImage::Format_ARGB32);
        transparent.fill(Qt::transparent);
        writeBytes(source, encodeImage(transparent));
        QVERIFY(settings.installImage(source));
        QCOMPARE(settings.image().pixelColor(300, 420), QColor(Qt::white));
        QVERIFY(!settings.image().hasAlphaChannel());
    }

    void honorsJpegOrientation()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("rotated.jpg"));
        writeBytes(source, orientedJpeg());
        QImageReader probe(source);
        QCOMPARE(probe.transformation(), QImageIOHandler::TransformationRotate90);
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        const auto top = settings.image().pixelColor(300, 100);
        const auto bottom = settings.image().pixelColor(300, 740);
        QVERIFY(top.red() > 200 && top.blue() < 30);
        QVERIFY(bottom.blue() > 200 && bottom.red() < 30);
        QCOMPARE(QImageReader(settings.managedPath()).transformation(),
                 QImageIOHandler::TransformationNone);
    }

    void privateCopySurvivesOriginalRemovalAndObjectRecreation()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        const auto data = directory.filePath(QStringLiteral("private"));
        writeBytes(source, encodeImage(syntheticImage()));
        QImage expected;
        {
            CardBackSettings settings(data);
            QVERIFY(settings.installImage(source));
            expected = settings.image();
        }
        QVERIFY(QFile::remove(source));
        CardBackSettings restarted(data);
        QVERIFY(restarted.isCustom());
        QVERIFY(restarted.image() == expected);
        QVERIFY(restarted.startupWarning().isEmpty());
    }

    void resetDeletesOnlyManagedCopy()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        const auto original = encodeImage(syntheticImage());
        writeBytes(source, original);
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        QVERIFY(settings.useDefault());
        QVERIFY(!settings.isCustom());
        QVERIFY(!QFileInfo::exists(settings.managedPath()));
        QCOMPARE(readBytes(source), original);
        CardBackSettings restarted(directory.filePath(QStringLiteral("private")));
        QVERIFY(!restarted.isCustom());
    }

    void failedReplacementPreservesActiveAndPersistedImage()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        const auto data = directory.filePath(QStringLiteral("private"));
        CardBackSettings settings(data);
        QVERIFY(settings.installImage(source));
        const auto image = settings.image();
        const auto stored = readBytes(settings.managedPath());
        writeBytes(source, QByteArray("invalid"));
        QSignalSpy changed(&settings, &CardBackSettings::changed);
        QVERIFY(!settings.installImage(source));
        QCOMPARE(changed.count(), 0);
        QVERIFY(settings.image() == image);
        QCOMPARE(readBytes(settings.managedPath()), stored);
        CardBackSettings restarted(data);
        QVERIFY(restarted.image() == image);
        QCOMPARE(settings.installImage(settings.managedPath()).error, CardBackError::InvalidFile);
        QCOMPARE(readBytes(settings.managedPath()), stored);
    }

    void startupMissingCorruptAndUnreadableCopiesFallBack()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        const auto data = directory.filePath(QStringLiteral("private"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings settings(data);
        QVERIFY(settings.installImage(source));
        QVERIFY(QFile::remove(settings.managedPath()));
        CardBackSettings missing(data);
        QVERIFY(!missing.isCustom());
        writeBytes(settings.managedPath(), QByteArray("corrupt"));
        CardBackSettings corrupt(data);
        QVERIFY(!corrupt.isCustom());
        QVERIFY(!corrupt.startupWarning().isEmpty());
        QVERIFY(!QFileInfo::exists(settings.managedPath()));
        CardBackSettings repaired(data);
        QVERIFY(repaired.startupWarning().isEmpty());
        QVERIFY(settings.installImage(source));
        QVERIFY(QFile::setPermissions(settings.managedPath(), {}));
        CardBackSettings unreadable(data);
        QVERIFY(!unreadable.isCustom());
        QVERIFY(!unreadable.startupWarning().isEmpty());
        QVERIFY(!QFileInfo::exists(settings.managedPath()));
        QVERIFY(QFileInfo::exists(source));
    }

    void storageFailureAndResetFailureRetainActiveImage()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        const auto blocker = directory.filePath(QStringLiteral("not-a-directory"));
        writeBytes(blocker, QByteArray("blocker"));
        CardBackSettings unavailable(blocker + QStringLiteral("/private"));
        QCOMPARE(unavailable.installImage(source).error, CardBackError::StorageFailed);
        QVERIFY(!unavailable.isCustom());
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        const auto image = settings.image();
        const auto backup = directory.filePath(QStringLiteral("backup.png"));
        QVERIFY(QFile::rename(settings.managedPath(), backup));
        QVERIFY(QDir().mkdir(settings.managedPath()));
        QCOMPARE(settings.installImage(source).error, CardBackError::StorageFailed);
        QCOMPARE(settings.useDefault().error, CardBackError::StorageFailed);
        QVERIFY(settings.image() == image);
        QVERIFY(QFileInfo::exists(source));
        QVERIFY(QFileInfo::exists(backup));
        QVERIFY(QDir(settings.managedPath()).entryList(QDir::Files).isEmpty());
    }

    void atomicSaveFailurePreservesPreviousPrivateFile()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        const auto image = settings.image();
        const auto bytes = readBytes(settings.managedPath());
        QImage replacement({200, 200}, QImage::Format_RGB32);
        replacement.fill(Qt::yellow);
        writeBytes(source, encodeImage(replacement));
        QVERIFY(QFile::setPermissions(settings.managedPath(), QFileDevice::ReadOwner));
        const auto result = settings.installImage(source);
        QVERIFY(QFile::setPermissions(settings.managedPath(),
                                      QFileDevice::ReadOwner | QFileDevice::WriteOwner));
        QCOMPARE(result.error, CardBackError::StorageFailed);
        QVERIFY(settings.image() == image);
        QCOMPARE(readBytes(settings.managedPath()), bytes);
        CardBackSettings restarted(directory.filePath(QStringLiteral("private")));
        QVERIFY(restarted.image() == image);
    }

    void createsOwnerOnlyStorage()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        const auto data = directory.filePath(QStringLiteral("private"));
        CardBackSettings settings(data);
        QVERIFY(settings.installImage(source));
        const auto publicAccess = QFileDevice::ReadGroup | QFileDevice::WriteGroup
            | QFileDevice::ExeGroup | QFileDevice::ReadOther | QFileDevice::WriteOther
            | QFileDevice::ExeOther;
        QVERIFY(!(QFileInfo(data).permissions() & publicAccess));
        QVERIFY(!(QFileInfo(settings.managedPath()).permissions() & publicAccess));
        QCOMPARE(QDir(data).entryList(QDir::Files).size(), 1);
    }

    void managedSymlinkDoesNotDeleteOrOverwriteSource()
    {
#ifdef Q_OS_UNIX
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        const auto bytes = encodeImage(syntheticImage());
        writeBytes(source, bytes);
        const auto data = directory.filePath(QStringLiteral("private"));
        QVERIFY(QDir().mkdir(data));
        const auto managed = QDir(data).filePath(QStringLiteral("card-back.png"));
        QVERIFY(QFile::link(source, managed));
        CardBackSettings settings(data);
        QVERIFY(!settings.isCustom());
        QVERIFY(!QFileInfo::exists(managed));
        QCOMPARE(readBytes(source), bytes);
        const auto link = directory.filePath(QStringLiteral("directory-link"));
        QVERIFY(QFile::link(data, link));
        CardBackSettings linked(link + QLatin1Char('/'));
        QCOMPARE(linked.installImage(source).error, CardBackError::StorageFailed);
        QCOMPARE(readBytes(source), bytes);
#else
        QSKIP("POSIX symbolic-link behavior is tested on Linux.");
#endif
    }

    void standardPathUsesStableIdentityWithoutWritingThere()
    {
        QTemporaryDir directory;
        const auto oldOrganization = QCoreApplication::organizationName();
        const auto oldApplication = QCoreApplication::applicationName();
        const auto oldDataHome = qgetenv("XDG_DATA_HOME");
        const auto oldTestMode = QStandardPaths::isTestModeEnabled();
        QCoreApplication::setOrganizationName(QStringLiteral("Cardsy"));
        QCoreApplication::setApplicationName(QStringLiteral("Cardsy"));
        qputenv("XDG_DATA_HOME", directory.path().toUtf8());
        QStandardPaths::setTestModeEnabled(false);
        const auto expected = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
        CardBackSettings settings;
        const auto actual = settings.managedPath();
        if (oldDataHome.isNull()) {
            qunsetenv("XDG_DATA_HOME");
        } else {
            qputenv("XDG_DATA_HOME", oldDataHome);
        }
        QStandardPaths::setTestModeEnabled(oldTestMode);
        QCoreApplication::setOrganizationName(oldOrganization);
        QCoreApplication::setApplicationName(oldApplication);
        QVERIFY(expected.startsWith(directory.path()));
        QCOMPARE(actual, QDir(expected).filePath(QStringLiteral("card-back.png")));
    }
};

QTEST_MAIN(CardBackSettingsTest)
#include "CardBackSettingsTest.moc"
