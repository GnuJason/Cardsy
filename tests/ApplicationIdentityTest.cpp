#include "app/ApplicationIdentity.h"
#include "ui/CardBackSettings.h"
#include "ui/MainWindow.h"

#include <QApplication>
#include <QDir>
#include <QProcess>
#include <QProcessEnvironment>
#include <QStandardPaths>
#include <QTemporaryDir>
#include <QTest>

class ApplicationIdentityTest : public QObject
{
    Q_OBJECT

private slots:
    void centralRuntimeIdentityAndDevelopmentVersion()
    {
        cardsy::app::initializeGuiIdentity();
        QCOMPARE(QCoreApplication::applicationName(), QString::fromLatin1(cardsy::build::ApplicationId));
        QCOMPARE(QGuiApplication::applicationDisplayName(), QStringLiteral("Cardsy"));
        QCOMPARE(QGuiApplication::desktopFileName(), QString::fromLatin1(cardsy::build::ApplicationId));
        QCOMPARE(QCoreApplication::applicationVersion(), QString::fromLatin1(cardsy::build::Version));
        QVERIFY(QCoreApplication::organizationName().isEmpty());
        QCOMPARE(QCoreApplication::organizationDomain(),
                 QString::fromLatin1(cardsy::build::OrganizationDomain));
        QVERIFY(QCoreApplication::applicationVersion().endsWith(QStringLiteral("-dev")));
        QVERIFY(QCoreApplication::applicationVersion().startsWith(
            QString::fromLatin1(cardsy::build::TargetVersion)));
        QCOMPARE(QString::fromLatin1(cardsy::build::ApplicationId),
                 QStringLiteral("io.github.gnujason.cardsy"));
    }

    void embeddedIconDoesNotRequireInstalledThemesOrSvg()
    {
        cardsy::app::initializeGuiIdentity();
        const auto icon = cardsy::app::applicationIcon();
        QVERIFY(!icon.isNull());
        for (const int size : {16, 48, 256}) {
            const auto pixmap = icon.pixmap(QSize(size, size));
            QVERIFY(!pixmap.isNull());
            QVERIFY(pixmap.toImage().pixelColor(size / 2, size / 2).alpha() > 0);
        }
        QTemporaryDir directory;
        cardsy::ui::CardBackSettings settings(directory.path());
        MainWindow window(settings, 42);
        QCOMPARE(window.windowTitle(), QStringLiteral("Cardsy"));
        QVERIFY(!window.windowIcon().isNull());
    }

    void informationalCliWorksWithoutDisplay_data()
    {
        QTest::addColumn<QString>("argument");
        QTest::newRow("version") << QStringLiteral("--version");
        QTest::newRow("short-version") << QStringLiteral("-v");
        QTest::newRow("help") << QStringLiteral("--help");
    }

    void informationalCliWorksWithoutDisplay()
    {
        QFETCH(QString, argument);
        QTemporaryDir directory;
        auto environment = QProcessEnvironment::systemEnvironment();
        environment.remove(QStringLiteral("DISPLAY"));
        environment.remove(QStringLiteral("WAYLAND_DISPLAY"));
        environment.insert(QStringLiteral("QT_QPA_PLATFORM"), QStringLiteral("not-a-platform"));
        environment.insert(QStringLiteral("XDG_DATA_HOME"), directory.filePath(QStringLiteral("data")));
        QProcess process;
        process.setProcessEnvironment(environment);
        process.start(QString::fromLocal8Bit(CARDSY_TEST_EXECUTABLE), {argument});
        QVERIFY(process.waitForFinished(5000));
        QCOMPARE(process.exitCode(), 0);
        QCOMPARE(process.exitStatus(), QProcess::NormalExit);
        const auto output = QString::fromUtf8(process.readAllStandardOutput());
        QVERIFY(process.readAllStandardError().isEmpty());
        if (argument.contains(QStringLiteral("version")) || argument == QStringLiteral("-v")) {
            QCOMPARE(output, QStringLiteral("%1 %2\n")
                                 .arg(QString::fromLatin1(cardsy::build::DisplayName),
                                      QString::fromLatin1(cardsy::build::Version)));
        } else {
            QVERIFY(output.contains(QStringLiteral("Usage:")));
            QVERIFY(output.contains(QStringLiteral("not a public release")));
        }
        QVERIFY(!QDir(directory.filePath(QStringLiteral("data"))).exists());
    }

    void noArgumentExecutableRemainsAGraphicalEventLoop()
    {
#ifndef Q_OS_LINUX
        QSKIP("The subprocess profile isolation in this smoke test uses Linux XDG locations.");
#endif
        QTemporaryDir directory;
        auto environment = QProcessEnvironment::systemEnvironment();
        environment.insert(QStringLiteral("QT_QPA_PLATFORM"), QStringLiteral("offscreen"));
        environment.insert(QStringLiteral("XDG_DATA_HOME"), directory.filePath(QStringLiteral("data")));
        environment.insert(QStringLiteral("XDG_CONFIG_HOME"), directory.filePath(QStringLiteral("config")));
        QProcess process;
        process.setProcessEnvironment(environment);
        process.start(QString::fromLocal8Bit(CARDSY_TEST_EXECUTABLE));
        QVERIFY(process.waitForStarted(5000));
        QTest::qWait(150);
        QCOMPARE(process.state(), QProcess::Running);
        QVERIFY(process.readAllStandardOutput().isEmpty());
        process.terminate();
        QTRY_COMPARE(process.state(), QProcess::NotRunning);
    }
};

QTEST_MAIN(ApplicationIdentityTest)
#include "ApplicationIdentityTest.moc"
