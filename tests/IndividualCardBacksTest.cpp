#include "ImageTestSupport.h"
#include "ui/CardBackCollection.h"
#include "ui/CardBackIdentity.h"

#include <QDir>
#include <QJsonDocument>
#include <QJsonObject>
#include <QRandomGenerator>
#include <QSet>
#include <QTemporaryDir>
#include <QTest>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class IndividualCardBacksTest : public QObject
{
    Q_OBJECT

    static QStringList sources(QTemporaryDir &directory, int count)
    {
        QStringList paths;
        for (int index = 0; index < count; ++index) {
            QImage image({10, 14}, QImage::Format_RGB32);
            image.fill(QColor::fromRgb(index + 1, 120, 200));
            const auto path = directory.filePath(QStringLiteral("source%1.png").arg(index));
            writeBytes(path, encodeImage(image));
            paths << path;
        }
        return paths;
    }

private slots:
    void batchImportPersistenceAndScopedRemoval()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 3);
        const auto data = directory.filePath(QStringLiteral("private"));
        CardBackCollection backs(data);
        const auto invalid = directory.filePath(QStringLiteral("bad.png"));
        writeBytes(invalid, "invalid");
        const auto original = readBytes(paths[0]);
        const auto result = backs.importImages(paths + QStringList{invalid, paths[0]});
        QCOMPARE(result.imported, 3);
        QCOMPARE(result.failed, 1);
        QCOMPARE(result.duplicates, 1);
        QCOMPARE(backs.items().size(), 3);
        QCOMPARE(readBytes(paths[0]), original);
        QCOMPARE(backs.importImages({}).imported, 0);
        QVERIFY(backs.setMode(CardBackMode::RandomCollection));
        const auto firstId = backs.items()[0].id;
        const auto firstPath = backs.managedPath(firstId);
        const auto unknown = QFileInfo(firstPath).dir().filePath(QStringLiteral("unknown.png"));
        writeBytes(unknown, "keep");
        CardBackCollection restored(data);
        QCOMPARE(restored.mode(), CardBackMode::RandomCollection);
        QCOMPARE(restored.items()[0].id, firstId);
        QCOMPARE(restored.items().size(), 3);
        QVERIFY(restored.removeImages({firstId}));
        QVERIFY(!QFileInfo::exists(firstPath));
        QCOMPARE(restored.items().size(), 2);
        QVERIFY(restored.clear());
        QCOMPARE(readBytes(unknown), QByteArray("keep"));
        QVERIFY(QFileInfo::exists(paths[0]));
        CardBackCollection empty(data);
        QVERIFY(empty.items().isEmpty());
        QCOMPARE(empty.mode(), CardBackMode::RandomCollection);
        QRandomGenerator random(1);
        for (const auto &image : empty.beginGame(random).images) {
            QVERIFY(image.isNull());
        }
    }

    void normalizedDuplicatesAndFilenameCollisions()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 2);
        const auto other = directory.filePath(QStringLiteral("other.png"));
        writeBytes(other, readBytes(paths[0]));
        CardBackCollection backs(directory.filePath(QStringLiteral("private")));
        QCOMPARE(backs.importImages({paths[0], other}).duplicates, 1);
        const auto id = backs.items()[0].id;
        writeBytes(paths[0], readBytes(paths[1]));
        QCOMPARE(backs.importImages({paths[0]}).imported, 1);
        QCOMPARE(backs.items().size(), 2);
        QVERIFY(backs.items()[1].id != id);
        QVERIFY(QFileInfo::exists(backs.managedPath(id)));
        QVERIFY(!readBytes(backs.manifestPath()).contains("source"));
        QVERIFY(!readBytes(backs.manifestPath()).contains("rank"));
        QVERIFY(!readBytes(backs.manifestPath()).contains("suit"));
    }

    void everyModePersistsAndCanceledBatchKeepsCompletedImports()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 3);
        const auto data = directory.filePath(QStringLiteral("private"));
        CardBackCollection backs(data);
        const auto summary = backs.importImages(paths, [](int processed) { return processed < 1; });
        QVERIFY(summary.canceled);
        QCOMPARE(summary.imported, 1);
        QCOMPARE(summary.failed, 0);
        QCOMPARE(backs.items().size(), 1);
        for (const auto mode : {CardBackMode::Default, CardBackMode::SingleImage,
                                CardBackMode::RandomCollection}) {
            QVERIFY(backs.setMode(mode));
            CardBackCollection restored(data);
            QCOMPARE(restored.mode(), mode);
            QCOMPARE(restored.items()[0].id, backs.items()[0].id);
        }
    }

    void balancedAssignment_data()
    {
        QTest::addColumn<int>("count");
        for (const auto count : {0, 1, 2, 12, 51, 52, 80}) {
            QTest::newRow(qPrintable(QString::number(count))) << count;
        }
    }

    void balancedAssignment()
    {
        QFETCH(int, count);
        QTemporaryDir directory;
        const auto paths = sources(directory, count);
        CardBackCollection backs(directory.filePath(QStringLiteral("private")));
        QCOMPARE(backs.importImages(paths).imported, count);
        QRandomGenerator random(42), sameRandom(42), nextRandom(43);
        const auto assignment = backs.beginGame(random);
        QCOMPARE(assignment.ids, backs.beginGame(sameRandom).ids);
        QMap<QString, int> counts;
        QMap<QString, qint64> cacheKeys;
        for (unsigned index = 0; index < 52; ++index) {
            const auto id = assignment.ids[index];
            if (count == 0) {
                QVERIFY(id.isEmpty());
                QVERIFY(assignment.images[index].isNull());
                continue;
            }
            QVERIFY(!id.isEmpty());
            QVERIFY(!assignment.images[index].isNull());
            ++counts[id];
            if (cacheKeys.contains(id)) {
                QCOMPARE(assignment.images[index].cacheKey(), cacheKeys[id]);
            }
            cacheKeys[id] = assignment.images[index].cacheKey();
        }
        QCOMPARE(counts.size(), qMin(count, 52));
        for (auto frequency : counts) {
            QVERIFY(frequency >= 52 / qMin(count, 52));
            QVERIFY(frequency <= (52 + qMin(count, 52) - 1) / qMin(count, 52));
        }
        if (count > 1) {
            QVERIFY(assignment.ids != backs.beginGame(nextRandom).ids);
        }
    }

    void migrationPreservesLegacyAndUniversalAndIsIdempotent()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 2);
        const auto data = directory.filePath(QStringLiteral("private"));
        const auto legacy = QDir(data).filePath(QStringLiteral("card-backs"));
        QVERIFY(QDir().mkpath(legacy));
        CardBackSettings single(data);
        QVERIFY(single.installImage(paths[0]));
        const auto universal = readBytes(single.managedPath());
        for (unsigned index = 0; index < 3; ++index) {
            const auto target = QDir(legacy).filePath(cardBackKey(static_cast<CardId>(index)) + ".png");
            QImage image;
            QVERIFY(CardBackSettings::readImage(paths[index % 2], image));
            writeBytes(target, encodeImage(image));
        }
        {
            CardBackCollection backs(data);
            QCOMPARE(backs.items().size(), 2);
            QCOMPARE(backs.mode(), CardBackMode::RandomCollection);
            QVERIFY(!backs.startupWarning().isEmpty());
        }
        CardBackCollection again(data);
        QCOMPARE(again.items().size(), 2);
        QVERIFY(again.clear());
        CardBackCollection cleared(data);
        QVERIFY(cleared.items().isEmpty());
        QCOMPARE(readBytes(single.managedPath()), universal);
        QCOMPARE(QDir(legacy).entryList({"*.png"}, QDir::Files).size(), 3);
    }

    void incompleteMigrationRetriesWithoutLosingData()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 1);
        const auto legacy = directory.filePath(QStringLiteral("card-backs"));
        QVERIFY(QDir().mkpath(legacy));
        QImage image;
        QVERIFY(CardBackSettings::readImage(paths[0], image));
        const auto valid = QDir(legacy).filePath(QStringLiteral("AC.png"));
        const auto bad = QDir(legacy).filePath(QStringLiteral("2C.png"));
        writeBytes(valid, encodeImage(image));
        writeBytes(bad, "recover me");
        {
            CardBackCollection backs(directory.path());
            QCOMPARE(backs.items().size(), 1);
            QVERIFY(!backs.startupWarning().isEmpty());
        }
        QCOMPARE(readBytes(bad), QByteArray("recover me"));
        writeBytes(bad, encodeImage(image));
        CardBackCollection retried(directory.path());
        QCOMPARE(retried.items().size(), 1);
        const auto json = QJsonDocument::fromJson(readBytes(retried.manifestPath())).object();
        QVERIFY(json.value(QStringLiteral("migrationComplete")).toBool());
    }

    void missingCorruptAndExternallyChangedImages()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 2);
        const auto data = directory.filePath(QStringLiteral("private"));
        CardBackCollection backs(data);
        QCOMPARE(backs.importImages(paths).imported, 2);
        const auto id = backs.items()[0].id;
        const auto path = backs.managedPath(id);
        writeBytes(path, "corrupt");
        QTRY_VERIFY(!backs.items()[0].warning.isEmpty());
        QRandomGenerator random(42);
        const auto assignment = backs.beginGame(random);
        for (const auto &assigned : assignment.ids) {
            QCOMPARE(assigned, backs.items()[1].id);
        }
        QVERIFY(QFile::remove(path));
        CardBackCollection restored(data);
        QCOMPARE(restored.items().size(), 2);
        QVERIFY(!restored.items()[0].warning.isEmpty());
        QVERIFY(restored.clear());
    }

    void unsafeStorageAndFailedAtomicSavePreserveData()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 2);
        const auto data = directory.filePath(QStringLiteral("private"));
        CardBackCollection backs(data);
        QCOMPARE(backs.importImages({paths[0]}).imported, 1);
        const auto bytes = readBytes(backs.manifestPath());
        QVERIFY(QFile::remove(backs.manifestPath()));
        QVERIFY(QDir().mkpath(backs.manifestPath()));
        QCOMPARE(backs.importImages({paths[1]}).failed, 1);
        QCOMPARE(backs.items().size(), 1);
        QCOMPARE(QFileInfo(backs.managedPath(backs.items()[0].id)).dir()
                     .entryList({"*.png"}, QDir::Files).size(), 1);
        QVERIFY(!backs.setMode(CardBackMode::SingleImage));
        QVERIFY(!backs.clear());
        QVERIFY(QDir().rmdir(backs.manifestPath()));
        writeBytes(backs.manifestPath(), bytes);
#ifdef Q_OS_UNIX
        const auto external = paths[1];
        const auto externalBytes = readBytes(external);
        const auto managed = backs.managedPath(backs.items()[0].id);
        QVERIFY(QFile::remove(managed));
        QVERIFY(QFile::link(external, managed));
        QVERIFY(!backs.clear());
        QCOMPARE(readBytes(external), externalBytes);
        const auto linked = directory.filePath(QStringLiteral("linked"));
        QVERIFY(QFile::link(data, linked));
        CardBackCollection unsafe(linked);
        QCOMPARE(unsafe.importImages({paths[1]}).failed, 1);
#endif
    }

    void failedManifestCommitRollsBackNewManagedImage()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 2);
        const auto data = directory.filePath(QStringLiteral("private"));
        CardBackCollection backs(data);
        QCOMPARE(backs.importImages({paths[0]}).imported, 1);
        const auto manifest = readBytes(backs.manifestPath());
        const auto permissions = QFileInfo(data).permissions();
        QVERIFY(QFile::setPermissions(data, QFileDevice::ReadOwner | QFileDevice::ExeOwner));
        const auto result = backs.importImages({paths[1]});
        QVERIFY(QFile::setPermissions(data, permissions));
        QCOMPARE(result.failed, 1);
        QCOMPARE(result.imported, 0);
        QCOMPARE(backs.items().size(), 1);
        QCOMPARE(readBytes(backs.manifestPath()), manifest);
        QCOMPARE(QFileInfo(backs.managedPath(backs.items()[0].id)).dir()
                     .entryList({"*.png"}, QDir::Files).size(), 1);
    }

    void unknownContentNamedFileIsNeverOverwrittenOrCleared()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 1);
        CardBackCollection backs(directory.filePath(QStringLiteral("private")));
        QCOMPARE(backs.importImages(paths).imported, 1);
        const auto path = backs.managedPath(backs.items()[0].id);
        QVERIFY(backs.clear());
        writeBytes(path, "unknown file at a reserved-looking path");
        QCOMPARE(backs.importImages(paths).failed, 1);
        QVERIFY(backs.clear());
        QCOMPARE(readBytes(path), QByteArray("unknown file at a reserved-looking path"));
    }

    void invalidManifestIsNotOverwritten()
    {
        QTemporaryDir directory;
        const auto paths = sources(directory, 1);
        const auto manifest = directory.filePath(QStringLiteral("card-back-collection.json"));
        writeBytes(manifest, "recover this configuration");
        CardBackCollection backs(directory.path());
        QVERIFY(!backs.startupWarning().isEmpty());
        QCOMPARE(backs.importImages(paths).failed, 1);
        QVERIFY(!backs.setMode(CardBackMode::SingleImage));
        QCOMPARE(readBytes(manifest), QByteArray("recover this configuration"));
    }
};

QTEST_MAIN(IndividualCardBacksTest)
#include "IndividualCardBacksTest.moc"
