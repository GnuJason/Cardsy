#include "Rules.h"

namespace cardsy {

bool isValidTableauRun(const Pile &pile, std::size_t firstCard)
{
    if (firstCard >= pile.size()) {
        return false;
    }
    for (std::size_t index = firstCard; index < pile.size(); ++index) {
        const auto &card = pile[index];
        if (!isValid(card.suit) || !isValid(card.rank) || !card.faceUp) {
            return false;
        }
        if (index > firstCard) {
            const auto &previous = pile[index - 1];
            if (color(previous.suit) == color(card.suit)
                || static_cast<unsigned>(previous.rank) != static_cast<unsigned>(card.rank) + 1) {
                return false;
            }
        }
    }
    return true;
}

bool isValidTableau(const Pile &pile)
{
    if (pile.empty()) {
        return true;
    }
    for (std::size_t index = 0; index < pile.size(); ++index) {
        const auto &card = pile[index];
        if (!isValid(card.suit) || !isValid(card.rank)) {
            return false;
        }
        if (card.faceUp) {
            return isValidTableauRun(pile, index);
        }
    }
    return false;
}

bool isValidFoundation(const Pile &pile, Suit suit)
{
    if (!isValid(suit) || pile.size() > 13) {
        return false;
    }
    for (std::size_t index = 0; index < pile.size(); ++index) {
        const auto &card = pile[index];
        if (!card.faceUp || card.suit != suit
            || static_cast<unsigned>(card.rank) != index + 1) {
            return false;
        }
    }
    return true;
}

bool canPlaceOnTableau(const Card &card, const Pile &pile)
{
    if (!isValid(card.suit) || !isValid(card.rank) || !card.faceUp
        || !isValidTableau(pile)) {
        return false;
    }
    if (pile.empty()) {
        return card.rank == Rank::King;
    }
    return color(card.suit) != color(pile.back().suit)
        && static_cast<unsigned>(card.rank) + 1 == static_cast<unsigned>(pile.back().rank);
}

bool canPlaceOnFoundation(const Card &card, const Pile &pile, Suit suit)
{
    return isValid(card.suit) && isValid(card.rank) && card.faceUp
        && card.suit == suit && isValidFoundation(pile, suit)
        && static_cast<unsigned>(card.rank) == pile.size() + 1;
}

}
