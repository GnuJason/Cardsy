#include "ImageTestSupport.h"
#include "engine/Deck.h"
#include "ui/CardBackIdentity.h"
#include "ui/IndividualCardBacks.h"

#include <QDir>
#include <QSet>
#include <QSignalSpy>
#include <QTemporaryDir>
#include <QTest>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class IndividualCardBacksTest : public QObject
{
    Q_OBJECT

private slots:
    void persistentKeysCoverExactlyTheDeck()
    {
        const QStringList ranks{"A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"};
        const QStringList suits{"C", "D", "H", "S"};
        QSet<QString> keys;
        for (auto card : createDeck()) {
            const auto key = cardBackKey(card.id());
            QCOMPARE(key, ranks[static_cast<unsigned>(card.rank) - 1] + suits[static_cast<unsigned>(card.suit)]);
            keys.insert(key);
            card.faceUp = true;
            QCOMPARE(cardBackKey(card.id()), key);
        }
        QCOMPARE(keys.size(), 52);
        QVERIFY(cardBackKey(static_cast<CardId>(52)).isEmpty());
        QVERIFY(cardBackKey(static_cast<CardId>(255)).isEmpty());
    }

    void allCardsPersistIndependentlyAndResetsAreScoped()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source space \u00e9.png"));
        const auto data = directory.filePath(QStringLiteral("private \u00e9"));
        CardBackSettings universal(data);
        writeBytes(source, encodeImage(syntheticImage()));
        QVERIFY(universal.installImage(source));
        const auto universalBytes = readBytes(universal.managedPath());
        const auto unrelated = QDir(data).filePath(QStringLiteral("unrelated.settings"));
        writeBytes(unrelated, "keep");
        {
            IndividualCardBacks backs(data);
            QSignalSpy changed(&backs, &IndividualCardBacks::changed);
            for (unsigned index = 0; index < 52; ++index) {
                const auto id = static_cast<CardId>(index);
                QVERIFY(!backs.hasAssignment(id));
                QVERIFY(backs.image(id).isNull());
                QImage solid({50, 70}, QImage::Format_RGB32);
                solid.fill(QColor::fromRgb(index + 1, 120, 200));
                writeBytes(source, encodeImage(solid));
                QVERIFY(backs.assign(id, source));
                QCOMPARE(backs.image(id).pixelColor(300, 420), solid.pixelColor(0, 0));
                QCOMPARE(QFileInfo(backs.managedPath(id)).fileName(), cardBackKey(id) + ".png");
            }
            QCOMPARE(changed.count(), 52);
        }
        QVERIFY(QFile::remove(source));
        IndividualCardBacks restored(data);
        for (unsigned index = 0; index < 52; ++index) {
            const auto id = static_cast<CardId>(index);
            QVERIFY(restored.hasAssignment(id));
            QCOMPARE(restored.image(id).pixelColor(300, 420), QColor::fromRgb(index + 1, 120, 200));
        }
        QVERIFY(restored.reset(static_cast<CardId>(0)));
        for (unsigned index = 0; index < 52; ++index) {
            QCOMPARE(restored.hasAssignment(static_cast<CardId>(index)), index != 0);
        }
        QVERIFY(restored.resetSuit(Suit::Hearts));
        for (unsigned index = 0; index < 52; ++index) {
            QCOMPARE(restored.hasAssignment(static_cast<CardId>(index)),
                     index != 0 && (index < 26 || index >= 39));
        }
        const auto unknown = QDir(QFileInfo(restored.managedPath(static_cast<CardId>(0))).path())
                                 .filePath(QStringLiteral("JOKER.png"));
        writeBytes(unknown, "unknown - leave untouched");
        QVERIFY(restored.resetAll());
        IndividualCardBacks empty(data);
        for (unsigned index = 0; index < 52; ++index) {
            QVERIFY(!empty.hasAssignment(static_cast<CardId>(index)));
            QVERIFY(empty.image(static_cast<CardId>(index)).isNull());
        }
        QCOMPARE(readBytes(unknown), QByteArray("unknown - leave untouched"));
        QCOMPARE(readBytes(unrelated), QByteArray("keep"));
        QCOMPARE(readBytes(universal.managedPath()), universalBytes);
    }

    void failedImportRetainsPreviousImageAndBytes()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        const auto bad = directory.filePath(QStringLiteral("bad.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        IndividualCardBacks backs(directory.filePath(QStringLiteral("private")));
        const auto id = static_cast<CardId>(0);
        QVERIFY(backs.assign(id, source));
        const auto image = backs.image(id);
        const auto bytes = readBytes(backs.managedPath(id));
        for (const auto &data : {QByteArray("not an image"), pngWithDeclaredSize({8193, 10}),
                                encodeImage(syntheticImage(), "BMP")}) {
            writeBytes(bad, data);
            const auto result = backs.assign(id, bad);
            QVERIFY(!result);
            QVERIFY(!result.message.isEmpty());
            QCOMPARE(backs.image(id), image);
            QCOMPARE(readBytes(backs.managedPath(id)), bytes);
        }
        QVERIFY(!backs.assign(id, directory.filePath(QStringLiteral("missing"))));
        QVERIFY(!backs.assign(static_cast<CardId>(255), source));
        QVERIFY(!backs.reset(static_cast<CardId>(52)));
        QVERIFY(!backs.resetSuit(static_cast<Suit>(4)));
        QVERIFY(!backs.assign(id, backs.managedPath(id)));
        const auto folder = QFileInfo(backs.managedPath(id)).path();
        QVERIFY(QFile::setPermissions(folder, QFileDevice::ReadOwner | QFileDevice::ExeOwner));
        const auto failedAssign = backs.assign(id, source);
        const auto failedReset = backs.reset(id);
        QVERIFY(QFile::setPermissions(folder,
            QFileDevice::ReadOwner | QFileDevice::WriteOwner | QFileDevice::ExeOwner));
        QVERIFY(!failedAssign);
        QVERIFY(!failedReset);
        QCOMPARE(backs.image(id), image);
        QCOMPARE(readBytes(backs.managedPath(id)), bytes);
        QVERIFY(QFileInfo::exists(source));
    }

    void missingAndCorruptCopiesFallBackWithoutDeletingData()
    {
        QTemporaryDir directory;
        const auto data = directory.filePath(QStringLiteral("private"));
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        QString path;
        {
            IndividualCardBacks backs(data);
            QVERIFY(backs.assign(static_cast<CardId>(0), source));
            path = backs.managedPath(static_cast<CardId>(0));
        }
        writeBytes(path, "corrupt");
        {
            IndividualCardBacks backs(data);
            QVERIFY(backs.image(static_cast<CardId>(0)).isNull());
            QVERIFY(backs.hasAssignment(static_cast<CardId>(0)));
            QVERIFY(!backs.warning(static_cast<CardId>(0)).isEmpty());
            QCOMPARE(readBytes(path), QByteArray("corrupt"));
        }
        QVERIFY(QFile::remove(path));
        IndividualCardBacks backs(data);
        QVERIFY(backs.image(static_cast<CardId>(0)).isNull());
        QVERIFY(!backs.hasAssignment(static_cast<CardId>(0)));
    }

    void replacementAndExternalRemovalInvalidateCache()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        IndividualCardBacks backs(directory.path());
        const auto id = static_cast<CardId>(10);
        QVERIFY(backs.assign(id, source));
        const auto previousKey = backs.image(id).cacheKey();
        QImage solid({80, 110}, QImage::Format_RGB32);
        solid.fill(Qt::magenta);
        writeBytes(source, encodeImage(solid));
        QVERIFY(backs.assign(id, source));
        QVERIFY(previousKey != backs.image(id).cacheKey());
        QCOMPARE(backs.image(id).pixelColor(300, 420), QColor(Qt::magenta));
        QCoreApplication::processEvents();
        const auto cached = backs.image(id).cacheKey();
        for (int repeat = 0; repeat < 100; ++repeat) {
            QCOMPARE(backs.image(id).cacheKey(), cached);
        }
        QVERIFY(QFile::remove(backs.managedPath(id)));
        QTRY_VERIFY(backs.image(id).isNull());
        QVERIFY(backs.assign(id, source));
        writeBytes(backs.managedPath(id), "corrupted while running");
        QTRY_VERIFY(backs.image(id).isNull());
        QVERIFY(!backs.warning(id).isEmpty());
    }

    void partialSuitResetReportsFailureWithoutTouchingOtherSuits()
    {
#ifndef Q_OS_UNIX
        QSKIP("This filesystem symlink test uses Unix links.");
#endif
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        IndividualCardBacks backs(directory.path());
        QVERIFY(backs.assign(static_cast<CardId>(0), source));
        QVERIFY(backs.assign(static_cast<CardId>(1), source));
        QVERIFY(backs.assign(static_cast<CardId>(13), source));
        QVERIFY(QFile::remove(backs.managedPath(static_cast<CardId>(0))));
        QVERIFY(QFile::link(source, backs.managedPath(static_cast<CardId>(0))));
        const auto result = backs.resetSuit(Suit::Clubs);
        QVERIFY(!result);
        QVERIFY(result.message.contains(QStringLiteral("Some card backs")));
        QVERIFY(QFileInfo(backs.managedPath(static_cast<CardId>(0))).isSymLink());
        QVERIFY(!backs.hasAssignment(static_cast<CardId>(1)));
        QVERIFY(backs.hasAssignment(static_cast<CardId>(13)));
        QVERIFY(QFileInfo::exists(source));
    }

    void managedSymlinksNeverModifyExternalFiles()
    {
#ifndef Q_OS_UNIX
        QSKIP("This filesystem symlink test uses Unix links.");
#endif
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("external.png"));
        const auto bytes = encodeImage(syntheticImage());
        writeBytes(source, bytes);
        const auto data = directory.filePath(QStringLiteral("private"));
        QVERIFY(QDir().mkpath(QDir(data).filePath(QStringLiteral("card-backs"))));
        {
            IndividualCardBacks backs(data);
            const auto id = static_cast<CardId>(0);
            QVERIFY(QFile::link(source, backs.managedPath(id)));
            QVERIFY(!backs.assign(id, source));
            QVERIFY(!backs.reset(id));
        }
        IndividualCardBacks restored(data);
        QVERIFY(restored.image(static_cast<CardId>(0)).isNull());
        QCOMPARE(readBytes(source), bytes);
        const auto linkedData = directory.filePath(QStringLiteral("linked"));
        QVERIFY(QFile::link(data, linkedData));
        IndividualCardBacks linked(linkedData);
        QVERIFY(!linked.assign(static_cast<CardId>(1), source));
        QVERIFY(!linked.resetAll());
        const auto outside = directory.filePath(QStringLiteral("outside"));
        QVERIFY(QDir().mkpath(outside));
        const auto root = directory.filePath(QStringLiteral("other"));
        QVERIFY(QDir().mkpath(root));
        QVERIFY(QFile::link(outside, QDir(root).filePath(QStringLiteral("card-backs"))));
        IndividualCardBacks linkedRoot(root);
        QVERIFY(!linkedRoot.assign(static_cast<CardId>(1), source));
        QVERIFY(!linkedRoot.resetAll());
        QVERIFY(QDir(outside).isEmpty());
    }
};

QTEST_MAIN(IndividualCardBacksTest)
#include "IndividualCardBacksTest.moc"
