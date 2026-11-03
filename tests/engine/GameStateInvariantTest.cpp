#include "TestSupport.h"

#include <QTest>

#include <random>

using namespace cardsy;
using namespace cardsy::test;

class GameStateInvariantTest : public QObject
{
    Q_OBJECT

private slots:
    void detectsCorruption_data()
    {
        QTest::addColumn<int>("defect");
        QTest::newRow("missing-card") << 0;
        QTest::newRow("duplicate-card") << 1;
        QTest::newRow("invalid-rank") << 2;
        QTest::newRow("invalid-suit") << 3;
        QTest::newRow("stock-face-up") << 4;
        QTest::newRow("waste-face-down") << 5;
        QTest::newRow("tableau-covered-top") << 6;
        QTest::newRow("tableau-face-down-after-face-up") << 7;
        QTest::newRow("tableau-malformed-run") << 8;
        QTest::newRow("foundation-face-down") << 9;
        QTest::newRow("foundation-wrong-slot") << 10;
        QTest::newRow("foundation-skipped-rank") << 11;
        QTest::newRow("invalid-config") << 12;
        QTest::newRow("false-win-status") << 13;
        QTest::newRow("invalid-status-enum") << 14;
    }

    void detectsCorruption()
    {
        QFETCH(int, defect);
        Game game(42);
        auto broken = game.state();
        auto expected = Invariant::CardCount;
        switch (defect) {
        case 0:
            broken.stock.pop_back();
            break;
        case 1:
            broken.stock[0] = broken.stock[1];
            expected = Invariant::DuplicateCard;
            QVERIFY(hasIssue(broken, Invariant::MissingCard));
            break;
        case 2:
            broken.stock[0].rank = static_cast<Rank>(0);
            expected = Invariant::InvalidCard;
            break;
        case 3:
            broken.stock[0].suit = static_cast<Suit>(255);
            expected = Invariant::InvalidCard;
            break;
        case 4:
            broken.stock[0].faceUp = true;
            expected = Invariant::StockVisibility;
            break;
        case 5:
            broken.waste.push_back(broken.stock.back());
            broken.stock.pop_back();
            expected = Invariant::WasteVisibility;
            break;
        case 6:
            broken.tableau[0].back().faceUp = false;
            expected = Invariant::TableauStructure;
            break;
        case 7:
            broken.tableau[2][0].faceUp = true;
            expected = Invariant::TableauStructure;
            break;
        case 8:
            broken = {};
            broken.tableau[0] = {
                card(Suit::Hearts, Rank::Seven), card(Suit::Diamonds, Rank::Six)};
            fillRemainingStock(broken);
            expected = Invariant::TableauStructure;
            break;
        case 9:
            broken = nearlyWon();
            broken.foundations[0][0].faceUp = false;
            expected = Invariant::FoundationStructure;
            break;
        case 10:
            broken = nearlyWon();
            std::swap(broken.foundations[0], broken.foundations[1]);
            expected = Invariant::FoundationStructure;
            break;
        case 11:
            broken = nearlyWon();
            std::swap(broken.foundations[0][0], broken.foundations[0][1]);
            expected = Invariant::FoundationStructure;
            break;
        case 12:
            broken.config.drawCount = static_cast<DrawCount>(2);
            expected = Invariant::Configuration;
            break;
        case 13:
            broken.status = GameStatus::Won;
            expected = Invariant::Status;
            break;
        case 14:
            broken.status = static_cast<GameStatus>(255);
            expected = Invariant::Status;
            break;
        }
        const auto beforeValidation = broken;
        QVERIFY(hasIssue(broken, expected));
        for (const auto &issue : validate(broken)) {
            QVERIFY(!issue.message.empty());
        }
        QVERIFY(broken == beforeValidation);
        const auto initial = game.state();
        QCOMPARE(game.loadState(broken).error, GameError::InvalidState);
        QVERIFY(game.state() == initial);
        QVERIFY(!game.canUndo());
        QVERIFY(!isWon(broken));
    }

    void emptyAndOversizedStatesAreNotValid()
    {
        GameState empty;
        QVERIFY(hasIssue(empty, Invariant::CardCount));
        QVERIFY(hasIssue(empty, Invariant::MissingCard));
        Game game(42);
        auto tooMany = game.state();
        tooMany.stock.push_back(tooMany.stock.back());
        QVERIFY(hasIssue(tooMany, Invariant::CardCount));
        QVERIFY(hasIssue(tooMany, Invariant::DuplicateCard));
    }

    void seededTransitionsAndCompleteUndoPreserveInvariants()
    {
        for (std::uint32_t seed = 0; seed < 12; ++seed) {
            Game game(seed);
            QVERIFY(game.newGame({seed % 2 == 0 ? DrawCount::One : DrawCount::Three, true}, seed));
            const auto initial = game.state();
            std::mt19937 random(seed);
            std::vector<GameState> history;
            for (int step = 0; step < 100; ++step) {
                const auto before = game.state();
                std::vector<Move> moves{DrawStock{}, RecycleWaste{}};
                for (std::size_t target = 0; target < 7; ++target) {
                    moves.emplace_back(WasteToTableau{target});
                    for (std::size_t source = 0; source < 4; ++source) {
                        moves.emplace_back(FoundationToTableau{source, target});
                    }
                    for (std::size_t source = 0; source < 7; ++source) {
                        for (std::size_t first = 0; first < before.tableau[source].size(); ++first) {
                            moves.emplace_back(TableauToTableau{source, first, target});
                        }
                    }
                }
                for (std::size_t target = 0; target < 4; ++target) {
                    moves.emplace_back(WasteToFoundation{target});
                    for (std::size_t source = 0; source < 7; ++source) {
                        moves.emplace_back(TableauToFoundation{source, target});
                    }
                }
                const auto start = static_cast<std::size_t>(random()) % moves.size();
                bool moved = false;
                for (std::size_t offset = 0; offset < moves.size(); ++offset) {
                    if (game.apply(moves[(start + offset) % moves.size()])) {
                        history.push_back(before);
                        moved = true;
                        break;
                    }
                    QVERIFY(game.state() == before);
                }
                QVERIFY(validate(game.state()).empty());
                if (!moved) {
                    break;
                }
            }
            QVERIFY(!history.empty());
            while (!history.empty()) {
                QVERIFY(game.undo());
                QVERIFY(game.state() == history.back());
                QVERIFY(validate(game.state()).empty());
                history.pop_back();
            }
            QVERIFY(game.state() == initial);
            QVERIFY(!game.canUndo());
        }
    }
};

QTEST_APPLESS_MAIN(GameStateInvariantTest)
#include "GameStateInvariantTest.moc"
