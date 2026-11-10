#include "BoardTestSupport.h"
#include "ImageTestSupport.h"
#include "ui/CardBackDialog.h"
#include "ui/GameBoard.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QSignalSpy>
#include <QTemporaryDir>
#include <QTest>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class IndividualBackRenderingTest : public QObject
{
    Q_OBJECT

    static QImage render(GameBoard &board, int scale = 1)
    {
        QImage image(board.size() * scale, QImage::Format_ARGB32_Premultiplied);
        image.setDevicePixelRatio(scale);
        image.fill(Qt::transparent);
        board.render(&image);
        return image;
    }

    static void clickStock(GameBoard &board)
    {
        const auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
    }

private slots:
    void modesChangeOnlyHiddenRenderingAndPreserveGameplay()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        QImage solid({100, 140}, QImage::Format_RGB32);
        solid.fill(Qt::magenta);
        writeBytes(source, encodeImage(solid));
        CardBackSettings single(directory.filePath(QStringLiteral("private")));
        MainWindow window(single, 42);
        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        auto &board = *window.gameBoard();
        auto &backs = *window.cardBackCollection();
        const auto state = board.gameState();
        const auto before = render(board);
        QCOMPARE(backs.importImages({source}).imported, 1);
        QVERIFY(backs.setMode(CardBackMode::RandomCollection));
        // Imports affect the next deal, never fill previously unassigned cards mid-game.
        QCOMPARE(render(board), before);
        board.newGame();
        const auto newState = board.gameState();
        QVERIFY(!board.canUndo());
        const auto withCollection = render(board);
        QVERIFY(backs.setMode(CardBackMode::Default));
        const auto defaultRender = render(board);
        const auto layout = board.boardLayout();
        for (const auto &element : layout.elements) {
            if (!element.cardIndex) {
                continue;
            }
            const auto &card = element.pile == PileType::Stock
                ? newState.stock[*element.cardIndex]
                : newState.tableau[element.pileIndex][*element.cardIndex];
            if (card.faceUp) {
                const auto area = element.rectangle.toAlignedRect().adjusted(3, 3, -3, -3);
                QCOMPARE(withCollection.copy(area), defaultRender.copy(area));
            } else {
                QCOMPARE(withCollection.pixelColor(exposedPoint(layout, element)), QColor(Qt::magenta));
            }
        }
        QVERIFY(board.gameState() == newState);
        QVERIFY(window.installCardBack(source));
        QCOMPARE(backs.mode(), CardBackMode::SingleImage);
        for (unsigned index = 0; index < 52; ++index) {
            QCOMPARE(board.cardBackImage(static_cast<CardId>(index)), single.image());
        }
        window.findChild<QAction *>(QStringLiteral("defaultCardBackAction"))->trigger();
        QVERIFY(board.cardBackImage().isNull());
        QVERIFY(single.isCustom());
        QVERIFY(QFileInfo::exists(single.managedPath()));
        QVERIFY(board.gameState() == newState);
        QVERIFY(state.shuffleSeed == 42U);
    }

    void assignmentsStayFixedAcrossMovesUndoResizeSettingsAndRemoval()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings single(directory.filePath(QStringLiteral("private")));
        MainWindow window(single, 42);
        auto &board = *window.gameBoard();
        auto &backs = *window.cardBackCollection();
        QCOMPARE(backs.importImages({source}).imported, 1);
        QVERIFY(backs.setMode(CardBackMode::RandomCollection));
        QSignalSpy randomized(&board, &GameBoard::cardBacksRandomized);
        board.newGame();
        QCOMPARE(randomized.count(), 1);
        const auto initial = board.gameState();
        const auto ids = board.gameCardBacks().ids;
        const auto key = board.gameCardBacks().images[0].cacheKey();
        clickStock(board);
        QVERIFY(board.canUndo());
        QCOMPARE(board.gameCardBacks().ids, ids);
        board.undo();
        QVERIFY(board.gameState() == initial);
        QCOMPARE(board.gameCardBacks().ids, ids);
        window.findChild<QAction *>(QStringLiteral("customCardBacksAction"))->trigger();
        window.findChild<CardBackDialog *>()->close();
        for (const auto size : {QSize(760, 600), QSize(1440, 1000)}) {
            board.resize(size);
            render(board, 2);
            QCOMPARE(board.gameCardBacks().ids, ids);
        }
        const auto managed = backs.managedPath(backs.items()[0].id);
        QVERIFY(QFile::remove(managed));
        QCoreApplication::processEvents();
        // Even external deletion cannot invalidate the active game's shared decoded pixels.
        for (int repeat = 0; repeat < 10; ++repeat) {
            render(board);
            QCOMPARE(board.gameCardBacks().images[0].cacheKey(), key);
        }
        QVERIFY(backs.clear());
        QCOMPARE(board.gameCardBacks().images[0].cacheKey(), key);
        QCOMPARE(board.gameCardBacks().ids, ids);
        QCOMPARE(randomized.count(), 1);
        board.newGame();
        QCOMPARE(randomized.count(), 2);
        for (const auto &image : board.gameCardBacks().images) {
            QVERIFY(image.isNull());
        }
        QVERIFY(!board.canUndo());
    }

    void startupBuildsMappingAndRandomizationDoesNotChangeEngineState()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        const auto data = directory.filePath(QStringLiteral("private"));
        {
            CardBackCollection backs(data);
            QCOMPARE(backs.importImages({source}).imported, 1);
            QVERIFY(backs.setMode(CardBackMode::RandomCollection));
        }
        CardBackSettings single(data);
        MainWindow window(single, 42);
        GameBoard control(42);
        auto &board = *window.gameBoard();
        QVERIFY(board.gameState() == control.gameState());
        QVERIFY(!board.cardBackImage(board.gameState().stock.back().id()).isNull());
        const auto state = board.gameState();
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        QVERIFY(window.cardBackCollection()->setMode(CardBackMode::Default));
        QVERIFY(window.cardBackCollection()->setMode(CardBackMode::RandomCollection));
        QVERIFY(board.gameState() == state);
        QCOMPARE(changed.count(), 0);
    }

    void removingActiveManagedImageKeepsPixelsUntilMenuStartsNextGame()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings single(directory.filePath(QStringLiteral("private")));
        MainWindow window(single, 42);
        auto &board = *window.gameBoard();
        auto &backs = *window.cardBackCollection();
        QCOMPARE(backs.importImages({source}).imported, 1);
        QVERIFY(backs.setMode(CardBackMode::RandomCollection));
        board.newGame();
        const auto id = backs.items()[0].id;
        const auto path = backs.managedPath(id);
        const auto key = board.gameCardBacks().images[0].cacheKey();
        const auto state = board.gameState();
        QVERIFY(backs.removeImages({id}));
        QVERIFY(!QFileInfo::exists(path));
        QCOMPARE(board.gameCardBacks().images[0].cacheKey(), key);
        QVERIFY(board.gameState() == state);
        QSignalSpy randomized(&board, &GameBoard::cardBacksRandomized);
        window.findChild<QAction *>(QStringLiteral("newGameAction"))->trigger();
        QCOMPARE(randomized.count(), 1);
        QVERIFY(board.gameCardBacks().images[0].isNull());
        QVERIFY(board.cardBackImage(board.gameState().stock.back().id()).isNull());
    }
};

QTEST_MAIN(IndividualBackRenderingTest)
#include "IndividualBackRenderingTest.moc"
