#pragma once

#include "GameState.h"

#include <cstddef>

namespace cardsy {

bool isValidTableauRun(const Pile &pile, std::size_t firstCard = 0);
bool isValidTableau(const Pile &pile);
bool isValidFoundation(const Pile &pile, Suit suit);
bool canPlaceOnTableau(const Card &card, const Pile &pile);
bool canPlaceOnFoundation(const Card &card, const Pile &pile, Suit suit);

}
