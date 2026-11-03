#include "Deck.h"

#include <algorithm>
#include <array>
#include <random>
#include <utility>

namespace cardsy {

Deck createDeck()
{
    Deck deck;
    std::size_t index = 0;
    for (unsigned suit = 0; suit < 4; ++suit) {
        for (unsigned rank = 1; rank <= 13; ++rank) {
            deck[index++] = {static_cast<Suit>(suit), static_cast<Rank>(rank), false};
        }
    }
    return deck;
}

Deck shuffle(const Deck &deck, std::uint32_t seed)
{
    auto shuffled = deck;
    std::mt19937 random(seed);
    for (std::size_t size = shuffled.size(); size > 1; --size) {
        const auto bound = static_cast<std::uint32_t>(size);
        // Rejection sampling avoids modulo bias and library-specific distributions.
        const auto threshold = (std::uint32_t{0} - bound) % bound;
        std::uint32_t sample;
        do {
            sample = static_cast<std::uint32_t>(random());
        } while (sample < threshold);
        std::swap(shuffled[size - 1], shuffled[sample % bound]);
    }
    return shuffled;
}

DealResult dealKlondike(const Deck &deck, GameConfig config,
                       std::optional<std::uint32_t> shuffleSeed)
{
    if (!isValid(config)) {
        return {std::nullopt, GameError::InvalidConfiguration};
    }
    std::array<bool, 52> seen{};
    for (const auto &card : deck) {
        if (!isValid(card.suit) || !isValid(card.rank)) {
            return {std::nullopt, GameError::InvalidDeck};
        }
        const auto id = static_cast<std::size_t>(card.id());
        if (seen[id]) {
            return {std::nullopt, GameError::InvalidDeck};
        }
        seen[id] = true;
    }
    GameState state;
    state.config = config;
    state.shuffleSeed = shuffleSeed;
    std::size_t next = 0;
    for (std::size_t pile = 0; pile < state.tableau.size(); ++pile) {
        for (std::size_t row = 0; row <= pile; ++row) {
            auto card = deck[next++];
            card.faceUp = row == pile;
            state.tableau[pile].push_back(card);
        }
    }
    for (; next < deck.size(); ++next) {
        auto card = deck[next];
        card.faceUp = false;
        state.stock.push_back(card);
    }
    return {std::move(state), GameError::None};
}

}
