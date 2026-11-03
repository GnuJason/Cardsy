#include "TestSupport.h"
#include "engine/Rules.h"

#include <QTest>

using namespace cardsy;
using namespace cardsy::test;

class FoundationRulesTest : public QObject
{
    Q_OBJECT

private slots:
    void foundationPlacement_data()
    {
        QTest::addColumn<int>("suit");
        QTest::addColumn<int>("rank");
        QTest::addColumn<int>("targetLength");
        QTest::addColumn<bool>("faceUp");
        QTest::addColumn<bool>("legal");
        QTest::newRow("ace-on-empty") << 2 << 1 << 0 << true << true;
        QTest::newRow("two-on-ace") << 2 << 2 << 1 << true << true;
        QTest::newRow("higher-rank") << 2 << 10 << 9 << true << true;
        QTest::newRow("king-finishes") << 2 << 13 << 12 << true << true;
        QTest::newRow("non-ace-on-empty") << 2 << 2 << 0 << true << false;
        QTest::newRow("wrong-suit") << 1 << 2 << 1 << true << false;
        QTest::newRow("wrong-empty-slot") << 1 << 1 << 0 << true << false;
        QTest::newRow("skipped-rank") << 2 << 3 << 1 << true << false;
        QTest::newRow("face-down") << 2 << 2 << 1 << false << false;
    }

    void foundationPlacement()
    {
        QFETCH(int, suit);
        QFETCH(int, rank);
        QFETCH(int, targetLength);
        QFETCH(bool, faceUp);
        QFETCH(bool, legal);
        Pile foundation;
        for (int value = 1; value <= targetLength; ++value) {
            foundation.push_back(card(Suit::Hearts, static_cast<Rank>(value)));
        }
        const auto source = card(static_cast<Suit>(suit), static_cast<Rank>(rank), faceUp);
        QCOMPARE(canPlaceOnFoundation(source, foundation, Suit::Hearts), legal);
        if (!faceUp) {
            return;
        }
        GameState state;
        state.foundations[2] = foundation;
        state.waste = {source};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        const auto result = game.apply(WasteToFoundation{2});
        QCOMPARE(static_cast<bool>(result), legal);
        if (legal) {
            QVERIFY(game.state().waste.empty());
            QCOMPARE(game.state().foundations[2].back().id(), source.id());
        } else {
            QVERIFY(game.state() == state);
        }
        QVERIFY(validate(game.state()).empty());
    }

    void tableauAceMoveRevealsCoveredCard()
    {
        GameState state;
        state.tableau[0] = {
            card(Suit::Clubs, Rank::Five, false), card(Suit::Hearts, Rank::Ace)};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QVERIFY(game.apply(TableauToFoundation{0, 2}));
        QCOMPARE(game.state().foundations[2].back().rank, Rank::Ace);
        QVERIFY(game.state().tableau[0].back().faceUp);
        QVERIFY(validate(game.state()).empty());
    }

    void foundationReturnMustBeLegal()
    {
        GameState state;
        state.foundations[2] = {card(Suit::Hearts, Rank::Ace)};
        state.tableau[0] = {card(Suit::Clubs, Rank::Two)};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QCOMPARE(game.apply(FoundationToTableau{2, 1}).error, GameError::IllegalPlacement);
        QVERIFY(game.state() == state);
        QVERIFY(game.apply(FoundationToTableau{2, 0}));
        QVERIFY(game.state().foundations[2].empty());
        QCOMPARE(game.state().tableau[0].back().rank, Rank::Ace);
        QVERIFY(validate(game.state()).empty());
    }

    void rejectsMalformedFoundationTargets()
    {
        const auto three = card(Suit::Hearts, Rank::Three);
        for (const Pile &target : {
                 Pile{card(Suit::Hearts, Rank::Two)},
                 Pile{card(Suit::Hearts, Rank::Ace), card(Suit::Hearts, Rank::Two, false)},
                 Pile{card(Suit::Hearts, Rank::Ace), card(Suit::Diamonds, Rank::Two)}}) {
            QVERIFY(!canPlaceOnFoundation(three, target, Suit::Hearts));
        }
        Game game(42);
        const auto before = game.state();
        QCOMPARE(game.apply(WasteToFoundation{4}).error, GameError::InvalidIndex);
        QCOMPARE(game.apply(TableauToFoundation{7, 0}).error, GameError::InvalidIndex);
        QCOMPARE(game.apply(TableauToFoundation{0, 4}).error, GameError::InvalidIndex);
        QCOMPARE(game.apply(FoundationToTableau{4, 0}).error, GameError::InvalidIndex);
        QCOMPARE(game.apply(FoundationToTableau{0, 7}).error, GameError::InvalidIndex);
        QVERIFY(game.state() == before);
        QVERIFY(!game.canUndo());
    }

    void onlyTableauTopCanGoToFoundation()
    {
        GameState state;
        state.tableau[0] = {
            card(Suit::Hearts, Rank::Two), card(Suit::Clubs, Rank::Ace)};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QCOMPARE(game.apply(TableauToFoundation{0, 2}).error, GameError::IllegalPlacement);
        QVERIFY(game.state() == state);
        QVERIFY(game.apply(TableauToFoundation{0, 0}));
        QCOMPARE(game.state().foundations[0].back().suit, Suit::Clubs);
        QVERIFY(validate(game.state()).empty());
    }
};

QTEST_APPLESS_MAIN(FoundationRulesTest)
#include "FoundationRulesTest.moc"
