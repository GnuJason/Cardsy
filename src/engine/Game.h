#pragma once

#include "GameState.h"

#include <cstddef>
#include <cstdint>
#include <variant>
#include <vector>

namespace cardsy {

struct DrawStock {};
struct RecycleWaste {};
struct TableauToTableau {
    std::size_t source;
    std::size_t firstCard;
    std::size_t target;
};
struct TableauToFoundation {
    std::size_t source;
    std::size_t target;
};
struct WasteToTableau {
    std::size_t target;
};
struct WasteToFoundation {
    std::size_t target;
};
struct FoundationToTableau {
    std::size_t source;
    std::size_t target;
};

using Move = std::variant<DrawStock, RecycleWaste, TableauToTableau,
                          TableauToFoundation, WasteToTableau,
                          WasteToFoundation, FoundationToTableau>;

class Game
{
public:
    Game();
    explicit Game(std::uint32_t seed);

    const GameState &state() const { return state_; }
    bool canUndo() const { return !history_.empty(); }

    [[nodiscard]] MoveResult apply(const Move &move);
    [[nodiscard]] MoveResult undo();
    [[nodiscard]] MoveResult newGame(GameConfig config, std::uint32_t seed);
    [[nodiscard]] MoveResult newGame(GameConfig config = {});
    [[nodiscard]] MoveResult loadState(const GameState &state);

private:
    GameState state_;
    std::vector<GameState> history_;
};

}
