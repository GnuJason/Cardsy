#include "BoardTestSupport.h"
#include "ui/GameBoard.h"

#include <QSignalSpy>
#include <QTest>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class GameBoardTest : public QObject
{
    Q_OBJECT

    static void clickTop(GameBoard &board, PileType pile, std::size_t index = 0)
    {
        const auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, pile, index)));
    }

    static void clickCard(GameBoard &board, std::size_t pile, std::size_t card)
    {
        const auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, cardElement(layout, PileType::Tableau, pile, card)));
    }

private slots:
    void stockClicksDispatchDrawAndRecycle()
    {
        GameBoard board(42);
        board.resize(1000, 700);
        board.show();
        const auto initial = board.gameState();
        Game expected(42);
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        for (int draw = 0; draw < 24; ++draw) {
            clickTop(board, PileType::Stock);
            QVERIFY(expected.apply(DrawStock{}));
            QVERIFY(board.gameState() == expected.state());
            QVERIFY(validate(board.gameState()).empty());
        }
        QCOMPARE(changed.count(), 24);
        clickTop(board, PileType::Stock);
        QVERIFY(expected.apply(RecycleWaste{}));
        QVERIFY(board.gameState() == expected.state());
        QVERIFY(board.gameState() == initial);
        QCOMPARE(changed.count(), 25);
        QVERIFY(!board.selection());
    }

    void stockRespectsEngineConfiguration()
    {
        Game game(42);
        QVERIFY(game.newGame({DrawCount::Three, false}, 42));
        GameBoard board(1);
        QVERIFY(board.loadState(game.state()));
        for (int draw = 0; draw < 8; ++draw) {
            clickTop(board, PileType::Stock);
            QVERIFY(game.apply(DrawStock{}));
            QVERIFY(board.gameState() == game.state());
        }
        const auto before = board.gameState();
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        clickTop(board, PileType::Stock);
        QVERIFY(board.gameState() == before);
        QCOMPARE(changed.count(), 0);
        QVERIFY(board.feedback().contains(QStringLiteral("disabled")));
    }

    void hiddenCardsCannotBecomeSources()
    {
        GameBoard board(42);
        const auto before = board.gameState();
        clickCard(board, 1, 0);
        QVERIFY(!board.selection());
        QVERIFY(board.gameState() == before);
        QVERIFY(!board.feedback().isEmpty());
    }

    void selectionCanChangeToggleAndEscape()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        board.show();
        clickCard(board, 0, 1);
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardId, state.tableau[0][1].id());
        clickCard(board, 0, 2);
        QCOMPARE(board.selection()->cardIndex, std::size_t{2});
        QVERIFY(board.gameState() == state);
        clickCard(board, 0, 2);
        QVERIFY(!board.selection());
        clickCard(board, 0, 1);
        QTest::keyClick(&board, Qt::Key_Escape);
        QVERIFY(!board.selection());
        QVERIFY(board.gameState() == state);
    }

    void illegalDestinationKeepsSelectionThenLegalRunMoves()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        Game expected(42);
        QVERIFY(expected.loadState(state));
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        clickCard(board, 0, 1);
        clickTop(board, PileType::Tableau, 2);
        QVERIFY(board.gameState() == state);
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardIndex, std::size_t{1});
        QCOMPARE(changed.count(), 0);
        QVERIFY(board.feedback().contains(QStringLiteral("not allowed")));
        QVERIFY(!board.canUndo());
        clickTop(board, PileType::Tableau, 1);
        QVERIFY(expected.apply(TableauToTableau{0, 1, 1}));
        QVERIFY(board.gameState() == expected.state());
        QVERIFY(!board.selection());
        QVERIFY(board.gameState().tableau[0].back().faceUp);
        QCOMPARE(changed.count(), 1);
        board.undo();
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.selection());
    }

    void wasteTopMovesToTableau()
    {
        GameState state;
        state.waste = {
            cardsy::test::card(Suit::Spades, Rank::Ace),
            cardsy::test::card(Suit::Hearts, Rank::Six)};
        state.tableau[0] = {cardsy::test::card(Suit::Clubs, Rank::Seven)};
        cardsy::test::fillRemainingStock(state);
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        Game expected(42);
        QVERIFY(expected.loadState(state));
        clickTop(board, PileType::Waste);
        QCOMPARE(board.selection()->cardIndex, std::size_t{1});
        clickTop(board, PileType::Tableau);
        QVERIFY(expected.apply(WasteToTableau{0}));
        QVERIFY(board.gameState() == expected.state());
        QVERIFY(validate(board.gameState()).empty());
    }

    void wasteAceMovesOnlyToEngineApprovedFoundation()
    {
        GameState state;
        state.waste = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
        cardsy::test::fillRemainingStock(state);
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        clickTop(board, PileType::Waste);
        clickTop(board, PileType::Foundation, 0);
        QVERIFY(board.gameState() == state);
        QVERIFY(board.selection());
        clickTop(board, PileType::Foundation, 2);
        Game expected(42);
        QVERIFY(expected.loadState(state));
        QVERIFY(expected.apply(WasteToFoundation{2}));
        QVERIFY(board.gameState() == expected.state());
        QVERIFY(!board.selection());
    }

    void foundationCanReturnToTableau()
    {
        GameState state;
        state.foundations[2] = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
        state.tableau[0] = {cardsy::test::card(Suit::Clubs, Rank::Two)};
        cardsy::test::fillRemainingStock(state);
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        clickTop(board, PileType::Foundation, 2);
        clickTop(board, PileType::Tableau);
        Game expected(42);
        QVERIFY(expected.loadState(state));
        QVERIFY(expected.apply(FoundationToTableau{2, 0}));
        QVERIFY(board.gameState() == expected.state());
    }

    void emptyTableauAcceptsKingViaEngine()
    {
        GameState state;
        state.tableau[0] = {cardsy::test::card(Suit::Hearts, Rank::King)};
        cardsy::test::fillRemainingStock(state);
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        clickTop(board, PileType::Tableau);
        clickTop(board, PileType::Tableau, 1);
        QVERIFY(board.gameState().tableau[0].empty());
        QCOMPARE(board.gameState().tableau[1].back().id(), state.tableau[0][0].id());
        QVERIFY(validate(board.gameState()).empty());
    }

    void selectedSuffixCannotAccidentallyMoveDifferentTopCard()
    {
        GameState state;
        state.tableau[0] = {
            cardsy::test::card(Suit::Hearts, Rank::Two),
            cardsy::test::card(Suit::Clubs, Rank::Ace)};
        cardsy::test::fillRemainingStock(state);
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        clickCard(board, 0, 0);
        clickTop(board, PileType::Foundation);
        QVERIFY(board.gameState() == state);
        QVERIFY(board.selection());
        QVERIFY(!board.canUndo());
    }

    void validatedLoadRejectsCorruptStateAndPreservesSelection()
    {
        GameBoard board(42);
        const auto valid = tableauFixture();
        QVERIFY(board.loadState(valid));
        clickCard(board, 0, 1);
        auto corrupt = valid;
        corrupt.stock.clear();
        QCOMPARE(board.loadState(corrupt).error, GameError::InvalidState);
        QVERIFY(board.gameState() == valid);
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardId, valid.tableau[0][1].id());
    }

    void stockUndoAndNewGameClearTransientSelection()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        clickCard(board, 0, 1);
        clickTop(board, PileType::Stock);
        QVERIFY(!board.selection());
        QVERIFY(board.canUndo());
        clickCard(board, 0, 1);
        board.undo();
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.selection());
        clickTop(board, PileType::Stock);
        clickCard(board, 0, 1);
        board.newGame();
        QVERIFY(!board.selection());
        QVERIFY(!board.canUndo());
        QCOMPARE(board.gameState().stock.size(), std::size_t{24});
        QVERIFY(validate(board.gameState()).empty());
    }

    void engineWinStatusProducesSmallFeedback()
    {
        GameBoard board(42);
        QVERIFY(board.loadState(cardsy::test::nearlyWon()));
        for (std::size_t suit = 0; suit < 4; ++suit) {
            clickTop(board, PileType::Tableau, suit);
            clickTop(board, PileType::Foundation, suit);
        }
        QCOMPARE(board.gameState().status, GameStatus::Won);
        QVERIFY(board.feedback().contains(QStringLiteral("You won")));
        board.undo();
        QCOMPARE(board.gameState().status, GameStatus::Playing);
        QVERIFY(!board.feedback().contains(QStringLiteral("You won")));
    }

    void resizePreservesStateSelectionAndHitRegions()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        board.show();
        clickCard(board, 0, 1);
        for (const auto size : {QSize(720, 480), QSize(1000, 700), QSize(1440, 1000)}) {
            board.resize(size);
            QCoreApplication::processEvents();
            QVERIFY(board.gameState() == state);
            QVERIFY(board.selection());
            QCOMPARE(board.selection()->cardId, state.tableau[0][1].id());
            const auto layout = board.boardLayout();
            QCOMPARE(layout.size, QSizeF(board.size()));
            for (const auto &element : layout.elements) {
                QVERIFY(QRectF(board.rect()).contains(element.rectangle));
                const auto hit = layout.hitTest(exposedPoint(layout, element));
                QVERIFY(hit);
                QCOMPARE(hit->pile, element.pile);
                QCOMPARE(hit->pileIndex, element.pileIndex);
                QCOMPARE(hit->cardIndex, element.cardIndex);
            }
        }
        clickTop(board, PileType::Tableau, 1);
        QCOMPARE(board.gameState().tableau[1].size(), std::size_t{3});
    }
};

QTEST_MAIN(GameBoardTest)
#include "GameBoardTest.moc"
