#include "KeyboardTestSupport.h"
#include "ImageTestSupport.h"
#include "ui/CardBackSettings.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QSignalSpy>
#include <QTemporaryDir>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class KeyboardGameplayTest : public QObject
{
    Q_OBJECT

    struct MoveCase {
        GameState state;
        PileType source = PileType::Tableau;
        std::size_t sourcePile = 0;
        PileType target = PileType::Tableau;
        std::size_t targetPile = 1;
        Move move = TableauToTableau{0, 1, 1};
    };

    static MoveCase moveCase(int kind)
    {
        MoveCase result;
        auto &state = result.state;
        state.config = {DrawCount::Three, false};
        const auto hidden = cardsy::test::card(Suit::Diamonds, Rank::Two, false);
        state.tableau[0] = {hidden, cardsy::test::card(Suit::Hearts, Rank::Six)};
        state.tableau[1] = {cardsy::test::card(Suit::Clubs, Rank::Seven)};
        switch (kind) {
        case 0:
            break;
        case 1:
            state.tableau[0].push_back(cardsy::test::card(Suit::Spades, Rank::Five));
            break;
        case 2:
            state.tableau[0] = {
                hidden, cardsy::test::card(Suit::Hearts, Rank::King),
                cardsy::test::card(Suit::Clubs, Rank::Queen)};
            state.tableau[1].clear();
            break;
        case 3:
            state.tableau[0] = {hidden, cardsy::test::card(Suit::Hearts, Rank::Ace)};
            result.target = PileType::Foundation;
            result.targetPile = 2;
            result.move = TableauToFoundation{0, 2};
            break;
        case 4:
            state.tableau[0].clear();
            state.waste = {
                cardsy::test::card(Suit::Spades, Rank::Ace),
                cardsy::test::card(Suit::Hearts, Rank::Six)};
            result.source = PileType::Waste;
            result.move = WasteToTableau{1};
            break;
        case 5:
            state.tableau[0].clear();
            state.waste = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            result.source = PileType::Waste;
            result.target = PileType::Foundation;
            result.targetPile = 2;
            result.move = WasteToFoundation{2};
            break;
        case 6:
            state.tableau[0].clear();
            state.foundations[2] = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            state.tableau[1] = {cardsy::test::card(Suit::Clubs, Rank::Two)};
            result.source = PileType::Foundation;
            result.sourcePile = 2;
            result.move = FoundationToTableau{2, 1};
            break;
        case 7:
            state.tableau[0] = {cardsy::test::card(Suit::Hearts, Rank::Two)};
            state.foundations[2] = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            result.target = PileType::Foundation;
            result.targetPile = 2;
            result.move = TableauToFoundation{0, 2};
            break;
        }
        cardsy::test::fillRemainingStock(state);
        return result;
    }

    static bool goSourceOrTarget(GameBoard &board, PileType pile, std::size_t index)
    {
        return pile == PileType::Tableau ? goTableau(board, index)
            : pile == PileType::Waste ? goTop(board, 1) : goTop(board, index + 2);
    }

private slots:
    void everyMoveUsesSharedEngineIntentAndUndoesExactly_data()
    {
        QTest::addColumn<int>("kind");
        QTest::newRow("tableau-card") << 0;
        QTest::newRow("tableau-sequence") << 1;
        QTest::newRow("king-sequence-empty-tableau") << 2;
        QTest::newRow("tableau-foundation") << 3;
        QTest::newRow("waste-tableau") << 4;
        QTest::newRow("waste-foundation") << 5;
        QTest::newRow("foundation-tableau") << 6;
        QTest::newRow("occupied-foundation") << 7;
    }

    void everyMoveUsesSharedEngineIntentAndUndoesExactly()
    {
        QFETCH(int, kind);
        const auto fixture = moveCase(kind);
        QVERIFY(validate(fixture.state).empty());
        GameBoard board(42);
        QVERIFY(board.loadState(fixture.state));
        showKeyboardBoard(board);
        Game expected(42);
        QVERIFY(expected.loadState(fixture.state));
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        QVERIFY(goSourceOrTarget(board, fixture.source, fixture.sourcePile));
        QTest::keyClick(&board, kind % 2 == 0 ? Qt::Key_Return : Qt::Key_Space);
        QVERIFY(board.selection());
        QVERIFY(board.gameState() == fixture.state);
        QVERIFY(goSourceOrTarget(board, fixture.target, fixture.targetPile));
        QVERIFY(board.gameState() == fixture.state);
        QCOMPARE(changed.count(), 0);
        QTest::keyClick(&board, kind % 2 == 0 ? Qt::Key_Space : Qt::Key_Return);
        QVERIFY(expected.apply(fixture.move));
        QVERIFY(board.gameState() == expected.state());
        QCOMPARE(changed.count(), 1);
        QVERIFY(!board.selection());
        QVERIFY(!board.drag());
        QVERIFY(validKeyboardFocus(board));
        board.undo();
        QVERIFY(board.gameState() == fixture.state);
        QVERIFY(validKeyboardFocus(board));
        QVERIFY(!board.canUndo());
    }

    void stockEnterSpaceExhaustionAndRecycle_data()
    {
        QTest::addColumn<int>("key");
        QTest::addColumn<int>("drawCount");
        QTest::newRow("enter-draw-one") << int(Qt::Key_Return) << 1;
        QTest::newRow("space-draw-one") << int(Qt::Key_Space) << 1;
        QTest::newRow("enter-draw-three") << int(Qt::Key_Return) << 3;
        QTest::newRow("space-draw-three") << int(Qt::Key_Space) << 3;
    }

    void stockEnterSpaceExhaustionAndRecycle()
    {
        QFETCH(int, key);
        QFETCH(int, drawCount);
        Game expected(42);
        QVERIFY(expected.newGame({static_cast<DrawCount>(drawCount), true}, 42));
        GameBoard board(1);
        QVERIFY(board.loadState(expected.state()));
        showKeyboardBoard(board);
        const auto initial = board.gameState();
        while (!expected.state().stock.empty()) {
            QTest::keyClick(&board, static_cast<Qt::Key>(key));
            QVERIFY(expected.apply(DrawStock{}));
            QVERIFY(board.gameState() == expected.state());
            QVERIFY(board.keyboardFocus() == BoardFocus{});
            QVERIFY(validKeyboardFocus(board));
        }
        QVERIFY(!board.focusedElement()->cardIndex);
        QTest::keyClick(&board, static_cast<Qt::Key>(key));
        QVERIFY(expected.apply(RecycleWaste{}));
        QVERIFY(board.gameState() == expected.state());
        QVERIFY(board.gameState() == initial);
        QVERIFY(validKeyboardFocus(board));
    }

    void illegalDestinationKeepsSelectionAndDoesNotAddHistory_data()
    {
        QTest::addColumn<bool>("foundation");
        QTest::newRow("tableau") << false;
        QTest::newRow("foundation") << true;
    }

    void illegalDestinationKeepsSelectionAndDoesNotAddHistory()
    {
        QFETCH(bool, foundation);
        auto state = tableauFixture();
        if (foundation) {
            state = {};
            state.tableau[0] = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            cardsy::test::fillRemainingStock(state);
        }
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QTest::keyClick(&board, Qt::Key_Return);
        const auto drawn = board.gameState();
        QVERIFY(goTableau(board, 0));
        QTest::keyClick(&board, Qt::Key_Space);
        const auto selected = board.selection()->cardId;
        QVERIFY(foundation ? goTop(board, 2) : goTableau(board, 2));
        const auto destination = board.keyboardFocus();
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(board.gameState() == drawn);
        QCOMPARE(changed.count(), 0);
        QCOMPARE(board.selection()->cardId, selected);
        QVERIFY(board.keyboardFocus() == destination);
        QVERIFY(!board.feedback().isEmpty());
        QTest::keyClick(&board, Qt::Key_Escape);
        QVERIFY(!board.selection());
        QVERIFY(board.keyboardFocus() == destination);
        board.undo();
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
        QVERIFY(validKeyboardFocus(board));
    }

    void keyboardAndMouseClickShareSelectionInBothDirections()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QVERIFY(goTableau(board, 0));
        QTest::keyClick(&board, Qt::Key_Return);
        auto layout = board.boardLayout();
        auto target = topElement(layout, PileType::Tableau, 1);
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, target));
        QCOMPARE(board.gameState().tableau[1].size(), std::size_t{3});
        board.undo();
        QVERIFY(board.gameState() == state);
        layout = board.boardLayout();
        const auto source = cardElement(layout, PileType::Tableau, 0, 1);
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, source));
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][1].id()});
        QVERIFY(goTableau(board, 1));
        QTest::keyClick(&board, Qt::Key_Space);
        QCOMPARE(board.gameState().tableau[1].size(), std::size_t{3});
        QVERIFY(validKeyboardFocus(board));
        board.undo();
        QVERIFY(board.gameState() == state);
    }

    void draggingAfterKeyboardFocusTracksMovedIdentity()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QVERIFY(goTop(board, 5));
        auto layout = board.boardLayout();
        const auto source = cardElement(layout, PileType::Tableau, 0, 1);
        const auto start = exposedPoint(layout, source);
        const auto end = topElement(layout, PileType::Tableau, 1).rectangle.center().toPoint();
        QTest::mousePress(&board, Qt::LeftButton, Qt::NoModifier, start);
        moveHeldPointer(board, start + QPoint(QApplication::startDragDistance() + 2, 0));
        QVERIFY(board.drag() && board.drag()->active);
        moveHeldPointer(board, end);
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, end);
        QCOMPARE(board.keyboardFocus().pile, PileType::Tableau);
        QCOMPARE(board.keyboardFocus().pileIndex, std::size_t{1});
        QCOMPARE(board.keyboardFocus().cardId, std::optional<CardId>{state.tableau[0][1].id()});
        QVERIFY(validKeyboardFocus(board));
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardId, state.tableau[0][1].id());
        QTest::keyClick(&board, Qt::Key_Escape);
        board.undo();
        QVERIFY(board.gameState() == state);
        QCOMPARE(board.keyboardFocus().pileIndex, std::size_t{0});
        QVERIFY(validKeyboardFocus(board));
    }

    void arrowAndEscapeSafelyInterruptPointerDrag_data()
    {
        QTest::addColumn<int>("key");
        QTest::newRow("escape") << int(Qt::Key_Escape);
        QTest::newRow("navigation") << int(Qt::Key_Right);
    }

    void arrowAndEscapeSafelyInterruptPointerDrag()
    {
        QFETCH(int, key);
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        QVERIFY(goTableau(board, 0));
        QTest::keyClick(&board, Qt::Key_Return);
        const auto layout = board.boardLayout();
        const auto start = exposedPoint(layout, cardElement(layout, PileType::Tableau, 0, 1));
        QTest::mousePress(&board, Qt::LeftButton, Qt::NoModifier, start);
        moveHeldPointer(board, start + QPoint(QApplication::startDragDistance() + 2, 0));
        QVERIFY(board.drag() && board.drag()->active);
        QTest::keyClick(&board, static_cast<Qt::Key>(key));
        QVERIFY(!board.drag());
        if (key == Qt::Key_Escape) {
            QVERIFY(!board.selection());
        } else {
            QVERIFY(board.selection());
        }
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier,
                            topElement(layout, PileType::Tableau, 1).rectangle.center().toPoint());
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
        QVERIFY(validKeyboardFocus(board));
    }

    void newGameShortcutResetsFocusAndInteractionButKeepsPersonalization()
    {
        QTemporaryDir directory;
        const auto sourcePath = directory.filePath(QStringLiteral("synthetic.png"));
        writeBytes(sourcePath, encodeImage(syntheticImage()));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        QVERIFY(window.installCardBack(sourcePath));
        auto *board = window.gameBoard();
        QVERIFY(board->loadState(tableauFixture()));
        window.show();
        QVERIFY(QTest::qWaitForWindowActive(&window));
        board->setFocus();
        QVERIFY(goTableau(*board, 0));
        QTest::keyClick(board, Qt::Key_Return);
        const auto image = board->cardBackImage();
        const auto persisted = readBytes(settings.managedPath());
        const auto layout = board->boardLayout();
        const auto start = exposedPoint(layout, cardElement(layout, PileType::Tableau, 0, 1));
        QTest::mousePress(board, Qt::LeftButton, Qt::NoModifier, start);
        moveHeldPointer(*board, start + QPoint(QApplication::startDragDistance() + 2, 0));
        QTest::keySequence(board, window.findChild<QAction *>(QStringLiteral("newGameAction"))->shortcut());
        QTRY_VERIFY(board->keyboardFocus() == BoardFocus{});
        QVERIFY(!board->selection());
        QVERIFY(!board->drag());
        QVERIFY(!board->canUndo());
        QVERIFY(board->cardBackImage() == image);
        QCOMPARE(readBytes(settings.managedPath()), persisted);
        QVERIFY(validate(board->gameState()).empty());
        QTest::mouseRelease(board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        QVERIFY(!board->canUndo());
    }

    void keyboardCanCompleteWinningGameAndUndoLastMove()
    {
        Game expected(42);
        QVERIFY(expected.loadState(cardsy::test::nearlyWon()));
        GameBoard board(42);
        QVERIFY(board.loadState(expected.state()));
        showKeyboardBoard(board);
        GameState beforeWin;
        for (std::size_t suit = 0; suit < 4; ++suit) {
            QVERIFY(goTableau(board, suit));
            QTest::keyClick(&board, Qt::Key_Return);
            QVERIFY(goTop(board, suit + 2));
            beforeWin = board.gameState();
            QTest::keyClick(&board, Qt::Key_Space);
            QVERIFY(expected.apply(TableauToFoundation{suit, suit}));
            QVERIFY(board.gameState() == expected.state());
            QVERIFY(validKeyboardFocus(board));
        }
        QCOMPARE(board.gameState().status, GameStatus::Won);
        QVERIFY(board.feedback().contains(QStringLiteral("You won")));
        QVERIFY(board.accessibleDescription().contains(QStringLiteral("You won")));
        board.undo();
        QVERIFY(board.gameState() == beforeWin);
        QCOMPARE(board.gameState().status, GameStatus::Playing);
        QCOMPARE(board.keyboardFocus().pile, PileType::Foundation);
        QCOMPARE(board.keyboardFocus().pileIndex, std::size_t{3});
        QVERIFY(validKeyboardFocus(board));
    }

    void quitShortcutClosesNativeWindow()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        MainWindow window(settings, 42);
        window.show();
        QVERIFY(QTest::qWaitForWindowActive(&window));
        auto *board = window.gameBoard();
        board->setFocus();
        const auto initial = board->gameState();
        const auto *quit = window.findChild<QAction *>(QStringLiteral("quitAction"));
        QVERIFY(quit);
        QVERIFY(!quit->shortcut().isEmpty());
        QTest::keySequence(board, quit->shortcut());
        QTRY_VERIFY(!window.isVisible());
        QVERIFY(board->gameState() == initial);
    }
};

QTEST_MAIN(KeyboardGameplayTest)
#include "KeyboardGameplayTest.moc"
