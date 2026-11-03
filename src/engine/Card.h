#pragma once

#include <cstdint>
#include <tuple>

namespace cardsy {

enum class Suit : std::uint8_t { Clubs, Diamonds, Hearts, Spades };
enum class Rank : std::uint8_t {
    Ace = 1, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King
};
enum class Color { Red, Black };
enum class CardId : std::uint8_t {};

constexpr bool isValid(Suit suit)
{
    return static_cast<unsigned>(suit) <= static_cast<unsigned>(Suit::Spades);
}

constexpr bool isValid(Rank rank)
{
    return rank >= Rank::Ace && rank <= Rank::King;
}

constexpr Color color(Suit suit)
{
    return suit == Suit::Diamonds || suit == Suit::Hearts ? Color::Red : Color::Black;
}

struct Card {
    Suit suit = Suit::Clubs;
    Rank rank = Rank::Ace;
    bool faceUp = false;

    constexpr CardId id() const
    {
        return static_cast<CardId>(static_cast<unsigned>(suit) * 13
                                   + static_cast<unsigned>(rank) - 1);
    }
};

inline bool operator==(const Card &left, const Card &right)
{
    return std::tie(left.suit, left.rank, left.faceUp)
        == std::tie(right.suit, right.rank, right.faceUp);
}

inline bool operator!=(const Card &left, const Card &right)
{
    return !(left == right);
}

}
