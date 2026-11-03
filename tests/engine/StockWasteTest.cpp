#include "TestSupport.h"

#include <QTest>

using namespace cardsy;
using namespace cardsy::test;

class StockWasteTest : public QObject
{
    Q_OBJECT

private slots:
    void drawsConfiguredCountAndOrder_data()
    {
        QTest::addColumn<int>("count");
        QTest::newRow("draw-one") << 1;
        QTest::newRow("draw-three") << 3;
    }

    void drawsConfiguredCountAndOrder()
    {
        QFETCH(int, count);
        Game game(42);
        QVERIFY(game.newGame({static_cast<DrawCount>(count), true}, 42));
        const auto before = game.state();
        QVERIFY(game.apply(DrawStock{}));
        QCOMPARE(game.state().stock.size(), before.stock.size() - static_cast<std::size_t>(count));
        QCOMPARE(game.state().waste.size(), static_cast<std::size_t>(count));
        for (int index = 0; index < count; ++index) {
            const auto &drawn = game.state().waste[static_cast<std::size_t>(index)];
            QCOMPARE(drawn.id(), before.stock[before.stock.size() - 1
                                             - static_cast<std::size_t>(index)].id());
            QVERIFY(drawn.faceUp);
        }
        QVERIFY(validate(game.state()).empty());
    }

    void finalPartialDraw_data()
    {
        QTest::addColumn<int>("remaining");
        QTest::newRow("one-left") << 1;
        QTest::newRow("two-left") << 2;
    }

    void finalPartialDraw()
    {
        QFETCH(int, remaining);
        Game game(42);
        auto state = game.state();
        state.config.drawCount = DrawCount::Three;
        while (state.stock.size() > static_cast<std::size_t>(remaining)) {
            auto next = state.stock.back();
            state.stock.pop_back();
            next.faceUp = true;
            state.waste.push_back(next);
        }
        QVERIFY(game.loadState(state));
        QVERIFY(game.apply(DrawStock{}));
        QVERIFY(game.state().stock.empty());
        QCOMPARE(game.state().waste.size(), std::size_t{24});
        for (int index = 0; index < remaining; ++index) {
            QCOMPARE(game.state().waste[state.waste.size() + static_cast<std::size_t>(index)].id(),
                     state.stock[state.stock.size() - 1 - static_cast<std::size_t>(index)].id());
        }
        const auto emptyStock = game.state();
        QCOMPARE(game.apply(DrawStock{}).error, GameError::EmptySource);
        QVERIFY(game.state() == emptyStock);
        QVERIFY(validate(game.state()).empty());
    }

    void recyclingRestoresOrderRepeatedly_data()
    {
        QTest::addColumn<int>("count");
        QTest::newRow("draw-one") << 1;
        QTest::newRow("draw-three") << 3;
    }

    void recyclingRestoresOrderRepeatedly()
    {
        QFETCH(int, count);
        Game game(42);
        QVERIFY(game.newGame({static_cast<DrawCount>(count), true}, 42));
        const auto initial = game.state();
        for (int pass = 0; pass < 4; ++pass) {
            while (!game.state().stock.empty()) {
                QVERIFY(game.apply(DrawStock{}));
                QVERIFY(validate(game.state()).empty());
            }
            QVERIFY(game.apply(RecycleWaste{}));
            QVERIFY(game.state() == initial);
            QVERIFY(validate(game.state()).empty());
        }
    }

    void recyclingAfterWasteCardWasPlayedPreservesRemainingOrder()
    {
        GameState state;
        state.waste = {card(Suit::Clubs, Rank::Ace), card(Suit::Hearts, Rank::Ace)};
        fillRemainingStock(state);
        for (auto item : state.stock) {
            item.faceUp = true;
            state.waste.insert(state.waste.begin(), item);
        }
        state.stock.clear();
        Game game(42);
        QVERIFY(game.loadState(state));
        QVERIFY(game.apply(WasteToFoundation{2}));
        const auto remainingWaste = game.state().waste;
        QVERIFY(game.apply(RecycleWaste{}));
        QCOMPARE(game.state().stock.size(), remainingWaste.size());
        for (std::size_t index = 0; index < remainingWaste.size(); ++index) {
            QCOMPARE(game.state().stock[index].id(),
                     remainingWaste[remainingWaste.size() - index - 1].id());
            QVERIFY(!game.state().stock[index].faceUp);
        }
        QVERIFY(game.apply(DrawStock{}));
        QCOMPARE(game.state().waste.back().id(), remainingWaste.front().id());
        QVERIFY(validate(game.state()).empty());
    }

    void recycleAndEmptySourceErrorsAreAtomic()
    {
        Game game(42);
        auto before = game.state();
        QCOMPARE(game.apply(RecycleWaste{}).error, GameError::StockNotEmpty);
        QCOMPARE(game.apply(WasteToTableau{0}).error, GameError::EmptySource);
        QCOMPARE(game.apply(WasteToTableau{7}).error, GameError::InvalidIndex);
        QCOMPARE(game.apply(WasteToFoundation{0}).error, GameError::EmptySource);
        QCOMPARE(game.apply(FoundationToTableau{0, 0}).error, GameError::EmptySource);
        QVERIFY(game.state() == before);
        QVERIFY(!game.canUndo());
        QVERIFY(game.loadState(nearlyWon()));
        before = game.state();
        QCOMPARE(game.apply(DrawStock{}).error, GameError::EmptySource);
        QCOMPARE(game.apply(RecycleWaste{}).error, GameError::EmptySource);
        QCOMPARE(game.apply(TableauToFoundation{6, 0}).error, GameError::EmptySource);
        QVERIFY(game.state() == before);
    }

    void disabledRecyclingDoesNotMutateState()
    {
        Game game(42);
        QVERIFY(game.newGame({DrawCount::Three, false}, 42));
        while (!game.state().stock.empty()) {
            QVERIFY(game.apply(DrawStock{}));
        }
        const auto before = game.state();
        QCOMPARE(game.apply(RecycleWaste{}).error, GameError::RecyclingDisabled);
        QVERIFY(game.state() == before);
        QVERIFY(game.undo());
        QVERIFY(!game.state().stock.empty());
        QVERIFY(!game.state().config.allowRecycle);
    }

    void onlyWasteTopIsMoved()
    {
        GameState state;
        state.waste = {card(Suit::Spades, Rank::Ace), card(Suit::Hearts, Rank::Six)};
        state.tableau[0] = {card(Suit::Clubs, Rank::Seven)};
        fillRemainingStock(state);
        Game game(42);
        QVERIFY(game.loadState(state));
        QCOMPARE(game.apply(WasteToFoundation{3}).error, GameError::IllegalPlacement);
        QVERIFY(game.state() == state);
        QVERIFY(game.apply(WasteToTableau{0}));
        QCOMPARE(game.state().waste.size(), std::size_t{1});
        QCOMPARE(game.state().waste.back().rank, Rank::Ace);
        QCOMPARE(game.state().tableau[0].back().rank, Rank::Six);
        QVERIFY(validate(game.state()).empty());
    }
};

QTEST_APPLESS_MAIN(StockWasteTest)
#include "StockWasteTest.moc"
