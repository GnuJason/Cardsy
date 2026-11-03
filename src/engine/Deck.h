#pragma once

#include "GameState.h"

#include <array>
#include <cstdint>
#include <optional>

namespace cardsy {

using Deck = std::array<Card, 52>;

struct DealResult {
    std::optional<GameState> state;
    GameError error = GameError::None;

    explicit operator bool() const { return state.has_value(); }
};

Deck createDeck();
Deck shuffle(const Deck &deck, std::uint32_t seed);
DealResult dealKlondike(const Deck &deck, GameConfig config = {},
                       std::optional<std::uint32_t> shuffleSeed = std::nullopt);

}
