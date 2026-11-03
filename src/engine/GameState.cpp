#include "GameState.h"
#include "Rules.h"

#include <algorithm>
#include <array>

namespace cardsy {
namespace {

bool completeFoundations(const GameState &state)
{
    if (!state.stock.empty() || !state.waste.empty()
        || std::any_of(state.tableau.begin(), state.tableau.end(),
                       [](const Pile &pile) { return !pile.empty(); })) {
        return false;
    }
    for (std::size_t index = 0; index < state.foundations.size(); ++index) {
        if (state.foundations[index].size() != 13
            || !isValidFoundation(state.foundations[index], static_cast<Suit>(index))) {
            return false;
        }
    }
    return true;
}

std::vector<ValidationIssue> validateBoard(const GameState &state)
{
    std::vector<ValidationIssue> issues;
    if (!isValid(state.config)) {
        issues.push_back({Invariant::Configuration, "Draw count must be one or three."});
    }
    std::array<unsigned, 52> counts{};
    std::size_t total = 0;
    const auto record = [&issues, &counts, &total](const Pile &pile) {
        total += pile.size();
        for (const auto &card : pile) {
            if (!isValid(card.suit) || !isValid(card.rank)) {
                issues.push_back({Invariant::InvalidCard, "Card has an invalid suit or rank."});
                continue;
            }
            ++counts[static_cast<std::size_t>(card.id())];
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
    if (total != 52) {
        issues.push_back({Invariant::CardCount, "Expected 52 cards; found " + std::to_string(total) + "."});
    }
    for (std::size_t index = 0; index < counts.size(); ++index) {
        if (counts[index] == 0) {
            issues.push_back({Invariant::MissingCard, "Missing card ID " + std::to_string(index) + "."});
        } else if (counts[index] > 1) {
            issues.push_back({Invariant::DuplicateCard, "Duplicate card ID " + std::to_string(index) + "."});
        }
    }
    if (std::any_of(state.stock.begin(), state.stock.end(),
                    [](const Card &card) { return card.faceUp; })) {
        issues.push_back({Invariant::StockVisibility, "Stock contains face-up cards."});
    }
    if (std::any_of(state.waste.begin(), state.waste.end(),
                    [](const Card &card) { return !card.faceUp; })) {
        issues.push_back({Invariant::WasteVisibility, "Waste contains face-down cards."});
    }
    for (std::size_t index = 0; index < state.tableau.size(); ++index) {
        if (!isValidTableau(state.tableau[index])) {
            issues.push_back({Invariant::TableauStructure,
                              "Invalid hidden-prefix/face-up-run structure in tableau "
                                  + std::to_string(index) + "."});
        }
    }
    for (std::size_t index = 0; index < state.foundations.size(); ++index) {
        if (!isValidFoundation(state.foundations[index], static_cast<Suit>(index))) {
            issues.push_back({Invariant::FoundationStructure,
                              "Invalid suit, visibility or rank sequence in foundation "
                                  + std::to_string(index) + "."});
        }
    }
    return issues;
}

}

bool isValid(const GameConfig &config)
{
    return config.drawCount == DrawCount::One || config.drawCount == DrawCount::Three;
}

std::vector<ValidationIssue> validate(const GameState &state)
{
    auto issues = validateBoard(state);
    const bool won = issues.empty() && completeFoundations(state);
    if ((state.status != GameStatus::Playing && state.status != GameStatus::Won)
        || (state.status == GameStatus::Won) != won) {
        issues.push_back({Invariant::Status, "Stored game status does not match the board."});
    }
    return issues;
}

bool isWon(const GameState &state)
{
    return completeFoundations(state) && validateBoard(state).empty();
}

}
