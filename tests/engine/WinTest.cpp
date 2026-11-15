#include "TestSupport.h"

#include <QTest>

using namespace cardsy;
using namespace cardsy::test;

class WinTest : public QObject
{
    Q_OBJECT

private slots:
    void newAndPartialGamesAreNotWon()
    {
        Game game(42);
        QVERIFY(!isWon(game.state()));
        QCOMPARE(game.state().status, GameStatus::Playing);
        QVERIFY(!isWon(nearlyWon()));
    }

    void allFiftyTwoCorrectFoundationCardsWin()
    {
        Game game(42);
        QVERIFY(game.loadState(nearlyWon()));
        for (std::size_t suit = 0; suit < 4; ++suit) {
            const auto before = game.state();
            QVERIFY(game.apply(TableauToFoundation{suit, suit}));
            QVERIFY(validate(game.state()).empty());
            QCOMPARE(isWon(game.state()), suit == 3);
            QCOMPARE(game.state().status, suit == 3 ? GameStatus::Won : GameStatus::Playing);
            if (suit == 3) {
                const auto won = game.state();
                QVERIFY(game.undo());
                QVERIFY(game.state() == before);
                QVERIFY(game.apply(TableauToFoundation{suit, suit}));
                QVERIFY(game.state() == won);
            }
        }
        const auto won = game.state();
        QVERIFY(game.loadState(won));
        QVERIFY(isWon(game.state()));
        QVERIFY(game.apply(FoundationToTableau{0, 0}));
        QVERIFY(!isWon(game.state()));
        QCOMPARE(game.state().status, GameStatus::Playing);
        QVERIFY(validate(game.state()).empty());
        QVERIFY(game.undo());
        QVERIFY(game.state() == won);
    }

    void malformedFullFoundationsNeverWin()
    {
        GameState won;
        for (auto item : createDeck()) {
            item.faceUp = true;
            won.foundations[static_cast<std::size_t>(item.suit)].push_back(item);
        }
        won.status = GameStatus::Won;
        QVERIFY(validate(won).empty());
        QVERIFY(isWon(won));
        auto malformed = won;
        malformed.foundations[0][1] = malformed.foundations[0][0];
        QVERIFY(!isWon(malformed));
        malformed = won;
        malformed.foundations[0][0].faceUp = false;
        QVERIFY(!isWon(malformed));
        malformed = won;
        std::swap(malformed.foundations[0][0], malformed.foundations[0][1]);
        QVERIFY(!isWon(malformed));
        malformed = won;
        malformed.stock = {card(Suit::Clubs, Rank::Ace, false)};
        QVERIFY(!isWon(malformed));
    }

    void victoryIsDerivedButStoredStatusMustAgree()
    {
        auto state = nearlyWon();
        for (std::size_t suit = 0; suit < 4; ++suit) {
            state.foundations[suit].push_back(state.tableau[suit].back());
            state.tableau[suit].clear();
        }
        QVERIFY(isWon(state));
        QVERIFY(hasIssue(state, Invariant::Status));
        Game game(42);
        QCOMPARE(game.loadState(state).error, GameError::InvalidState);
        state.status = GameStatus::Won;
        QVERIFY(game.loadState(state));
        QVERIFY(validate(game.state()).empty());
    }

    void completeControlledGameFromStockToFoundations()
    {
        const auto deck = createDeck();
        GameState initial;
        initial.stock.assign(deck.rbegin(), deck.rend());
        Game game(42);
        QVERIFY(game.loadState(initial));
        for (std::size_t index = 0; index < deck.size(); ++index) {
            QVERIFY(game.apply(DrawStock{}));
            const auto suit = static_cast<std::size_t>(game.state().waste.back().suit);
            QVERIFY(game.apply(WasteToFoundation{suit}));
            QVERIFY(validate(game.state()).empty());
            QCOMPARE(game.state().foundations[suit].back().rank, deck[index].rank);
            QCOMPARE(isWon(game.state()), index == 51);
        }
        QCOMPARE(game.state().status, GameStatus::Won);
        for (std::size_t index = 0; index < 104; ++index) {
            QVERIFY(game.undo());
            QVERIFY(validate(game.state()).empty());
        }
        QVERIFY(game.state() == initial);
        QVERIFY(!game.canUndo());
    }

    void seededDealCanBePlayedToVictory()
    {
        using D = DrawStock;
        using R = RecycleWaste;
        using T = TableauToTableau;
        using F = TableauToFoundation;
        using W = WasteToTableau;
        using A = WasteToFoundation;
        const std::vector<Move> moves{
            F{2, 1}, T{6, 6, 3}, F{6, 1}, F{6, 3}, F{1, 3}, T{6, 3, 5},
            T{2, 1, 0}, D{}, D{}, D{}, D{}, D{}, D{}, D{}, W{0}, T{3, 3, 0},
            T{6, 2, 3}, T{3, 2, 2}, D{}, D{}, D{}, D{}, D{}, W{2}, T{1, 0, 2},
            T{4, 4, 1}, D{}, D{}, D{}, D{}, A{1}, T{0, 1, 5}, D{}, A{0}, D{},
            A{3}, D{}, D{}, D{}, D{}, D{}, W{1}, D{}, A{2}, R{}, D{}, A{1},
            D{}, D{}, W{0}, D{}, D{}, D{}, D{}, D{}, A{1}, D{}, A{3}, F{4, 3},
            T{3, 1, 4}, T{5, 5, 3}, T{3, 0, 4}, T{4, 2, 3}, T{0, 0, 4},
            D{}, D{}, W{1}, W{1}, T{2, 0, 1}, D{}, D{}, D{}, T{3, 6, 4},
            D{}, W{2}, T{5, 4, 2}, F{5, 3}, F{5, 0}, F{6, 0}, F{5, 2},
            F{5, 1}, T{6, 0, 4}, D{}, W{3}, T{4, 5, 3}, F{4, 3}, D{}, R{},
            D{}, A{0}, D{}, W{2}, D{}, A{1}, T{3, 6, 4}, F{3, 1}, D{}, D{},
            A{2}, F{4, 2}, F{4, 0}, F{1, 2}, F{4, 2}, F{1, 0}, F{4, 0},
            F{1, 2}, F{4, 2}, F{1, 0}, F{4, 0}, F{1, 2}, T{3, 4, 4}, F{3, 2},
            T{1, 3, 2}, F{1, 2}, D{}, A{1}, D{}, A{3}, F{4, 3}, F{4, 1},
            F{2, 3}, F{3, 3}, F{2, 1}, F{3, 1}, F{2, 3}, A{3}, T{1, 1, 2},
            F{1, 1}, D{}, A{2}, D{}, A{0}, F{4, 0}, F{2, 0}, F{3, 0}, F{2, 2}
        };
        Game game(0);
        for (std::size_t index = 0; index < moves.size(); ++index) {
            const auto result = game.apply(moves[index]);
            QVERIFY2(result, qPrintable(QStringLiteral("Move %1 failed with error %2")
                                           .arg(index).arg(static_cast<int>(result.error))));
            QVERIFY(validate(game.state()).empty());
            const bool finalMove = index + 1 == moves.size();
            QCOMPARE(isWon(game.state()), finalMove);
            QCOMPARE(game.state().status, finalMove ? GameStatus::Won : GameStatus::Playing);
        }
    }
};

QTEST_APPLESS_MAIN(WinTest)
#include "WinTest.moc"
