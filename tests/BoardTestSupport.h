#pragma once

#include "engine/TestSupport.h"
#include "ui/BoardLayout.h"

#include <algorithm>
#include <stdexcept>

namespace cardsy::ui::test {

inline BoardElement topElement(const BoardLayout &layout, PileType pile, std::size_t pileIndex = 0)
{
    const auto found = std::find_if(layout.elements.rbegin(), layout.elements.rend(),
                                    [pile, pileIndex](const BoardElement &element) {
        return element.pile == pile && element.pileIndex == pileIndex;
    });
    if (found == layout.elements.rend()) {
        throw std::logic_error("Missing test layout element");
    }
    return *found;
}

inline BoardElement cardElement(const BoardLayout &layout, PileType pile,
                                std::size_t pileIndex, std::size_t cardIndex)
{
    const auto found = std::find_if(layout.elements.begin(), layout.elements.end(),
                                    [pile, pileIndex, cardIndex](const BoardElement &element) {
        return element.pile == pile && element.pileIndex == pileIndex
            && element.cardIndex == cardIndex;
    });
    if (found == layout.elements.end()) {
        throw std::logic_error("Missing test card rectangle");
    }
    return *found;
}

inline QPoint exposedPoint(const BoardLayout &layout, const BoardElement &element)
{
    auto height = element.rectangle.height();
    for (const auto &next : layout.elements) {
        if (next.pile == element.pile && next.pileIndex == element.pileIndex
            && next.rectangle.top() > element.rectangle.top()) {
            height = std::min(height, next.rectangle.top() - element.rectangle.top());
        }
    }
    return QPointF(element.rectangle.center().x(), element.rectangle.top() + height / 2).toPoint();
}

inline GameState tableauFixture()
{
    GameState state;
    state.tableau[0] = {
        cardsy::test::card(Suit::Diamonds, Rank::Two, false),
        cardsy::test::card(Suit::Hearts, Rank::Six),
        cardsy::test::card(Suit::Spades, Rank::Five),
    };
    state.tableau[1] = {cardsy::test::card(Suit::Clubs, Rank::Seven)};
    state.tableau[2] = {cardsy::test::card(Suit::Diamonds, Rank::Seven)};
    cardsy::test::fillRemainingStock(state);
    return state;
}

inline GameState deepFixture()
{
    GameState state;
    for (unsigned rank = 1; rank <= 6; ++rank) {
        state.tableau[0].push_back(
            cardsy::test::card(Suit::Spades, static_cast<Rank>(rank), false));
    }
    for (unsigned rank = 13; rank > 0; --rank) {
        state.tableau[0].push_back(
            cardsy::test::card(rank % 2 == 0 ? Suit::Clubs : Suit::Hearts,
                               static_cast<Rank>(rank)));
    }
    cardsy::test::fillRemainingStock(state);
    return state;
}

}
