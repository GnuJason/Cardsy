#include "TestSupport.h"

#include <QTest>

using namespace cardsy;
using namespace cardsy::test;

class UndoTest : public QObject
{
    Q_OBJECT

private slots:
    void restoresEveryMoveKind_data()
    {
        QTest::addColumn<int>("kind");
        QTest::newRow("draw-one") << 0;
        QTest::newRow("draw-three") << 1;
        QTest::newRow("tableau-run-and-reveal") << 2;
        QTest::newRow("tableau-to-foundation-and-reveal") << 3;
        QTest::newRow("waste-to-tableau") << 4;
        QTest::newRow("waste-to-foundation") << 5;
        QTest::newRow("foundation-to-tableau") << 6;
        QTest::newRow("recycle-waste") << 7;
    }

    void restoresEveryMoveKind()
    {
        QFETCH(int, kind);
        GameState state;
        Move move = DrawStock{};
        switch (kind) {
        case 0:
        case 1:
            state.config = {kind == 0 ? DrawCount::One : DrawCount::Three, false};
            break;
        case 2:
            state.tableau[0] = {
                card(Suit::Clubs, Rank::Ace, false),
                card(Suit::Hearts, Rank::Six), card(Suit::Spades, Rank::Five)};
            state.tableau[1] = {card(Suit::Clubs, Rank::Seven)};
            move = TableauToTableau{0, 1, 1};
            break;
        case 3:
            state.tableau[0] = {
                card(Suit::Clubs, Rank::Five, false), card(Suit::Hearts, Rank::Ace)};
            move = TableauToFoundation{0, 2};
            break;
        case 4:
            state.waste = {card(Suit::Hearts, Rank::Six)};
            state.tableau[0] = {card(Suit::Clubs, Rank::Seven)};
            move = WasteToTableau{0};
            break;
        case 5:
            state.waste = {card(Suit::Hearts, Rank::Ace)};
            move = WasteToFoundation{2};
            break;
        case 6:
            state.foundations[2] = {card(Suit::Hearts, Rank::Ace)};
            state.tableau[0] = {card(Suit::Clubs, Rank::Two)};
            move = FoundationToTableau{2, 0};
            break;
        case 7:
            move = RecycleWaste{};
            break;
        }
        fillRemainingStock(state);
        if (kind == 7) {
            while (!state.stock.empty()) {
                auto item = state.stock.back();
                state.stock.pop_back();
                item.faceUp = true;
                state.waste.push_back(item);
            }
        }
        QVERIFY(validate(state).empty());
        Game game(42);
        QVERIFY(game.loadState(state));
        QVERIFY(game.apply(move));
        QVERIFY(game.canUndo());
        QVERIFY(validate(game.state()).empty());
        QVERIFY(!(game.state() == state));
        QVERIFY(game.undo());
        QVERIFY(game.state() == state);
        QVERIFY(validate(game.state()).empty());
        QVERIFY(!game.canUndo());
    }

    void failedMoveDoesNotConsumeOrAddHistory()
    {
        Game game(42);
        const auto initial = game.state();
        QCOMPARE(game.undo().error, GameError::NothingToUndo);
        QVERIFY(game.state() == initial);
        QVERIFY(game.apply(DrawStock{}));
        const auto drawn = game.state();
        QCOMPARE(game.apply(TableauToTableau{7, 0, 0}).error, GameError::InvalidIndex);
        QVERIFY(game.state() == drawn);
        QVERIFY(game.undo());
        QVERIFY(game.state() == initial);
        QCOMPARE(game.undo().error, GameError::NothingToUndo);
    }

    void newGameAndValidLoadClearHistory()
    {
        Game game(42);
        const auto initial = game.state();
        QVERIFY(game.apply(DrawStock{}));
        QVERIFY(game.loadState(initial));
        QVERIFY(!game.canUndo());
        QVERIFY(game.apply(DrawStock{}));
        QVERIFY(game.newGame({DrawCount::Three, false}, 999));
        QVERIFY(!game.canUndo());
        QCOMPARE(game.undo().error, GameError::NothingToUndo);
        QVERIFY(game.state().shuffleSeed == 999U);
        QVERIFY(game.state().config == (GameConfig{DrawCount::Three, false}));
    }

    void invalidLoadPreservesStateAndHistory()
    {
        Game game(42);
        const auto initial = game.state();
        QVERIFY(game.apply(DrawStock{}));
        const auto drawn = game.state();
        auto broken = drawn;
        broken.stock.clear();
        QCOMPARE(game.loadState(broken).error, GameError::InvalidState);
        QVERIFY(game.state() == drawn);
        QVERIFY(game.undo());
        QVERIFY(game.state() == initial);
    }

    void retainsMoreThanHistoricalHundredSnapshots()
    {
        Game game(42);
        const auto initial = game.state();
        std::size_t moves = 0;
        for (int pass = 0; pass < 6; ++pass) {
            while (!game.state().stock.empty()) {
                QVERIFY(game.apply(DrawStock{}));
                ++moves;
            }
            QVERIFY(game.apply(RecycleWaste{}));
            ++moves;
        }
        QVERIFY(moves > 100);
        while (moves-- > 0) {
            QVERIFY(game.undo());
            QVERIFY(validate(game.state()).empty());
        }
        QVERIFY(game.state() == initial);
        QVERIFY(!game.canUndo());
    }
};

QTEST_APPLESS_MAIN(UndoTest)
#include "UndoTest.moc"
