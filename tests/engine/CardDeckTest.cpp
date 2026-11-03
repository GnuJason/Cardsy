#include "TestSupport.h"
#include "engine/Rules.h"

#include <QTest>

#include <array>

using namespace cardsy;

class CardDeckTest : public QObject
{
    Q_OBJECT

private slots:
    void deckContainsEveryCardExactlyOnce()
    {
        const auto deck = createDeck();
        QCOMPARE(deck.size(), std::size_t{52});
        std::array<unsigned, 52> counts{};
        std::array<unsigned, 4> suits{};
        for (const auto &card : deck) {
            QVERIFY(isValid(card.suit));
            QVERIFY(isValid(card.rank));
            QVERIFY(!card.faceUp);
            ++counts[static_cast<std::size_t>(card.id())];
            ++suits[static_cast<std::size_t>(card.suit)];
        }
        for (auto count : counts) {
            QCOMPARE(count, 1U);
        }
        for (auto count : suits) {
            QCOMPARE(count, 13U);
        }
    }

    void colorsAndIdentity()
    {
        QCOMPARE(color(Suit::Hearts), Color::Red);
        QCOMPARE(color(Suit::Diamonds), Color::Red);
        QCOMPARE(color(Suit::Clubs), Color::Black);
        QCOMPARE(color(Suit::Spades), Color::Black);
        for (auto card : createDeck()) {
            const auto id = card.id();
            card.faceUp = !card.faceUp;
            QCOMPARE(card.id(), id);
        }
        QVERIFY(!isValid(static_cast<Suit>(4)));
        QVERIFY(!isValid(static_cast<Rank>(0)));
        QVERIFY(!isValid(static_cast<Rank>(14)));
    }

    void deterministicShufflePreservesInputAndCards()
    {
        const auto deck = createDeck();
        const auto saved = deck;
        const auto first = shuffle(deck, 123456789);
        QVERIFY(deck == saved);
        QVERIFY(first == shuffle(deck, 123456789));
        QVERIFY(first != shuffle(deck, 987654321));
        std::array<bool, 52> seen{};
        for (const auto &card : first) {
            const auto id = static_cast<std::size_t>(card.id());
            QVERIFY(!seen[id]);
            seen[id] = true;
            QVERIFY(!card.faceUp);
        }
    }

    void shuffleSupportsBoundarySeeds()
    {
        for (auto seed : {0U, 1U, UINT32_MAX}) {
            QVERIFY(shuffle(createDeck(), seed) == shuffle(createDeck(), seed));
        }
    }

    void shuffleMatchesNativeRegressionVector()
    {
        const std::array<unsigned, 52> expected{
            27, 24, 37, 16, 14, 4, 3, 9, 47, 36, 50, 1, 41,
            34, 44, 21, 6, 43, 45, 23, 20, 48, 29, 19, 33, 39,
            30, 8, 5, 17, 11, 18, 46, 28, 40, 38, 25, 2, 31,
            13, 35, 15, 7, 22, 26, 51, 32, 42, 10, 0, 49, 12
        };
        const auto deck = shuffle(createDeck(), 123456789);
        for (std::size_t index = 0; index < deck.size(); ++index) {
            QCOMPARE(static_cast<unsigned>(deck[index].id()), expected[index]);
        }
    }
};

QTEST_APPLESS_MAIN(CardDeckTest)
#include "CardDeckTest.moc"
