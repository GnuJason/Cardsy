#include "Game.h"
#include "Deck.h"
#include "Rules.h"

#include <algorithm>
#include <iterator>
#include <random>
#include <utility>

namespace cardsy {
namespace {

std::uint32_t freshSeed()
{
    return static_cast<std::uint32_t>(std::random_device{}());
}

void exposeTop(Pile &pile)
{
    if (!pile.empty()) {
        pile.back().faceUp = true;
    }
}

struct ApplyMove {
    GameState &state;

    GameError operator()(DrawStock) const
    {
        if (state.stock.empty()) {
            return GameError::EmptySource;
        }
        const auto count = std::min(state.stock.size(),
                                    static_cast<std::size_t>(state.config.drawCount));
        for (std::size_t index = 0; index < count; ++index) {
            auto card = state.stock.back();
            state.stock.pop_back();
            card.faceUp = true;
            state.waste.push_back(card);
        }
        return GameError::None;
    }

    GameError operator()(RecycleWaste) const
    {
        if (!state.stock.empty()) {
            return GameError::StockNotEmpty;
        }
        if (state.waste.empty()) {
            return GameError::EmptySource;
        }
        if (!state.config.allowRecycle) {
            return GameError::RecyclingDisabled;
        }
        state.stock.assign(state.waste.rbegin(), state.waste.rend());
        for (auto &card : state.stock) {
            card.faceUp = false;
        }
        state.waste.clear();
        return GameError::None;
    }

    GameError operator()(TableauToTableau move) const
    {
        if (move.source >= state.tableau.size() || move.target >= state.tableau.size()
            || move.firstCard >= state.tableau[move.source].size()) {
            return GameError::InvalidIndex;
        }
        if (move.source == move.target) {
            return GameError::IllegalPlacement;
        }
        auto &source = state.tableau[move.source];
        auto &target = state.tableau[move.target];
        if (!source[move.firstCard].faceUp) {
            return GameError::FaceDownCard;
        }
        if (!isValidTableauRun(source, move.firstCard)) {
            return GameError::InvalidSequence;
        }
        if (!canPlaceOnTableau(source[move.firstCard], target)) {
            return GameError::IllegalPlacement;
        }
        const auto first = std::next(source.begin(), static_cast<Pile::difference_type>(move.firstCard));
        target.insert(target.end(), first, source.end());
        source.erase(first, source.end());
        exposeTop(source);
        return GameError::None;
    }

    GameError operator()(TableauToFoundation move) const
    {
        if (move.source >= state.tableau.size() || move.target >= state.foundations.size()) {
            return GameError::InvalidIndex;
        }
        auto &source = state.tableau[move.source];
        auto &target = state.foundations[move.target];
        if (source.empty()) {
            return GameError::EmptySource;
        }
        if (!canPlaceOnFoundation(source.back(), target, static_cast<Suit>(move.target))) {
            return GameError::IllegalPlacement;
        }
        target.push_back(source.back());
        source.pop_back();
        exposeTop(source);
        return GameError::None;
    }

    GameError operator()(WasteToTableau move) const
    {
        if (move.target >= state.tableau.size()) {
            return GameError::InvalidIndex;
        }
        if (state.waste.empty()) {
            return GameError::EmptySource;
        }
        auto &target = state.tableau[move.target];
        if (!canPlaceOnTableau(state.waste.back(), target)) {
            return GameError::IllegalPlacement;
        }
        target.push_back(state.waste.back());
        state.waste.pop_back();
        return GameError::None;
    }

    GameError operator()(WasteToFoundation move) const
    {
        if (move.target >= state.foundations.size()) {
            return GameError::InvalidIndex;
        }
        if (state.waste.empty()) {
            return GameError::EmptySource;
        }
        auto &target = state.foundations[move.target];
        if (!canPlaceOnFoundation(state.waste.back(), target, static_cast<Suit>(move.target))) {
            return GameError::IllegalPlacement;
        }
        target.push_back(state.waste.back());
        state.waste.pop_back();
        return GameError::None;
    }

    GameError operator()(FoundationToTableau move) const
    {
        if (move.source >= state.foundations.size() || move.target >= state.tableau.size()) {
            return GameError::InvalidIndex;
        }
        auto &source = state.foundations[move.source];
        if (source.empty()) {
            return GameError::EmptySource;
        }
        auto &target = state.tableau[move.target];
        if (!canPlaceOnTableau(source.back(), target)) {
            return GameError::IllegalPlacement;
        }
        target.push_back(source.back());
        source.pop_back();
        return GameError::None;
    }
};

}

Game::Game()
    : Game(freshSeed())
{
}

Game::Game(std::uint32_t seed)
    : state_(*dealKlondike(shuffle(createDeck(), seed), {}, seed).state)
{
}

MoveResult Game::apply(const Move &move)
{
    auto next = state_;
    const auto error = std::visit(ApplyMove{next}, move);
    if (error != GameError::None) {
        return {error};
    }
    next.status = isWon(next) ? GameStatus::Won : GameStatus::Playing;
    if (!validate(next).empty()) {
        return {GameError::InvalidState};
    }
    history_.push_back(state_);
    state_ = std::move(next);
    return {};
}

MoveResult Game::undo()
{
    if (history_.empty()) {
        return {GameError::NothingToUndo};
    }
    state_ = std::move(history_.back());
    history_.pop_back();
    return {};
}

MoveResult Game::newGame(GameConfig config, std::uint32_t seed)
{
    auto result = dealKlondike(shuffle(createDeck(), seed), config, seed);
    if (!result) {
        return {result.error};
    }
    state_ = std::move(*result.state);
    history_.clear();
    return {};
}

MoveResult Game::newGame(GameConfig config)
{
    if (!isValid(config)) {
        return {GameError::InvalidConfiguration};
    }
    return newGame(config, freshSeed());
}

MoveResult Game::loadState(const GameState &state)
{
    if (!validate(state).empty()) {
        return {GameError::InvalidState};
    }
    state_ = state;
    history_.clear();
    return {};
}

}
