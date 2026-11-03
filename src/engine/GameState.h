#pragma once

#include "Card.h"

#include <array>
#include <cstddef>
#include <cstdint>
#include <optional>
#include <string>
#include <tuple>
#include <vector>

namespace cardsy {

using Pile = std::vector<Card>;
enum class DrawCount : std::uint8_t { One = 1, Three = 3 };
enum class GameStatus { Playing, Won };

struct GameConfig {
    DrawCount drawCount = DrawCount::One;
    bool allowRecycle = true;
};

inline bool operator==(const GameConfig &left, const GameConfig &right)
{
    return std::tie(left.drawCount, left.allowRecycle)
        == std::tie(right.drawCount, right.allowRecycle);
}

struct GameState {
    Pile stock;
    Pile waste;
    std::array<Pile, 7> tableau;
    // Foundation slots follow Suit order: Clubs, Diamonds, Hearts, Spades.
    std::array<Pile, 4> foundations;
    GameConfig config;
    GameStatus status = GameStatus::Playing;
    std::optional<std::uint32_t> shuffleSeed;
};

inline bool operator==(const GameState &left, const GameState &right)
{
    return std::tie(left.stock, left.waste, left.tableau, left.foundations,
                    left.config, left.status, left.shuffleSeed)
        == std::tie(right.stock, right.waste, right.tableau, right.foundations,
                    right.config, right.status, right.shuffleSeed);
}

enum class GameError {
    None,
    InvalidConfiguration,
    InvalidDeck,
    InvalidState,
    InvalidIndex,
    EmptySource,
    FaceDownCard,
    InvalidSequence,
    IllegalPlacement,
    StockNotEmpty,
    RecyclingDisabled,
    NothingToUndo
};

struct MoveResult {
    GameError error = GameError::None;

    explicit operator bool() const { return error == GameError::None; }
};

enum class Invariant {
    Configuration,
    CardCount,
    InvalidCard,
    DuplicateCard,
    MissingCard,
    StockVisibility,
    WasteVisibility,
    TableauStructure,
    FoundationStructure,
    Status
};

struct ValidationIssue {
    Invariant invariant;
    std::string message;
};

bool isValid(const GameConfig &config);
std::vector<ValidationIssue> validate(const GameState &state);
bool isWon(const GameState &state);

}
