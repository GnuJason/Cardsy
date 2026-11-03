#include "KeyboardTestSupport.h"
#include "ui/CardBackSettings.h"
#include "ui/MainWindow.h"

#include <QPushButton>
#include <QKeyEvent>
#include <QScrollArea>
#include <QScrollBar>
#include <QSignalSpy>
#include <QTemporaryDir>
#include <QVBoxLayout>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class KeyboardNavigationTest : public QObject
{
    Q_OBJECT

private slots:
    void initialFocusIsStockAndBoardAcceptsKeyboardFocus()
    {
        GameBoard board(42);
        showKeyboardBoard(board);
        QVERIFY(QTest::qWaitForWindowActive(&board));
        QVERIFY(board.hasFocus());
        QCOMPARE(board.focusPolicy(), Qt::StrongFocus);
        QVERIFY(board.keyboardFocus() == BoardFocus{});
        QCOMPARE(board.focusedElement()->pile, PileType::Stock);
        QVERIFY(validKeyboardFocus(board));
        const auto initial = board.gameState();
        QTest::keyClick(&board, Qt::Key_Left);
        QTest::keyClick(&board, Qt::Key_Up);
        QVERIFY(board.keyboardFocus() == BoardFocus{});
        QVERIFY(board.gameState() == initial);
    }

    void tabAndShiftTabUseNormalWidgetFocusChain()
    {
        QWidget host;
        auto *layout = new QVBoxLayout(&host);
        auto *before = new QPushButton(QStringLiteral("Before"), &host);
        auto *board = new GameBoard(42, &host);
        auto *after = new QPushButton(QStringLiteral("After"), &host);
        layout->addWidget(before);
        layout->addWidget(board);
        layout->addWidget(after);
        QWidget::setTabOrder(before, board);
        QWidget::setTabOrder(board, after);
        host.show();
        QVERIFY(QTest::qWaitForWindowActive(&host));
        before->setFocus();
        QTest::keyClick(before, Qt::Key_Tab);
        QTRY_VERIFY(board->hasFocus());
        QTest::keyClick(board, Qt::Key_Tab);
        QTRY_VERIFY(after->hasFocus());
        QTest::keyClick(after, Qt::Key_Backtab, Qt::ShiftModifier);
        QTRY_VERIFY(board->hasFocus());
        QTest::keyClick(board, Qt::Key_Backtab, Qt::ShiftModifier);
        QTRY_VERIFY(before->hasFocus());
        QVERIFY(board->keyboardFocus() == BoardFocus{});
    }

    void mainWindowProvidesInitialBoardFocusWithoutPointer()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        MainWindow window(settings, 42);
        window.show();
        QVERIFY(QTest::qWaitForWindowActive(&window));
        QTRY_VERIFY(window.gameBoard()->hasFocus());
        QVERIFY(window.gameBoard()->keyboardFocus() == BoardFocus{});
    }

    void leftAndRightReachEveryTopRowLocation()
    {
        GameBoard board(42);
        showKeyboardBoard(board);
        const auto initial = board.gameState();
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        for (std::size_t position = 0; position < 6; ++position) {
            QVERIFY(goTop(board, position));
            const auto focused = board.focusedElement();
            QVERIFY(focused);
            if (position < 2) {
                QCOMPARE(focused->pile, position == 0 ? PileType::Stock : PileType::Waste);
            } else {
                QCOMPARE(focused->pile, PileType::Foundation);
                QCOMPARE(focused->pileIndex, position - 2);
            }
        }
        const auto last = board.keyboardFocus();
        QTest::keyClick(&board, Qt::Key_Right);
        QVERIFY(board.keyboardFocus() == last);
        for (int step = 0; step < 5; ++step) {
            QTest::keyClick(&board, Qt::Key_Left);
        }
        QVERIFY(board.keyboardFocus() == BoardFocus{});
        QVERIFY(board.gameState() == initial);
        QCOMPARE(changed.count(), 0);
    }

    void everyTableauAndAlignedUpperTargetAreReachable()
    {
        GameBoard board(42);
        showKeyboardBoard(board);
        const auto initial = board.gameState();
        constexpr std::array<std::size_t, 7> upper{0, 1, 1, 2, 3, 4, 5};
        for (std::size_t column = 0; column < 7; ++column) {
            QVERIFY(goTableau(board, column));
            QCOMPARE(board.focusedElement()->pileIndex, column);
            QVERIFY(board.focusedElement()->cardIndex);
            QVERIFY(validKeyboardFocus(board));
            QTest::keyClick(&board, Qt::Key_Up);
            const auto focus = board.keyboardFocus();
            QCOMPARE(focus.pile, upper[column] == 0 ? PileType::Stock
                                        : upper[column] == 1 ? PileType::Waste : PileType::Foundation);
            if (upper[column] > 1) {
                QCOMPARE(focus.pileIndex, upper[column] - 2);
            }
        }
        constexpr std::array<std::size_t, 6> lower{0, 1, 3, 4, 5, 6};
        for (std::size_t position = 0; position < 6; ++position) {
            QVERIFY(goTop(board, position));
            QTest::keyClick(&board, Qt::Key_Down);
            QCOMPARE(board.keyboardFocus().pileIndex, lower[position]);
        }
        QVERIFY(board.gameState() == initial);
    }

    void upDownTraverseOnlyVisibleCardsAndSelectionIsSeparate()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QVERIFY(goTableau(board, 0));
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][1].id()});
        QVERIFY(!board.selection());
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardIndex, std::size_t{1});
        QTest::keyClick(&board, Qt::Key_Down);
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][2].id()});
        QCOMPARE(board.selection()->cardIndex, std::size_t{1});
        QTest::keyClick(&board, Qt::Key_Down);
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][2].id()});
        QTest::keyClick(&board, Qt::Key_Space);
        QCOMPARE(board.selection()->cardIndex, std::size_t{2});
        QTest::keyClick(&board, Qt::Key_Up);
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][1].id()});
        const auto focus = board.keyboardFocus();
        QTest::keyClick(&board, Qt::Key_Escape);
        QVERIFY(!board.selection());
        QVERIFY(board.keyboardFocus() == focus);
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }

    void emptyTableauCanBeFocusedWithoutSelectingAnything()
    {
        GameBoard board(42);
        QVERIFY(board.loadState(cardsy::test::nearlyWon()));
        showKeyboardBoard(board);
        QVERIFY(goTableau(board, 6));
        QVERIFY(!board.keyboardFocus().cardId);
        QVERIFY(!board.focusedElement()->cardIndex);
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(!board.selection());
        QVERIFY(validKeyboardFocus(board));
        QTest::keyClick(&board, Qt::Key_Down);
        QVERIFY(!board.focusedElement()->cardIndex);
    }

    void horizontalTableauNavigationStartsAtFirstVisibleCard()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QVERIFY(goTableau(board, 0, 1));
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][2].id()});
        QTest::keyClick(&board, Qt::Key_Right);
        QCOMPARE(board.keyboardFocus().pileIndex, std::size_t{1});
        QTest::keyClick(&board, Qt::Key_Left);
        QCOMPARE(board.keyboardFocus().pileIndex, std::size_t{0});
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][1].id()});
        QTest::keyClick(&board, Qt::Key_Left);
        QCOMPARE(board.keyboardFocus().pileIndex, std::size_t{0});
        QVERIFY(!board.selection());
        QVERIFY(board.gameState() == state);
    }

    void focusAndSelectionRemainDistinctAtMinimumSizeAndHighDpi()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QVERIFY(QTest::qWaitForWindowActive(&board));
        board.resize(720, 480);
        QVERIFY(goTableau(board, 0));
        QTest::keyClick(&board, Qt::Key_Return);
        const auto focus = board.keyboardFocus();
        board.clearFocus();
        QImage unfocused(board.size() * 2, QImage::Format_RGB32);
        unfocused.setDevicePixelRatio(2);
        board.render(&unfocused);
        board.setFocus(Qt::TabFocusReason);
        QTRY_VERIFY(board.hasFocus());
        QImage focused(board.size() * 2, QImage::Format_RGB32);
        focused.setDevicePixelRatio(2);
        board.render(&focused);
        const auto logical = board.focusedRectangle()->adjusted(-8, -8, 8, 8).toAlignedRect();
        const QRect pixels(logical.topLeft() * 2, logical.size() * 2);
        QVERIFY(!(focused.copy(pixels) == unfocused.copy(pixels)));
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardId, state.tableau[0][1].id());
        QVERIFY(board.keyboardFocus() == focus);
        QVERIFY(board.gameState() == state);
    }

    void logicalFocusSurvivesResize_data()
    {
        QTest::addColumn<QSize>("size");
        QTest::newRow("minimum") << QSize(720, 480);
        QTest::newRow("normal") << QSize(1000, 700);
        QTest::newRow("large") << QSize(1440, 1000);
    }

    void logicalFocusSurvivesResize()
    {
        QFETCH(QSize, size);
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QVERIFY(goTableau(board, 0, 1));
        const auto focus = board.keyboardFocus();
        board.resize(size);
        QCoreApplication::processEvents();
        QVERIFY(board.keyboardFocus() == focus);
        QVERIFY(validKeyboardFocus(board));
        QVERIFY(board.gameState() == state);
        const auto element = board.focusedElement();
        QVERIFY(element);
        QVERIFY(QRectF(board.rect()).contains(element->rectangle));
    }

    void deepFocusedCardScrollsIntoViewWithoutPointer()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        MainWindow window(settings, 42);
        window.resize(760, 600);
        auto *board = window.gameBoard();
        const auto state = deepFixture();
        QVERIFY(board->loadState(state));
        window.show();
        QVERIFY(QTest::qWaitForWindowActive(&window));
        board->setFocus(Qt::TabFocusReason);
        auto *scroll = window.findChild<QScrollArea *>(QStringLiteral("boardScrollArea"));
        QVERIFY(scroll);
        QVERIFY(goTableau(*board, 0, 12));
        QTRY_VERIFY(scroll->verticalScrollBar()->value() > 0);
        const auto rectangle = board->focusedRectangle();
        QVERIFY(rectangle);
        const auto visible = QRectF(scroll->viewport()->rect());
        const auto topLeft = board->mapTo(scroll->viewport(), rectangle->topLeft().toPoint());
        const auto bottomRight = board->mapTo(scroll->viewport(), rectangle->bottomRight().toPoint());
        QVERIFY(visible.contains(QPointF(topLeft)));
        QVERIFY(visible.contains(QPointF(bottomRight)));
        QCOMPARE(board->keyboardFocus().cardId, std::optional<CardId>{state.tableau[0].back().id()});
        QVERIFY(goTop(*board, 4));
        const auto upper = board->focusedRectangle();
        QVERIFY(upper);
        QVERIFY(visible.contains(QPointF(board->mapTo(scroll->viewport(), upper->topLeft().toPoint()))));
        QVERIFY(visible.contains(QPointF(board->mapTo(scroll->viewport(), upper->bottomRight().toPoint()))));
        QVERIFY(board->gameState() == state);
    }

    void focusTracksPointerAndReconcilesHiddenCardAfterUndo()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        auto layout = board.boardLayout();
        const auto hidden = cardElement(layout, PileType::Tableau, 0, 0);
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, hidden));
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][1].id()});
        QVERIFY(!board.selection());
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(goTableau(board, 1));
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(goTableau(board, 0));
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][0].id()});
        board.undo();
        QVERIFY(board.gameState() == state);
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][1].id()});
        QVERIFY(validKeyboardFocus(board));
    }

    void autorepeatedActivationDoesNotDrawOrSelectRepeatedly()
    {
        GameBoard board(42);
        showKeyboardBoard(board);
        const auto state = board.gameState();
        QKeyEvent repeated(QEvent::KeyPress, Qt::Key_Space, Qt::NoModifier, QStringLiteral(" "), true);
        QApplication::sendEvent(&board, &repeated);
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }
};

QTEST_MAIN(KeyboardNavigationTest)
#include "KeyboardNavigationTest.moc"
