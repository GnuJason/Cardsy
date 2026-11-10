#pragma once

#include "engine/Card.h"

#include <QString>

#include <array>

namespace cardsy::ui {

// Only the one-time legacy importer uses rank/suit filenames.
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

}
