#pragma once

#include "engine/GameState.h"

#include <QPointF>
#include <QRectF>
#include <QSizeF>

#include <cstddef>
#include <optional>
#include <vector>

namespace cardsy::ui {

enum class PileType { Stock, Waste, Foundation, Tableau };

struct BoardElement {
    PileType pile;
    std::size_t pileIndex;
    std::optional<std::size_t> cardIndex;
    QRectF rectangle;
};

struct BoardLayout {
    QSizeF size;
    QSizeF cardSize;
    std::vector<BoardElement> elements;

    std::optional<BoardElement> hitTest(QPointF point) const;
};

constexpr int MinimumBoardWidth = 720;
constexpr int MinimumBoardHeight = 480;

int cardLabelPixelSize(qreal cardWidth);
qreal minimumBoardHeight(const GameState &state, qreal width);
BoardLayout calculateBoardLayout(const GameState &state, QSizeF available);

}
