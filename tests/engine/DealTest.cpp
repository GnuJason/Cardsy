#include "TestSupport.h"

#include <QTest>

using namespace cardsy;

class DealTest : public QObject
{
    Q_OBJECT

private slots:
    void dealsExactShapeAndOrder()
    {
        const auto deck = createDeck();
        const auto result = dealKlondike(deck);
        QVERIFY(result);
        const auto &state = *result.state;
        QVERIFY(validate(state).empty());
        std::size_t offset = 0;
        for (std::size_t pile = 0; pile < 7; ++pile) {
            QCOMPARE(state.tableau[pile].size(), pile + 1);
            for (std::size_t index = 0; index <= pile; ++index) {
                QCOMPARE(state.tableau[pile][index].id(), deck[offset++].id());
                QCOMPARE(state.tableau[pile][index].faceUp, index == pile);
            }
        }
        QCOMPARE(offset, std::size_t{28});
        QCOMPARE(state.stock.size(), std::size_t{24});
        for (std::size_t index = 0; index < 24; ++index) {
            QCOMPARE(state.stock[index].id(), deck[28 + index].id());
            QVERIFY(!state.stock[index].faceUp);
        }
        QVERIFY(state.waste.empty());
        for (const auto &foundation : state.foundations) {
            QVERIFY(foundation.empty());
        }
        QVERIFY(!isWon(state));
        QVERIFY(!state.shuffleSeed);
    }

    void seedAndConfigSurviveNewGame()
    {
        Game game(42);
        QVERIFY(game.apply(DrawStock{}));
        QVERIFY(game.canUndo());
        const GameConfig config{DrawCount::Three, false};
        QVERIFY(game.newGame(config, 123));
        QVERIFY(!game.canUndo());
        QVERIFY(game.state().config == config);
        QVERIFY(game.state().shuffleSeed == 123U);
        QVERIFY(validate(game.state()).empty());
        QVERIFY(game.state() == *dealKlondike(shuffle(createDeck(), 123), config, 123).state);
        const auto first = game.state();
        QVERIFY(game.newGame(config, 123));
        QVERIFY(game.state() == first);
        QVERIFY(game.newGame(config, 124));
        QVERIFY(!(game.state() == first));
    }

    void defaultGameAndUnseededNewGameAreValid()
    {
        Game game;
        QVERIFY(validate(game.state()).empty());
        QVERIFY(game.state().shuffleSeed.has_value());
        QVERIFY(game.newGame());
        QVERIFY(validate(game.state()).empty());
        QVERIFY(game.state().shuffleSeed.has_value());
        QVERIFY(game.state().config == GameConfig{});
        QVERIFY(!game.canUndo());
    }

    void rejectsMalformedDeckAndConfiguration()
    {
        auto deck = createDeck();
        deck[1] = deck[0];
        QCOMPARE(dealKlondike(deck).error, GameError::InvalidDeck);
        deck = createDeck();
        deck[0].rank = static_cast<Rank>(0);
        QCOMPARE(dealKlondike(deck).error, GameError::InvalidDeck);
        deck = createDeck();
        deck[0].suit = static_cast<Suit>(4);
        QCOMPARE(dealKlondike(deck).error, GameError::InvalidDeck);
        const GameConfig invalid{static_cast<DrawCount>(2), true};
        QCOMPARE(dealKlondike(createDeck(), invalid).error, GameError::InvalidConfiguration);
        Game game(42);
        QVERIFY(game.apply(DrawStock{}));
        const auto before = game.state();
        QCOMPARE(game.newGame(invalid, 13).error, GameError::InvalidConfiguration);
        QVERIFY(game.state() == before);
        QCOMPARE(game.newGame(invalid).error, GameError::InvalidConfiguration);
        QVERIFY(game.state() == before);
        QVERIFY(game.canUndo());
    }
};

QTEST_APPLESS_MAIN(DealTest)
#include "DealTest.moc"
