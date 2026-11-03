#pragma once

#include "engine/Deck.h"
#include "engine/Game.h"

#include <algorithm>
#include <array>
#include <stdexcept>

namespace cardsy::test {

inline Card card(Suit suit, Rank rank, bool faceUp = true)
{
    return {suit, rank, faceUp};
}

inline void fillRemainingStock(GameState &state)
{
    std::array<bool, 52> used{};
    const auto record = [&used](const Pile &pile) {
        for (const auto &item : pile) {
            if (!isValid(item.suit) || !isValid(item.rank)) {
                throw std::logic_error("Invalid fixture card");
            }
            const auto index = static_cast<std::size_t>(item.id());
            if (used[index]) {
                throw std::logic_error("Duplicate fixture card");
            }
            used[index] = true;
        }
    };
    record(state.stock);
    record(state.waste);
    for (const auto &pile : state.tableau) {
        record(pile);
    }
    for (const auto &pile : state.foundations) {
        record(pile);
    }
    for (auto item : createDeck()) {
        if (!used[static_cast<std::size_t>(item.id())]) {
            item.faceUp = false;
            state.stock.push_back(item);
        }
    }
    state.shuffleSeed = 123456789;
}

inline bool hasIssue(const GameState &state, Invariant invariant)
{
    const auto issues = validate(state);
    return std::any_of(issues.begin(), issues.end(), [invariant](const auto &issue) {
        return issue.invariant == invariant;
    });
}

inline GameState nearlyWon()
{
    GameState state;
    for (std::size_t suit = 0; suit < state.foundations.size(); ++suit) {
        for (unsigned rank = 1; rank <= 12; ++rank) {
            state.foundations[suit].push_back(
                card(static_cast<Suit>(suit), static_cast<Rank>(rank)));
        }
        state.tableau[suit].push_back(card(static_cast<Suit>(suit), Rank::King));
    }
    state.shuffleSeed = 987654321;
    return state;
}

}
