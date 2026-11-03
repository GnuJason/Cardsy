#include "BoardTestSupport.h"
#include "ui/GameBoard.h"

#include <QTest>

#include <set>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class BoardLayoutTest : public QObject
{
    Q_OBJECT

private slots:
    void mapsInitialStateWithoutDuplicatingCards()
    {
        Game game(42);
        const auto before = game.state();
        const auto layout = calculateBoardLayout(before, {1000, 700});
        QCOMPARE(layout.elements.size(), std::size_t{34});
        QCOMPARE(topElement(layout, PileType::Stock).cardIndex, std::optional<std::size_t>{23});
        QVERIFY(!topElement(layout, PileType::Waste).cardIndex);
        for (std::size_t pile = 0; pile < 4; ++pile) {
            QVERIFY(!topElement(layout, PileType::Foundation, pile).cardIndex);
        }
        std::set<std::pair<std::size_t, std::size_t>> tableauCards;
        for (const auto &element : layout.elements) {
            if (element.pile == PileType::Tableau) {
                QVERIFY(element.cardIndex);
                tableauCards.emplace(element.pileIndex, *element.cardIndex);
            }
        }
        QCOMPARE(tableauCards.size(), std::size_t{28});
        QVERIFY(game.state() == before);
    }

    void drawsOnlyAccessibleWasteAndFoundationTops()
    {
        Game game(42);
        QVERIFY(game.newGame({DrawCount::Three, true}, 42));
        QVERIFY(game.apply(DrawStock{}));
        auto state = game.state();
        auto layout = calculateBoardLayout(state, {1000, 700});
        QCOMPARE(topElement(layout, PileType::Waste).cardIndex, std::optional<std::size_t>{2});
        QCOMPARE(std::count_if(layout.elements.begin(), layout.elements.end(),
                               [](const auto &element) { return element.pile == PileType::Waste; }), 1);
        state = cardsy::test::nearlyWon();
        layout = calculateBoardLayout(state, {1000, 700});
        for (std::size_t pile = 0; pile < 4; ++pile) {
            QCOMPARE(topElement(layout, PileType::Foundation, pile).cardIndex,
                     std::optional<std::size_t>{11});
        }
    }

    void topmostCardWinsOverlapHitTesting()
    {
        const auto state = tableauFixture();
        const auto layout = calculateBoardLayout(state, {1000, 700});
        for (std::size_t index = 0; index < 3; ++index) {
            const auto card = cardElement(layout, PileType::Tableau, 0, index);
            const auto hit = layout.hitTest(exposedPoint(layout, card));
            QVERIFY(hit);
            QCOMPARE(hit->pile, PileType::Tableau);
            QCOMPARE(hit->pileIndex, std::size_t{0});
            QCOMPARE(hit->cardIndex, std::optional<std::size_t>{index});
        }
        const auto bottom = cardElement(layout, PileType::Tableau, 0, 0);
        const auto top = cardElement(layout, PileType::Tableau, 0, 2);
        QVERIFY(bottom.rectangle.intersects(top.rectangle));
        const auto overlap = bottom.rectangle.intersected(top.rectangle).center();
        QCOMPARE(layout.hitTest(overlap)->cardIndex, std::optional<std::size_t>{2});
        QVERIFY(!layout.hitTest({0, 0}));
    }

    void emptyPilesHaveTargets()
    {
        const auto layout = calculateBoardLayout(cardsy::test::nearlyWon(), {1000, 700});
        for (const auto pile : {PileType::Stock, PileType::Waste, PileType::Tableau}) {
            const auto index = pile == PileType::Tableau ? std::size_t{6} : std::size_t{0};
            const auto element = topElement(layout, pile, index);
            QVERIFY(!element.cardIndex);
            const auto hit = layout.hitTest(element.rectangle.center());
            QVERIFY(hit);
            QCOMPARE(hit->pile, pile);
            QCOMPARE(hit->pileIndex, index);
        }
    }

    void representativeSizes_data()
    {
        QTest::addColumn<QSize>("size");
        QTest::newRow("minimum-board") << QSize(720, 480);
        QTest::newRow("normal") << QSize(1000, 700);
        QTest::newRow("large") << QSize(1440, 1000);
    }

    void representativeSizes()
    {
        QFETCH(QSize, size);
        Game game(42);
        const auto before = game.state();
        const auto layout = calculateBoardLayout(before, size);
        QCOMPARE(layout.size, QSizeF(size));
        const QRectF bounds(QPointF(0, 0), layout.size);
        QVERIFY(layout.cardSize.width() >= 87);
        QVERIFY(cardLabelPixelSize(layout.cardSize.width()) >= 15);
        std::set<std::size_t> columns;
        for (const auto &element : layout.elements) {
            QVERIFY(bounds.contains(element.rectangle));
            const auto hit = layout.hitTest(exposedPoint(layout, element));
            QVERIFY(hit);
            QCOMPARE(hit->pile, element.pile);
            QCOMPARE(hit->pileIndex, element.pileIndex);
            QCOMPARE(hit->cardIndex, element.cardIndex);
            if (element.pile == PileType::Tableau) {
                columns.insert(element.pileIndex);
            }
        }
        QCOMPARE(columns.size(), std::size_t{7});
        QVERIFY(game.state() == before);
    }

    void deepColumnsCompressButKeepReadableHeaders()
    {
        const auto state = deepFixture();
        QVERIFY(validate(state).empty());
        const auto compact = calculateBoardLayout(state, {720, 480});
        const auto tall = calculateBoardLayout(state, {720, 1200});
        QVERIFY(compact.size.height() > 480);
        QCOMPARE(compact.size.height(), minimumBoardHeight(state, 720));
        for (std::size_t index = 0; index + 1 < state.tableau[0].size(); ++index) {
            const auto current = cardElement(compact, PileType::Tableau, 0, index);
            const auto next = cardElement(compact, PileType::Tableau, 0, index + 1);
            const auto minimum = state.tableau[0][index].faceUp
                ? cardLabelPixelSize(compact.cardSize.width()) + 6 : 8;
            QVERIFY(next.rectangle.top() - current.rectangle.top() >= minimum - 0.01);
            QCOMPARE(compact.hitTest(exposedPoint(compact, current))->cardIndex,
                     std::optional<std::size_t>{index});
        }
        const auto compactLast = topElement(compact, PileType::Tableau);
        const auto tallLast = topElement(tall, PileType::Tableau);
        QVERIFY(compactLast.rectangle.bottom() <= compact.size.height());
        QVERIFY(tallLast.rectangle.top() > compactLast.rectangle.top());
    }
};

QTEST_MAIN(BoardLayoutTest)
#include "BoardLayoutTest.moc"
