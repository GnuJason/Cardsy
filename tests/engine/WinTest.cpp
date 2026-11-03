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
};

QTEST_APPLESS_MAIN(WinTest)
#include "WinTest.moc"
