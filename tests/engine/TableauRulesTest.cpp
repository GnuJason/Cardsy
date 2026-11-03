#include "TestSupport.h"
#include "engine/Rules.h"

#include <QTest>

#include <limits>

using namespace cardsy;
using namespace cardsy::test;

class TableauRulesTest : public QObject
{
    Q_OBJECT

private slots:
    void placement_data()
    {
        QTest::addColumn<int>("sourceSuit");
        QTest::addColumn<int>("sourceRank");
        QTest::addColumn<int>("targetSuit");
        QTest::addColumn<int>("targetRank");
        QTest::addColumn<bool>("legal");
        QTest::newRow("red-six-on-black-seven") << 2 << 6 << 0 << 7 << true;
        QTest::newRow("black-queen-on-red-king") << 3 << 12 << 1 << 13 << true;
        QTest::newRow("red-on-red") << 2 << 6 << 1 << 7 << false;
        QTest::newRow("black-on-black") << 0 << 6 << 3 << 7 << false;
        QTest::newRow("six-on-eight") << 2 << 6 << 0 << 8 << false;
        QTest::newRow("eight-on-six") << 2 << 8 << 0 << 6 << false;
        QTest::newRow("same-rank") << 2 << 7 << 0 << 7 << false;
    }

    void placement()
    {
        QFETCH(int, sourceSuit);
        QFETCH(int, sourceRank);
        QFETCH(int, targetSuit);
        QFETCH(int, targetRank);
        QFETCH(bool, legal);
        GameState state;
        state.tableau[0] = {card(static_cast<Suit>(sourceSuit), static_cast<Rank>(sourceRank))};
        state.tableau[1] = {card(static_cast<Suit>(targetSuit), static_cast<Rank>(targetRank))};
        fillRemainingStock(state);
        QVERIFY(validate(state).empty());
        Game game(42);
        QVERIFY(game.loadState(state));
        const auto result = game.apply(TableauToTableau{0, 0, 1});
        QCOMPARE(static_cast<bool>(result), legal);
        if (legal) {
            QVERIFY(game.state().tableau[0].empty());
            QCOMPARE(game.state().tableau[1].size(), std::size_t{2});
            QCOMPARE(game.state().tableau[1].back().id(), state.tableau[0][0].id());
        } else {
            QCOMPARE(result.error, GameError::IllegalPlacement);
            QVERIFY(game.state() == state);
            QVERIFY(!game.canUndo());
        }
        QVERIFY(validate(game.state()).empty());
    }

    void kingLedRunMovesToEmptyColumn()
    {
        GameState state;
        state.tableau[0] = {
            card(Suit::Hearts, Rank::King),
            card(Suit::Clubs, Rank::Queen),
            card(Suit::Diamonds, Rank::Jack),
        };
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QVERIFY(game.apply(TableauToTableau{0, 0, 1}));
        QVERIFY(game.state().tableau[0].empty());
        QVERIFY(game.state().tableau[1] == state.tableau[0]);
        QVERIFY(validate(game.state()).empty());
    }

    void singleKingAllowedButQueenRejectedOnEmpty()
    {
        QVERIFY(canPlaceOnTableau(card(Suit::Hearts, Rank::King), {}));
        QVERIFY(!canPlaceOnTableau(card(Suit::Hearts, Rank::Queen), {}));
        GameState state;
        state.tableau[0] = {card(Suit::Hearts, Rank::Queen)};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QCOMPARE(game.apply(TableauToTableau{0, 0, 1}).error, GameError::IllegalPlacement);
        QVERIFY(game.state() == state);
    }

    void movingSuffixRevealsExactlyOneCard()
    {
        GameState state;
        state.tableau[0] = {
            card(Suit::Spades, Rank::Two, false),
            card(Suit::Hearts, Rank::Three, false),
            card(Suit::Clubs, Rank::Ten),
            card(Suit::Hearts, Rank::Nine),
            card(Suit::Spades, Rank::Eight),
        };
        state.tableau[1] = {card(Suit::Diamonds, Rank::Jack)};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QVERIFY(game.apply(TableauToTableau{0, 2, 1}));
        QCOMPARE(game.state().tableau[0].size(), std::size_t{2});
        QVERIFY(!game.state().tableau[0][0].faceUp);
        QVERIFY(game.state().tableau[0][1].faceUp);
        QCOMPARE(game.state().tableau[1].size(), std::size_t{4});
        for (std::size_t index = 0; index < 3; ++index) {
            QCOMPARE(game.state().tableau[1][index + 1].id(), state.tableau[0][index + 2].id());
        }
        QVERIFY(validate(game.state()).empty());
    }

    void rejectsFaceDownAndMalformedRuns()
    {
        QVERIFY(!isValidTableauRun({}));
        QVERIFY(!isValidTableauRun({card(Suit::Hearts, Rank::Six, false)}));
        QVERIFY(!isValidTableauRun({
            card(Suit::Clubs, Rank::Ten), card(Suit::Spades, Rank::Nine)}));
        QVERIFY(!isValidTableauRun({
            card(Suit::Clubs, Rank::Ten), card(Suit::Hearts, Rank::Eight)}));
        QVERIFY(!canPlaceOnTableau(card(Suit::Hearts, Rank::Six, false),
                                   {card(Suit::Clubs, Rank::Seven)}));
        QVERIFY(!canPlaceOnTableau(card(Suit::Hearts, Rank::Six),
                                   {card(Suit::Clubs, Rank::Seven, false)}));
        GameState state;
        state.tableau[0] = {
            card(Suit::Hearts, Rank::Six, false), card(Suit::Clubs, Rank::Ace)};
        state.tableau[1] = {card(Suit::Spades, Rank::Seven)};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QCOMPARE(game.apply(TableauToTableau{0, 0, 1}).error, GameError::FaceDownCard);
        QVERIFY(game.state() == state);

        auto malformed = state;
        malformed.tableau[0][0].faceUp = true;
        QCOMPARE(game.loadState(malformed).error, GameError::InvalidState);
        QVERIFY(game.state() == state);
    }

    void rejectsOutOfRangeAndSamePileRequests()
    {
        Game game(42);
        const auto before = game.state();
        for (const auto move : {
                 TableauToTableau{7, 0, 0}, TableauToTableau{0, 0, 7},
                 TableauToTableau{0, 1, 1},
                 TableauToTableau{0, std::numeric_limits<std::size_t>::max(), 1}}) {
            QCOMPARE(game.apply(move).error, GameError::InvalidIndex);
            QVERIFY(game.state() == before);
        }
        QCOMPARE(game.apply(TableauToTableau{0, 0, 0}).error, GameError::IllegalPlacement);
        QVERIFY(game.state() == before);
        QVERIFY(!game.canUndo());
    }
};

QTEST_APPLESS_MAIN(TableauRulesTest)
#include "TableauRulesTest.moc"
