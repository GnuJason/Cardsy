#include "BoardTestSupport.h"
#include "ui/GameBoard.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QScrollArea>
#include <QScrollBar>
#include <QStatusBar>
#include <QTest>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class MainWindowTest : public QObject
{
    Q_OBJECT

private slots:
    void opensResizesAndCloses()
    {
        MainWindow window(42);
        QCOMPARE(window.windowTitle(), QStringLiteral("Cardsy"));
        QVERIFY(window.gameBoard());
        QVERIFY(validate(window.gameBoard()->gameState()).empty());
        const auto initial = window.gameBoard()->gameState();

        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        QVERIFY(window.isVisible());

        window.resize(1024, 768);
        QTRY_COMPARE(window.size(), QSize(1024, 768));
        QVERIFY(window.gameBoard()->width() >= MinimumBoardWidth);
        QVERIFY(window.gameBoard()->gameState() == initial);

        QVERIFY(window.close());
        QVERIFY(!window.isVisible());
    }

    void nativeActionsAndShortcuts()
    {
        MainWindow window(42);
        window.show();
        QVERIFY(QTest::qWaitForWindowActive(&window));
        auto *board = window.gameBoard();
        auto *undo = window.findChild<QAction *>(QStringLiteral("undoAction"));
        auto *newGame = window.findChild<QAction *>(QStringLiteral("newGameAction"));
        auto *quit = window.findChild<QAction *>(QStringLiteral("quitAction"));
        QVERIFY(undo && newGame && quit);
        QVERIFY(!undo->isEnabled());
        QVERIFY(!undo->shortcut().isEmpty());
        QVERIFY(!newGame->shortcut().isEmpty());
        const auto initial = board->gameState();
        auto layout = board->boardLayout();
        QTest::mouseClick(board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
        QVERIFY(undo->isEnabled());
        QVERIFY(board->canUndo());
        board->setFocus();
        QTest::keySequence(board, undo->shortcut());
        QTRY_VERIFY(board->gameState() == initial);
        QVERIFY(!undo->isEnabled());
        layout = board->boardLayout();
        QTest::mouseClick(board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
        undo->trigger();
        QVERIFY(board->gameState() == initial);
        QTest::mouseClick(board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
        QTest::keySequence(board, newGame->shortcut());
        QTRY_VERIFY(!board->canUndo());
        QCOMPARE(board->gameState().stock.size(), std::size_t{24});
        QVERIFY(validate(board->gameState()).empty());
        QVERIFY(!undo->isEnabled());
        QVERIFY(!window.statusBar()->currentMessage().isEmpty());
        quit->trigger();
        QVERIFY(!window.isVisible());
    }

    void deepColumnRemainsReachableThroughScrolling()
    {
        MainWindow window(42);
        window.resize(760, 600);
        auto *board = window.gameBoard();
        const auto state = deepFixture();
        QVERIFY(board->loadState(state));
        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        auto *scroll = window.findChild<QScrollArea *>(QStringLiteral("boardScrollArea"));
        QVERIFY(scroll);
        QTRY_VERIFY(scroll->verticalScrollBar()->maximum() > 0);
        const auto layout = board->boardLayout();
        const auto last = topElement(layout, PileType::Tableau);
        const auto point = exposedPoint(layout, last);
        scroll->ensureVisible(point.x(), point.y(), 10, 10);
        QTRY_VERIFY(scroll->viewport()->rect().contains(board->mapTo(scroll->viewport(), point)));
        QTest::mouseClick(board, Qt::LeftButton, Qt::NoModifier, point);
        QVERIFY(board->selection());
        QCOMPARE(board->selection()->cardId, state.tableau[0].back().id());
        QVERIFY(board->gameState() == state);
    }
};

QTEST_MAIN(MainWindowTest)
#include "MainWindowTest.moc"
