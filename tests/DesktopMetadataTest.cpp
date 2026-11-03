#include "app/ApplicationIdentity.h"

#include <QFile>
#include <QFileInfo>
#include <QMap>
#include <QTest>
#include <QXmlStreamReader>

class DesktopMetadataTest : public QObject
{
    Q_OBJECT

private slots:
    void launcherHasConsistentIdentityAndNativeExec()
    {
        QFile file(QString::fromLocal8Bit(CARDSY_TEST_DESKTOP));
        QVERIFY(file.open(QIODevice::ReadOnly));
        QMap<QString, QString> values;
        bool entry = false;
        for (auto line : QString::fromUtf8(file.readAll()).split(QLatin1Char('\n'))) {
            line = line.trimmed();
            if (line.startsWith(QLatin1Char('['))) {
                entry = line == QStringLiteral("[Desktop Entry]");
            } else if (entry && line.contains(QLatin1Char('='))) {
                const auto separator = line.indexOf(QLatin1Char('='));
                values.insert(line.left(separator), line.mid(separator + 1));
            }
        }
        QCOMPARE(values.value(QStringLiteral("Name")), QStringLiteral("Cardsy"));
        QCOMPARE(values.value(QStringLiteral("Type")), QStringLiteral("Application"));
        QCOMPARE(values.value(QStringLiteral("Exec")), QStringLiteral("cardsy"));
        QCOMPARE(values.value(QStringLiteral("Icon")),
                 QString::fromLatin1(cardsy::build::ApplicationId));
        QCOMPARE(values.value(QStringLiteral("Terminal")), QStringLiteral("false"));
        const auto categories = values.value(QStringLiteral("Categories")).split(QLatin1Char(';'),
                                                                                 Qt::SkipEmptyParts);
        QVERIFY(categories.contains(QStringLiteral("Game")));
        QVERIFY(categories.contains(QStringLiteral("CardGame")));
        QCOMPARE(QFileInfo(file).fileName(),
                 QString::fromLatin1(cardsy::build::ApplicationId) + QStringLiteral(".desktop"));
    }

    void metainfoMatchesDesktopWithoutInventingSoftwareLicense()
    {
        QFile file(QString::fromLocal8Bit(CARDSY_TEST_METAINFO));
        QVERIFY(file.open(QIODevice::ReadOnly));
        QXmlStreamReader reader(&file);
        QString id, launchable, metadataLicense, name, homepage;
        bool projectLicense = false;
        bool developer = false;
        bool desktopType = false;
        while (!reader.atEnd()) {
            reader.readNext();
            if (!reader.isStartElement()) continue;
            if (reader.name() == QStringLiteral("component")) {
                desktopType = reader.attributes().value(QStringLiteral("type"))
                    == QStringLiteral("desktop-application");
            } else if (reader.name() == QStringLiteral("id")) {
                id = reader.readElementText();
            } else if (reader.name() == QStringLiteral("launchable")) {
                QCOMPARE(reader.attributes().value(QStringLiteral("type")),
                         QStringLiteral("desktop-id"));
                launchable = reader.readElementText();
            } else if (reader.name() == QStringLiteral("metadata_license")) {
                metadataLicense = reader.readElementText();
            } else if (reader.name() == QStringLiteral("project_license")) {
                projectLicense = true;
            } else if (reader.name() == QStringLiteral("name") && name.isEmpty()) {
                name = reader.readElementText();
            } else if (reader.name() == QStringLiteral("developer")) {
                developer = true;
            } else if (reader.name() == QStringLiteral("url")
                       && reader.attributes().value(QStringLiteral("type")) == QStringLiteral("homepage")) {
                homepage = reader.readElementText();
            }
        }
        QVERIFY2(!reader.hasError(), qPrintable(reader.errorString()));
        QVERIFY(desktopType && developer);
        QCOMPARE(id, QString::fromLatin1(cardsy::build::ApplicationId));
        QCOMPARE(name, QStringLiteral("Cardsy"));
        QCOMPARE(launchable, id + QStringLiteral(".desktop"));
        QCOMPARE(metadataLicense, QStringLiteral("CC0-1.0"));
        QCOMPARE(homepage, QString::fromLatin1(cardsy::build::Homepage));
        QVERIFY(!projectLicense);
    }
};

QTEST_APPLESS_MAIN(DesktopMetadataTest)
#include "DesktopMetadataTest.moc"
