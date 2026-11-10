#pragma once

#include "engine/Card.h"

#include <QCoreApplication>
#include <QString>

#include <array>

namespace cardsy::ui {

inline QString cardBackKey(CardId id)
{
    static constexpr std::array<const char *, 13> ranks{
        "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
    };
    static constexpr std::array<char, 4> suits{'C', 'D', 'H', 'S'};
    const auto index = static_cast<unsigned>(id);
    if (index >= 52) {
        return {};
    }
    return QString::fromLatin1(ranks[index % 13]) + QLatin1Char(suits[index / 13]);
}

inline QString cardBackSuitName(Suit suit)
{
    switch (suit) {
    case Suit::Clubs: return QCoreApplication::translate("CardBacks", "Clubs");
    case Suit::Diamonds: return QCoreApplication::translate("CardBacks", "Diamonds");
    case Suit::Hearts: return QCoreApplication::translate("CardBacks", "Hearts");
    case Suit::Spades: return QCoreApplication::translate("CardBacks", "Spades");
    }
    return {};
}

inline QString cardBackLabel(CardId id)
{
    const auto key = cardBackKey(id);
    if (key.isEmpty()) {
        return {};
    }
    return QCoreApplication::translate("CardBacks", "%1 of %2")
        .arg(key.chopped(1), cardBackSuitName(static_cast<Suit>(static_cast<unsigned>(id) / 13)));
}

}
