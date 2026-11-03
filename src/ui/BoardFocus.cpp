#include "BoardFocus.h"

#include <algorithm>
#include <array>

namespace cardsy::ui {
namespace {

BoardFocus tableauEntry(const GameState &state, std::size_t index)
{
    BoardFocus focus{PileType::Tableau, index, std::nullopt};
    const auto &pile = state.tableau[index];
    const auto first = std::find_if(pile.begin(), pile.end(), [](const Card &card) { return card.faceUp; });
    if (first != pile.end()) {
        focus.cardId = first->id();
    }
    return focus;
}

BoardFocus topEntry(std::size_t index)
{
    return index == 0 ? BoardFocus{PileType::Stock, 0, std::nullopt}
        : index == 1 ? BoardFocus{PileType::Waste, 0, std::nullopt}
                     : BoardFocus{PileType::Foundation, index - 2, std::nullopt};
}

}

BoardFocus reconcileBoardFocus(const GameState &state, BoardFocus focus)
{
    if (focus.pile == PileType::Tableau && focus.cardId) {
        for (std::size_t index = 0; index < state.tableau.size(); ++index) {
            for (const auto &card : state.tableau[index]) {
                if (card.faceUp && card.id() == focus.cardId) {
                    return {PileType::Tableau, index, card.id()};
                }
            }
        }
        for (std::size_t index = 0; index < state.foundations.size(); ++index) {
            if (!state.foundations[index].empty()
                && state.foundations[index].back().id() == focus.cardId) {
                return {PileType::Foundation, index, std::nullopt};
            }
        }
        if (!state.waste.empty() && state.waste.back().id() == focus.cardId) {
            return {PileType::Waste, 0, std::nullopt};
        }
    }
    switch (focus.pile) {
    case PileType::Stock: return topEntry(0);
    case PileType::Waste: return topEntry(1);
    case PileType::Foundation:
        return focus.pileIndex < state.foundations.size() ? topEntry(focus.pileIndex + 2) : BoardFocus{};
    case PileType::Tableau:
        return focus.pileIndex < state.tableau.size() ? tableauEntry(state, focus.pileIndex) : BoardFocus{};
    }
    return {};
}

BoardFocus navigateBoardFocus(const GameState &state, BoardFocus focus, Qt::Key key)
{
    focus = reconcileBoardFocus(state, focus);
    if (focus.pile != PileType::Tableau) {
        const auto top = focus.pile == PileType::Stock ? std::size_t{0}
            : focus.pile == PileType::Waste ? std::size_t{1} : focus.pileIndex + 2;
        if (key == Qt::Key_Left && top > 0) {
            return topEntry(top - 1);
        }
        if (key == Qt::Key_Right && top < 5) {
            return topEntry(top + 1);
        }
        if (key == Qt::Key_Down) {
            constexpr std::array<std::size_t, 6> columns{0, 1, 3, 4, 5, 6};
            return tableauEntry(state, columns[top]);
        }
        return focus;
    }
    if (key == Qt::Key_Left && focus.pileIndex > 0) {
        return tableauEntry(state, focus.pileIndex - 1);
    }
    if (key == Qt::Key_Right && focus.pileIndex + 1 < state.tableau.size()) {
        return tableauEntry(state, focus.pileIndex + 1);
    }
    const auto &pile = state.tableau[focus.pileIndex];
    const auto current = std::find_if(pile.begin(), pile.end(), [&focus](const Card &card) {
        return card.faceUp && card.id() == focus.cardId;
    });
    if (key == Qt::Key_Up) {
        if (current != pile.end() && current != pile.begin() && (current - 1)->faceUp) {
            return {PileType::Tableau, focus.pileIndex, (current - 1)->id()};
        }
        const auto top = focus.pileIndex <= 1 ? focus.pileIndex
            : focus.pileIndex == 2 ? std::size_t{1} : focus.pileIndex - 1;
        return topEntry(top);
    }
    if (key == Qt::Key_Down && current != pile.end() && current + 1 != pile.end()) {
        return {PileType::Tableau, focus.pileIndex, (current + 1)->id()};
    }
    return focus;
}

std::optional<BoardElement> resolveBoardFocus(const GameState &state, const BoardLayout &layout,
                                            BoardFocus focus)
{
    focus = reconcileBoardFocus(state, focus);
    for (const auto &element : layout.elements) {
        if (element.pile != focus.pile || element.pileIndex != focus.pileIndex) {
            continue;
        }
        if (focus.pile != PileType::Tableau || !element.cardIndex) {
            return element;
        }
        if (state.tableau[focus.pileIndex][*element.cardIndex].id() == focus.cardId) {
            return element;
        }
    }
    return std::nullopt;
}

}
