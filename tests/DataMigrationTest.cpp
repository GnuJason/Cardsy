#include "ImageTestSupport.h"
#include "app/ApplicationIdentity.h"
#include "ui/CardBackSettings.h"

#include <QCoreApplication>
#include <QDir>
#include <QFileInfo>
#include <QStandardPaths>
#include <QTemporaryDir>
#include <QTest>

#include <memory>

using namespace cardsy::ui;
using namespace cardsy::ui::test;

class DataMigrationTest : public QObject
{
    Q_OBJECT

    std::unique_ptr<QTemporaryDir> temporary_;
    QByteArray oldDataHome_;
    QString oldName_;
    QString oldOrganization_;
    QString oldDomain_;
    QString oldVersion_;
    bool oldTestMode_ = false;

    QString sourcePath() const { return temporary_->filePath(QStringLiteral("synthetic.png")); }
    QString canonicalDirectory() const
    {
        return QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    }

    QString createDevelopmentBack()
    {
        writeBytes(sourcePath(), encodeImage(syntheticImage()));
        CardBackSettings old(cardsy::app::developmentDataDirectory());
        if (!old.installImage(sourcePath())) {
            throw std::runtime_error("Cannot prepare managed development fixture");
        }
        return old.managedPath();
    }

private slots:
    void init()
    {
#ifndef Q_OS_LINUX
        QSKIP("This suite isolates Linux development data using XDG_DATA_HOME.");
#endif
        temporary_ = std::make_unique<QTemporaryDir>();
        QVERIFY(temporary_->isValid());
        oldDataHome_ = qgetenv("XDG_DATA_HOME");
        oldName_ = QCoreApplication::applicationName();
        oldOrganization_ = QCoreApplication::organizationName();
        oldDomain_ = QCoreApplication::organizationDomain();
        oldVersion_ = QCoreApplication::applicationVersion();
        oldTestMode_ = QStandardPaths::isTestModeEnabled();
        qputenv("XDG_DATA_HOME", temporary_->filePath(QStringLiteral("data")).toUtf8());
        QStandardPaths::setTestModeEnabled(false);
        cardsy::app::initializeCoreIdentity();
    }

    void cleanup()
    {
        if (!temporary_) return;
        if (oldDataHome_.isNull()) qunsetenv("XDG_DATA_HOME");
        else qputenv("XDG_DATA_HOME", oldDataHome_);
        QCoreApplication::setApplicationName(oldName_);
        QCoreApplication::setOrganizationName(oldOrganization_);
        QCoreApplication::setOrganizationDomain(oldDomain_);
        QCoreApplication::setApplicationVersion(oldVersion_);
        QStandardPaths::setTestModeEnabled(oldTestMode_);
        temporary_.reset();
    }

    void canonicalNamespaceContainsOneStableId()
    {
        const auto expected = temporary_->filePath(QStringLiteral("data/"))
            + QString::fromLatin1(cardsy::build::ApplicationId);
        QCOMPARE(canonicalDirectory(), expected);
        CardBackSettings settings;
        QCOMPARE(settings.managedPath(), QDir(expected).filePath(QStringLiteral("card-back.png")));
        QVERIFY(!settings.isCustom());
    }

    void migratesOnlyManagedCopyAndPreservesOriginal()
    {
        const auto legacy = createDevelopmentBack();
        const auto original = readBytes(sourcePath());
        const auto expected = QImage(legacy);
        CardBackSettings settings;
        QVERIFY(settings.isCustom());
        QVERIFY(settings.image() == expected);
        QVERIFY(QFileInfo::exists(settings.managedPath()));
        QVERIFY(!QFileInfo::exists(legacy));
        QCOMPARE(readBytes(sourcePath()), original);
        CardBackSettings restarted;
        QVERIFY(restarted.image() == expected);
        QVERIFY(settings.useDefault());
        QVERIFY(!QFileInfo::exists(settings.managedPath()));
        QCOMPARE(readBytes(sourcePath()), original);
        CardBackSettings reset;
        QVERIFY(!reset.isCustom());
    }

    void canonicalPreferenceTakesPriorityWithoutDeletingLegacy()
    {
        const auto legacy = createDevelopmentBack();
        const auto legacyBytes = readBytes(legacy);
        const auto replacementPath = temporary_->filePath(QStringLiteral("replacement.png"));
        QImage replacement({200, 200}, QImage::Format_RGB32);
        replacement.fill(Qt::yellow);
        writeBytes(replacementPath, encodeImage(replacement));
        CardBackSettings canonical(canonicalDirectory());
        QVERIFY(canonical.installImage(replacementPath));
        CardBackSettings settings;
        QCOMPARE(settings.image().pixelColor(300, 420), QColor(Qt::yellow));
        QCOMPARE(readBytes(legacy), legacyBytes);
    }

    void existingEmptyNamespaceDoesNotResurrectOldCustomization()
    {
        const auto legacy = createDevelopmentBack();
        QVERIFY(QDir().mkpath(canonicalDirectory()));
        CardBackSettings settings;
        QVERIFY(!settings.isCustom());
        QVERIFY(QFileInfo::exists(legacy));
        QVERIFY(settings.useDefault());
        CardBackSettings restarted;
        QVERIFY(!restarted.isCustom());
    }

    void invalidLegacyIsRetainedAndFallsBackWithoutModalLoop()
    {
        const auto legacy = createDevelopmentBack();
        writeBytes(legacy, QByteArray("invalid managed development data"));
        const auto bytes = readBytes(legacy);
        CardBackSettings settings;
        QVERIFY(!settings.isCustom());
        QVERIFY(!settings.startupWarning().isEmpty());
        QCOMPARE(readBytes(legacy), bytes);
        QVERIFY(QFileInfo::exists(sourcePath()));
        QVERIFY(settings.useDefault());
        CardBackSettings reset;
        QVERIFY(!reset.isCustom());
        QVERIFY(reset.startupWarning().isEmpty());
    }

    void failedMigrationPreservesLegacyUntilStorageIsWritable()
    {
        const auto legacy = createDevelopmentBack();
        const auto legacyBytes = readBytes(legacy);
        const auto dataHome = temporary_->filePath(QStringLiteral("data"));
        QVERIFY(QFile::setPermissions(dataHome, QFileDevice::ReadOwner | QFileDevice::ExeOwner));
        CardBackSettings blocked;
        QVERIFY(QFile::setPermissions(dataHome, QFileDevice::ReadOwner | QFileDevice::WriteOwner
                                                   | QFileDevice::ExeOwner));
        QVERIFY(!blocked.isCustom());
        QVERIFY(!blocked.startupWarning().isEmpty());
        QCOMPARE(readBytes(legacy), legacyBytes);
        CardBackSettings retried;
        QVERIFY(retried.isCustom());
        QVERIFY(!QFileInfo::exists(legacy));
    }

    void resetDoesNotRemigrateWhenOldCopyCouldNotBeRemoved()
    {
        const auto legacy = createDevelopmentBack();
        const auto legacyDirectory = QFileInfo(legacy).path();
        QVERIFY(QFile::setPermissions(legacyDirectory,
                                      QFileDevice::ReadOwner | QFileDevice::ExeOwner));
        CardBackSettings migrated;
        QVERIFY(QFile::setPermissions(legacyDirectory,
                                      QFileDevice::ReadOwner | QFileDevice::WriteOwner
                                          | QFileDevice::ExeOwner));
        QVERIFY(migrated.isCustom());
        QVERIFY(!migrated.startupWarning().isEmpty());
        QVERIFY(QFileInfo::exists(legacy));
        QVERIFY(migrated.useDefault());
        CardBackSettings restarted;
        QVERIFY(!restarted.isCustom());
        QVERIFY(QFileInfo::exists(legacy));
        QVERIFY(QFileInfo::exists(sourcePath()));
    }

    void migrationRejectsLegacySymlinkWithoutTouchingTarget()
    {
#ifdef Q_OS_UNIX
        const auto legacy = createDevelopmentBack();
        const auto original = readBytes(sourcePath());
        QVERIFY(QFile::remove(legacy));
        QVERIFY(QFile::link(sourcePath(), legacy));
        CardBackSettings settings;
        QVERIFY(!settings.isCustom());
        QVERIFY(!settings.startupWarning().isEmpty());
        QVERIFY(QFileInfo(legacy).isSymLink());
        QCOMPARE(readBytes(sourcePath()), original);
#else
        QSKIP("POSIX symbolic-link migration safety is exercised on Linux.");
#endif
    }
};

QTEST_MAIN(DataMigrationTest)
#include "DataMigrationTest.moc"
