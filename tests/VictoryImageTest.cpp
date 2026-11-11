#include "ImageTestSupport.h"
#include "ui/CardBackCollection.h"
#include "ui/GameBoard.h"
#include "engine/TestSupport.h"

#include <QFile>
#include <QSet>
#include <QTemporaryDir>
#include <QTest>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class VictoryImageTest : public QObject
{
    Q_OBJECT

    static GameState wonState()
    {
        Game game(42);
        if (!game.loadState(cardsy::test::nearlyWon())) {
            throw std::logic_error("Invalid victory fixture");
        }
        for (std::size_t suit = 0; suit < game.state().foundations.size(); ++suit) {
            if (!game.apply(TableauToFoundation{suit, suit})) {
                throw std::logic_error("Invalid winning move");
            }
        }
        return game.state();
    }

private slots:
    void collectionSelectsOneStableImageAndFallsBack()
    {
        QTemporaryDir directory;
        CardBackCollection collection(directory.filePath(QStringLiteral("private")));
        QRandomGenerator random(123);
        QVERIFY(collection.victoryImage(random).isNull());
        const auto red = directory.filePath(QStringLiteral("red.png"));
        const auto blue = directory.filePath(QStringLiteral("blue.png"));
        QImage redImage(40, 40, QImage::Format_RGB32);
        redImage.fill(Qt::red);
        QImage blueImage(60, 80, QImage::Format_RGB32);
        blueImage.fill(Qt::blue);
        writeBytes(red, encodeImage(redImage));
        writeBytes(blue, encodeImage(blueImage));
        QCOMPARE(collection.importImages({red}).imported, 1);
        QVERIFY(collection.setMode(CardBackMode::RandomCollection));
        const auto snapshot = random;
        const auto selected = collection.victoryImage(random);
        QVERIFY(!selected.isNull());
        QCOMPARE(selected.pixelColor(300, 420), QColor(Qt::red));
        auto expectedRandom = snapshot;
        QCOMPARE(random.generate(), expectedRandom.generate()); // One candidate needs no shuffle.
        QCOMPARE(collection.importImages({blue}).imported, 1);
        QRandomGenerator seededA(987), seededB(987);
        const auto first = collection.victoryImage(seededA);
        QVERIFY(first == collection.victoryImage(seededB));
        QVERIFY(first.pixelColor(300, 420) == QColor(Qt::red)
                || first.pixelColor(300, 420) == QColor(Qt::blue));
        QSet<QRgb> choices;
        for (quint32 seed = 0; seed < 16; ++seed) {
            QRandomGenerator seeded(seed);
            choices.insert(collection.victoryImage(seeded).pixel(300, 420));
        }
        QCOMPARE(choices.size(), 2);
        GameBoard board(42);
        board.setCardBackCollection(&collection);
        QVERIFY(board.loadState(wonState()));
        const auto fixed = board.victorySequence().image();
        QVERIFY(!fixed.isNull());
        QVERIFY(collection.setMode(CardBackMode::Default));
        QCOMPARE(board.victorySequence().image(), fixed);
        QVERIFY(collection.setMode(CardBackMode::RandomCollection));
        const auto missing = collection.items().front().id;
        QVERIFY(QFile::remove(collection.managedPath(missing)));
        const auto remaining = collection.victoryImage(random);
        QVERIFY(!remaining.isNull());
        const auto other = collection.items().back().id;
        QVERIFY(QFile::remove(collection.managedPath(other)));
        QVERIFY(collection.victoryImage(random).isNull());
        QCOMPARE(board.victorySequence().image(), fixed);
        board.newGame();
        QVERIFY(board.victorySequence().image().isNull());
        QVERIFY(board.loadState(wonState()));
        QVERIFY(board.victorySequence().image().isNull());
    }

    void activeModeAndMissingSinglePhoto()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.jpg"));
        writeBytes(source, orientedJpeg());
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        const auto persisted = readBytes(settings.managedPath());
        CardBackCollection collection(directory.filePath(QStringLiteral("private")));
        GameBoard board(42);
        board.setCardBackCollection(&collection);
        board.setCardBackImage(settings.image(), settings.managedPath());
        QVERIFY(collection.setMode(CardBackMode::Default));
        QVERIFY(board.loadState(wonState()));
        QVERIFY(board.victorySequence().image().isNull());
        QVERIFY(collection.setMode(CardBackMode::SingleImage));
        QVERIFY(board.loadState(wonState()));
        QCOMPARE(board.victorySequence().image(), settings.image());
        QCOMPARE(readBytes(settings.managedPath()), persisted);
        QVERIFY(QFile::remove(settings.managedPath()));
        QVERIFY(board.loadState(wonState()));
        QVERIFY(board.victorySequence().image().isNull());
        QCOMPARE(board.gameState().status, GameStatus::Won);
    }

    void existingNormalizationHandlesInputShapes_data()
    {
        QTest::addColumn<QSize>("size");
        QTest::newRow("landscape") << QSize(1200, 600);
        QTest::newRow("portrait") << QSize(600, 1200);
        QTest::newRow("square") << QSize(600, 600);
        QTest::newRow("large") << QSize(4000, 3000);
        QTest::newRow("low-resolution") << QSize(12, 9);
    }

    void existingNormalizationHandlesInputShapes()
    {
        QFETCH(QSize, size);
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage(size)));
        const auto original = readBytes(source);
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        QVERIFY(settings.installImage(source));
        GameBoard board(42);
        board.setCardBackImage(settings.image(), settings.managedPath());
        QVERIFY(board.loadState(wonState()));
        QCOMPARE(board.victorySequence().image().size(), CardBackSettings::normalizedSize());
        QCOMPARE(readBytes(source), original);
    }
};

QTEST_MAIN(VictoryImageTest)
#include "VictoryImageTest.moc"
