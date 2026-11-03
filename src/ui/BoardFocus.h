#pragma once

#include "BoardLayout.h"

#include <tuple>

namespace cardsy::ui {

struct BoardFocus {
    PileType pile = PileType::Stock;
    std::size_t pileIndex = 0;
    std::optional<CardId> cardId;
};

inline bool operator==(const BoardFocus &left, const BoardFocus &right)
{
    return std::tie(left.pile, left.pileIndex, left.cardId)
        == std::tie(right.pile, right.pileIndex, right.cardId);
}

BoardFocus reconcileBoardFocus(const GameState &state, BoardFocus focus);
BoardFocus navigateBoardFocus(const GameState &state, BoardFocus focus, Qt::Key key);
std::optional<BoardElement> resolveBoardFocus(const GameState &state, const BoardLayout &layout,
                                            BoardFocus focus);

}
