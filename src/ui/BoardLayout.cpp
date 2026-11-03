#include "BoardLayout.h"

#include <algorithm>

namespace cardsy::ui {
namespace {

struct Metrics {
    qreal width;
    qreal cardWidth;
    qreal cardHeight;
    qreal gap;
    qreal left;
    qreal tableauTop;
    qreal downMinimum;
    qreal upMinimum;
};

Metrics metrics(qreal availableWidth)
{
    const auto width = std::max(availableWidth, qreal{MinimumBoardWidth});
    const auto cardWidth = std::min(qreal{140}, (width - 32) / 7.9);
    const auto cardHeight = cardWidth * 1.4;
    const auto gap = cardWidth * 0.15;
    return {width, cardWidth, cardHeight, gap,
            (width - 7 * cardWidth - 6 * gap) / 2,
            32 + cardHeight + 44, 8, static_cast<qreal>(cardLabelPixelSize(cardWidth) + 6)};
}

qreal fanHeight(const Pile &pile, qreal down, qreal up)
{
    qreal height = 0;
    for (std::size_t index = 0; index + 1 < pile.size(); ++index) {
        height += pile[index].faceUp ? up : down;
    }
    return height;
}

}

int cardLabelPixelSize(qreal cardWidth)
{
    return std::clamp(static_cast<int>(cardWidth * 0.19), 15, 24);
}

qreal minimumBoardHeight(const GameState &state, qreal width)
{
    const auto geometry = metrics(width);
    qreal minimumFan = 0;
    for (const auto &pile : state.tableau) {
        minimumFan = std::max(minimumFan,
                              fanHeight(pile, geometry.downMinimum, geometry.upMinimum));
    }
    return std::max(qreal{MinimumBoardHeight},
                    geometry.tableauTop + minimumFan + geometry.cardHeight + 20);
}

BoardLayout calculateBoardLayout(const GameState &state, QSizeF available)
{
    const auto geometry = metrics(available.width());
    BoardLayout layout;
    layout.size = {geometry.width,
                   std::max(available.height(), minimumBoardHeight(state, geometry.width))};
    layout.cardSize = {geometry.cardWidth, geometry.cardHeight};
    const auto rectangle = [&geometry](std::size_t column, qreal top) {
        return QRectF(geometry.left + static_cast<qreal>(column)
                          * (geometry.cardWidth + geometry.gap),
                      top, geometry.cardWidth, geometry.cardHeight);
    };
    const auto topIndex = [](const Pile &pile) -> std::optional<std::size_t> {
        return pile.empty() ? std::nullopt : std::optional<std::size_t>{pile.size() - 1};
    };
    layout.elements.push_back({PileType::Stock, 0, topIndex(state.stock), rectangle(0, 32)});
    layout.elements.push_back({PileType::Waste, 0, topIndex(state.waste), rectangle(1, 32)});
    for (std::size_t index = 0; index < state.foundations.size(); ++index) {
        layout.elements.push_back({PileType::Foundation, index,
                                   topIndex(state.foundations[index]), rectangle(index + 3, 32)});
    }
    const auto availableFan = layout.size.height() - 20 - geometry.cardHeight - geometry.tableauTop;
    for (std::size_t column = 0; column < state.tableau.size(); ++column) {
        const auto &pile = state.tableau[column];
        if (pile.empty()) {
            layout.elements.push_back({PileType::Tableau, column, std::nullopt,
                                       rectangle(column, geometry.tableauTop)});
            continue;
        }
        const auto minimum = fanHeight(pile, geometry.downMinimum, geometry.upMinimum);
        const auto downPreferred = geometry.cardWidth * 0.18;
        const auto upPreferred = geometry.cardWidth * 0.35;
        const auto preferred = fanHeight(pile, downPreferred, upPreferred);
        const auto scale = preferred > minimum
            ? std::clamp((availableFan - minimum) / (preferred - minimum), qreal{0}, qreal{1})
            : qreal{1};
        const auto down = geometry.downMinimum + scale * (downPreferred - geometry.downMinimum);
        const auto up = geometry.upMinimum + scale * (upPreferred - geometry.upMinimum);
        auto top = geometry.tableauTop;
        for (std::size_t index = 0; index < pile.size(); ++index) {
            layout.elements.push_back({PileType::Tableau, column, index, rectangle(column, top)});
            top += pile[index].faceUp ? up : down;
        }
    }
    return layout;
}

std::optional<BoardElement> BoardLayout::hitTest(QPointF point) const
{
    for (auto element = elements.rbegin(); element != elements.rend(); ++element) {
        if (element->rectangle.contains(point)) {
            return *element;
        }
    }
    return std::nullopt;
}

}
