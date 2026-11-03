#include "GameBoard.h"

#include <QApplication>
#include <QCursor>
#include <QFocusEvent>
#include <QFontMetrics>
#include <QKeyEvent>
#include <QMouseEvent>
#include <QMoveEvent>
#include <QPainter>
#include <QPainterPath>
#include <QResizeEvent>
#include <QtMath>

#include <algorithm>
#include <array>

namespace cardsy::ui {
namespace {

QString rankText(Rank rank)
{
    static const std::array<const char *, 13> labels{
        "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
    };
    return QString::fromLatin1(labels[static_cast<std::size_t>(rank) - 1]);
}

QString suitText(Suit suit, const QFont &font)
{
    static const std::array<char16_t, 4> symbols{u'\u2663', u'\u2666', u'\u2665', u'\u2660'};
    static const std::array<const char *, 4> fallback{"C", "D", "H", "S"};
    const auto index = static_cast<std::size_t>(suit);
    const QChar symbol(symbols[index]);
    return QFontMetrics(font).inFont(symbol) ? QString(symbol)
                                           : QString::fromLatin1(fallback[index]);
}

void drawCard(QPainter &painter, QRectF rectangle, const Card &card, const QImage &back)
{
    painter.setPen(QPen(QColor(35, 40, 35), 1));
    painter.setBrush(card.faceUp ? QColor(255, 253, 245) : QColor(35, 64, 112));
    painter.drawRoundedRect(rectangle, 7, 7);
    if (!card.faceUp) {
        if (!back.isNull()) {
            painter.save();
            QPainterPath clip;
            clip.addRoundedRect(rectangle.adjusted(1, 1, -1, -1), 6, 6);
            painter.setClipPath(clip);
            painter.setRenderHint(QPainter::SmoothPixmapTransform);
            const auto scale = std::max(rectangle.width() / back.width(),
                                        rectangle.height() / back.height());
            const QSizeF sourceSize(rectangle.width() / scale, rectangle.height() / scale);
            painter.drawImage(rectangle, back,
                               QRectF((back.width() - sourceSize.width()) / 2,
                                       (back.height() - sourceSize.height()) / 2,
                                       sourceSize.width(), sourceSize.height()));
            painter.restore();
            return;
        }
        const auto inner = rectangle.adjusted(6, 6, -6, -6);
        painter.setPen(QPen(QColor(190, 210, 235), 1));
        painter.setBrush(Qt::NoBrush);
        painter.drawRoundedRect(inner, 4, 4);
        painter.save();
        painter.setClipRect(inner.adjusted(3, 3, -3, -3));
        for (qreal offset = -inner.height(); offset < inner.width(); offset += 14) {
            painter.drawLine(QPointF(inner.left() + offset, inner.bottom()),
                              QPointF(inner.left() + offset + inner.height(), inner.top()));
        }
        painter.restore();
        return;
    }
    auto labelFont = painter.font();
    labelFont.setPixelSize(cardLabelPixelSize(rectangle.width()));
    labelFont.setBold(true);
    painter.setFont(labelFont);
    painter.setPen(color(card.suit) == Color::Red ? QColor(170, 25, 40) : QColor(25, 30, 35));
    const auto label = rankText(card.rank) + QStringLiteral(" ") + suitText(card.suit, labelFont);
    const auto labelHeight = labelFont.pixelSize() + 4;
    painter.drawText(rectangle.adjusted(7, 3, -4, 0), Qt::AlignLeft | Qt::AlignTop, label);
    painter.save();
    painter.translate(rectangle.right(), rectangle.bottom());
    painter.rotate(180);
    painter.drawText(QRectF(7, 3, rectangle.width() - 11, labelHeight),
                      Qt::AlignLeft | Qt::AlignTop, label);
    painter.restore();
    auto centerFont = labelFont;
    centerFont.setPixelSize(labelFont.pixelSize() * 2);
    painter.setFont(centerFont);
    painter.drawText(rectangle, Qt::AlignCenter, suitText(card.suit, centerFont));
}

QString errorText(GameError error)
{
    switch (error) {
    case GameError::None:
        return {};
    case GameError::EmptySource:
        return GameBoard::tr("There are no cards to move.");
    case GameError::RecyclingDisabled:
        return GameBoard::tr("Waste recycling is disabled for this game.");
    case GameError::NothingToUndo:
        return GameBoard::tr("There is nothing to undo.");
    case GameError::StockNotEmpty:
        return GameBoard::tr("Draw the remaining stock before recycling.");
    case GameError::FaceDownCard:
        return GameBoard::tr("Face-down cards cannot be selected.");
    case GameError::InvalidSequence:
    case GameError::IllegalPlacement:
        return GameBoard::tr("That move is not allowed. Choose another destination or press Escape.");
    case GameError::InvalidIndex:
        return GameBoard::tr("That card or pile is unavailable.");
    case GameError::InvalidConfiguration:
    case GameError::InvalidDeck:
    case GameError::InvalidState:
        return GameBoard::tr("The engine rejected invalid game data.");
    }
    return GameBoard::tr("The move was rejected.");
}

}

GameBoard::GameBoard(QWidget *parent)
    : QWidget(parent)
{
    initialize();
}

GameBoard::GameBoard(std::uint32_t seed, QWidget *parent)
    : QWidget(parent), game_(seed)
{
    initialize();
}

void GameBoard::initialize()
{
    setObjectName(QStringLiteral("gameBoard"));
    setAccessibleName(tr("Klondike board"));
    setAccessibleDescription(tr("Click a face-up card, then its destination. "
                                "Or drag a face-up card or sequence to its destination. "
                                "Click stock to draw. Escape cancels selection or dragging."));
    setFocusPolicy(Qt::StrongFocus);
    setMouseTracking(true);
    setMinimumWidth(MinimumBoardWidth);
    setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Expanding);
    updateMinimumHeight();
    feedback_ = tr("Select a face-up card, then choose a destination.");
}

BoardLayout GameBoard::boardLayout() const
{
    return calculateBoardLayout(game_.state(), size());
}

void GameBoard::setCardBackImage(const QImage &image)
{
    cardBackImage_ = image;
    update();
}

void GameBoard::updateMinimumHeight()
{
    const auto required = qCeil(minimumBoardHeight(game_.state(), width()));
    if (minimumHeight() != required) {
        setMinimumHeight(required);
    }
}

void GameBoard::setFeedback(const QString &message)
{
    feedback_ = message;
    emit feedbackChanged(feedback_);
}

void GameBoard::finish(MoveResult result)
{
    if (!result) {
        setFeedback(errorText(result.error));
        return;
    }
    cancelDrag();
    selection_.reset();
    updateMinimumHeight();
    setFeedback(game_.state().status == GameStatus::Won
                    ? tr("You won! Start a new game, or undo to keep playing.")
                    : tr("Select a face-up card, then choose a destination."));
    update();
    emit stateChanged();
}

MoveResult GameBoard::loadState(const GameState &state)
{
    cancelDrag();
    const auto result = game_.loadState(state);
    finish(result);
    return result;
}

void GameBoard::undo()
{
    cancelDrag();
    if (game_.canUndo()) {
        finish(game_.undo());
    }
}

void GameBoard::newGame()
{
    cancelDrag();
    finish(game_.newGame(game_.state().config));
}

void GameBoard::clearSelection()
{
    cancelDrag();
    selection_.reset();
    setFeedback(game_.state().status == GameStatus::Won
                    ? tr("You won! Start a new game, or undo to keep playing.")
                    : tr("Select a face-up card, then choose a destination."));
    update();
}

const Card *GameBoard::cardFor(const BoardElement &element) const
{
    if (!element.cardIndex) {
        return nullptr;
    }
    const auto &state = game_.state();
    switch (element.pile) {
    case PileType::Stock: return &state.stock[*element.cardIndex];
    case PileType::Waste: return &state.waste[*element.cardIndex];
    case PileType::Foundation: return &state.foundations[element.pileIndex][*element.cardIndex];
    case PileType::Tableau: return &state.tableau[element.pileIndex][*element.cardIndex];
    }
    return nullptr;
}

void GameBoard::selectSource(const BoardElement &element)
{
    const auto source = sourceFor(element);
    if (!source) {
        setFeedback(tr("Select an accessible face-up card."));
        return;
    }
    selection_ = source;
    setFeedback(tr("Source selected. Choose a destination; click it again or press Escape to cancel."));
    update();
}

std::optional<BoardSelection> GameBoard::sourceFor(const BoardElement &element) const
{
    if (element.pile == PileType::Stock) {
        return std::nullopt;
    }
    const auto *card = cardFor(element);
    if (!card || !card->faceUp) {
        return std::nullopt;
    }
    return BoardSelection{element.pile, element.pileIndex, *element.cardIndex, card->id()};
}

std::optional<Move> GameBoard::moveFor(const BoardSelection &source, const BoardElement &element) const
{
    std::optional<Move> move;
    if (element.pile == PileType::Tableau) {
        switch (source.pile) {
        case PileType::Tableau:
            move = TableauToTableau{source.pileIndex, source.cardIndex, element.pileIndex};
            break;
        case PileType::Waste:
            move = WasteToTableau{element.pileIndex};
            break;
        case PileType::Foundation:
            move = FoundationToTableau{source.pileIndex, element.pileIndex};
            break;
        case PileType::Stock:
            break;
        }
    } else if (element.pile == PileType::Foundation) {
        if (source.pile == PileType::Waste) {
            move = WasteToFoundation{element.pileIndex};
        } else if (source.pile == PileType::Tableau) {
            // This intent moves a pile top, not an arbitrary selected suffix.
            if (source.cardIndex + 1 != game_.state().tableau[source.pileIndex].size()) {
                return std::nullopt;
            }
            move = TableauToFoundation{source.pileIndex, element.pileIndex};
        }
    }
    return move;
}

void GameBoard::moveTo(const BoardElement &element)
{
    const auto move = moveFor(*selection_, element);
    if (move) {
        finish(game_.apply(*move));
    } else if (selection_->pile == PileType::Tableau && element.pile == PileType::Foundation) {
        setFeedback(tr("Select a single top card for a foundation."));
    } else {
        selectSource(element);
    }
}

void GameBoard::click(const std::optional<BoardElement> &element)
{
    if (!element) {
        clearSelection();
    } else if (element->pile == PileType::Stock) {
        finish(game_.state().stock.empty() ? game_.apply(RecycleWaste{}) : game_.apply(DrawStock{}));
    } else if (selection_ && selection_->pile == element->pile
               && selection_->pileIndex == element->pileIndex
               && element->cardIndex == selection_->cardIndex) {
        clearSelection();
    } else if (!selection_
               || element->pile == PileType::Waste
               || (selection_->pile == PileType::Tableau && element->pile == PileType::Tableau
                   && selection_->pileIndex == element->pileIndex)) {
        selectSource(*element);
    } else {
        moveTo(*element);
    }
}

void GameBoard::cancelDrag()
{
    const bool active = drag_ && drag_->active;
    press_.reset();
    drag_.reset();
    unsetCursor();
    if (active) {
        setFeedback(tr("Drag canceled. The game and previous selection are unchanged."));
    }
    update();
}

void GameBoard::updateHoverCursor(QPointF position)
{
    const auto element = boardLayout().hitTest(position);
    if (element && sourceFor(*element)) {
        setCursor(Qt::OpenHandCursor);
    } else {
        unsetCursor();
    }
}

std::optional<BoardElement> GameBoard::destinationAt(QPointF point,
                                                    const BoardSelection &source) const
{
    if (!QRectF(rect()).contains(point)) {
        return std::nullopt;
    }
    const auto layout = boardLayout();
    const auto hit = layout.hitTest(point);
    if (!hit || (hit->pile == source.pile && hit->pileIndex == source.pileIndex)
        || !moveFor(source, *hit)) {
        return std::nullopt;
    }
    for (auto element = layout.elements.rbegin(); element != layout.elements.rend(); ++element) {
        if (element->pile == hit->pile && element->pileIndex == hit->pileIndex) {
            return *element;
        }
    }
    return std::nullopt;
}

void GameBoard::updateDragPosition(QPointF position)
{
    if (drag_ && drag_->active) {
        drag_->position = position;
        drag_->target = destinationAt(position, drag_->source);
        update();
    }
}

void GameBoard::mousePressEvent(QMouseEvent *event)
{
    if (event->button() != Qt::LeftButton) {
        QWidget::mousePressEvent(event);
        return;
    }
    cancelDrag();
    setFocus(Qt::MouseFocusReason);
    const auto element = boardLayout().hitTest(event->position());
    press_ = PointerPress{element, event->position(), false};
    if (element) {
        if (const auto source = sourceFor(*element)) {
            const auto count = source->pile == PileType::Tableau
                ? game_.state().tableau[source->pileIndex].size() - source->cardIndex
                : std::size_t{1};
            drag_ = BoardDrag{*source, count, event->position(), event->position(),
                              event->position() - element->rectangle.topLeft(), false, std::nullopt};
        }
    }
    event->accept();
}

void GameBoard::mouseMoveEvent(QMouseEvent *event)
{
    if (!press_) {
        updateHoverCursor(event->position());
        QWidget::mouseMoveEvent(event);
        return;
    }
    if (!(event->buttons() & Qt::LeftButton)) {
        cancelDrag();
        return;
    }
    if ((event->position() - press_->position).manhattanLength() >= QApplication::startDragDistance()) {
        press_->moved = true;
        if (drag_ && !drag_->active) {
            drag_->active = true;
            setCursor(Qt::ClosedHandCursor);
            setFeedback(tr("Dragging. Release to attempt the outlined destination; Escape cancels."));
        }
    }
    updateDragPosition(event->position());
    event->accept();
}

void GameBoard::mouseReleaseEvent(QMouseEvent *event)
{
    if (event->button() != Qt::LeftButton || !press_) {
        QWidget::mouseReleaseEvent(event);
        return;
    }
    const bool active = drag_ && drag_->active;
    const bool moved = press_->moved;
    const auto pressed = press_->element;
    const auto source = active ? std::optional<BoardSelection>{drag_->source} : std::nullopt;
    const auto destination = source ? destinationAt(event->position(), *source) : std::nullopt;
    cancelDrag();
    if (source && destination) {
        if (const auto move = moveFor(*source, *destination)) {
            finish(game_.apply(*move));
        }
    } else if (!active && !moved && QRectF(rect()).contains(event->position())) {
        click(pressed);
    }
    updateHoverCursor(event->position());
    event->accept();
}

void GameBoard::keyPressEvent(QKeyEvent *event)
{
    if (event->key() == Qt::Key_Escape) {
        clearSelection();
        event->accept();
        return;
    }
    QWidget::keyPressEvent(event);
}

void GameBoard::resizeEvent(QResizeEvent *event)
{
    cancelDrag();
    QWidget::resizeEvent(event);
    updateMinimumHeight();
}

void GameBoard::moveEvent(QMoveEvent *event)
{
    QWidget::moveEvent(event);
    updateDragPosition(mapFromGlobal(QCursor::pos()));
}

void GameBoard::focusOutEvent(QFocusEvent *event)
{
    cancelDrag();
    QWidget::focusOutEvent(event);
}

void GameBoard::leaveEvent(QEvent *event)
{
    if (!drag_ || !drag_->active) {
        unsetCursor();
    }
    QWidget::leaveEvent(event);
}

bool GameBoard::event(QEvent *event)
{
    if (event->type() == QEvent::WindowDeactivate || event->type() == QEvent::Hide) {
        cancelDrag();
    }
    return QWidget::event(event);
}

bool GameBoard::draggedElement(const BoardElement &element) const
{
    return drag_ && drag_->active && element.pile == drag_->source.pile
        && element.pileIndex == drag_->source.pileIndex && element.cardIndex
        && *element.cardIndex >= drag_->source.cardIndex;
}

void GameBoard::paintEvent(QPaintEvent *)
{
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    painter.fillRect(rect(), QColor(25, 85, 55));
    const auto layout = boardLayout();
    QRectF selected;
    for (const auto &element : layout.elements) {
        auto labelFont = font();
        labelFont.setPixelSize(12);
        painter.setFont(labelFont);
        painter.setPen(QColor(235, 240, 230));
        QString label;
        if (element.pile == PileType::Stock) {
            label = tr("Stock (%1)").arg(static_cast<qulonglong>(game_.state().stock.size()));
        } else if (element.pile == PileType::Waste) {
            label = tr("Waste");
        } else if (element.pile == PileType::Foundation) {
            label = tr("Foundation %1").arg(suitText(static_cast<Suit>(element.pileIndex), labelFont));
        } else if (!element.cardIndex || *element.cardIndex == 0) {
            label = tr("Column %1").arg(element.pileIndex + 1);
        }
        if (!label.isEmpty()) {
            painter.drawText(QRectF(element.rectangle.left(), element.rectangle.top() - 24,
                                     element.rectangle.width(), 20),
                              Qt::AlignCenter, label);
        }
        const auto *card = cardFor(element);
        if (card) {
            painter.save();
            if (draggedElement(element)) {
                painter.setOpacity(0.25);
            }
            drawCard(painter, element.rectangle, *card, cardBackImage_);
            painter.restore();
        } else {
            painter.setBrush(QColor(20, 70, 45));
            painter.setPen(QPen(QColor(175, 205, 180), 1.5, Qt::DashLine));
            painter.drawRoundedRect(element.rectangle, 7, 7);
            if (element.pile == PileType::Foundation) {
                auto symbolFont = font();
                symbolFont.setPixelSize(32);
                painter.setFont(symbolFont);
                painter.drawText(element.rectangle, Qt::AlignCenter,
                                  suitText(static_cast<Suit>(element.pileIndex), symbolFont));
            } else if (element.pile == PileType::Stock) {
                painter.drawText(element.rectangle, Qt::AlignCenter, tr("Recycle"));
            }
        }
        if ((!drag_ || !drag_->active) && selection_ && element.pile == selection_->pile
            && element.pileIndex == selection_->pileIndex && element.cardIndex
            && *element.cardIndex >= selection_->cardIndex) {
            selected = selected.isNull() ? element.rectangle : selected.united(element.rectangle);
        }
    }
    if (!selected.isNull()) {
        painter.setBrush(Qt::NoBrush);
        painter.setPen(QPen(QColor(255, 225, 125), 3, Qt::DashLine));
        painter.drawRoundedRect(selected.adjusted(2, 2, -2, -2), 7, 7);
    }
    if (drag_ && drag_->active) {
        if (drag_->target) {
            painter.setBrush(Qt::NoBrush);
            painter.setPen(QPen(QColor(220, 235, 255), 3, Qt::DashLine));
            painter.drawRoundedRect(drag_->target->rectangle.adjusted(-3, -3, 3, 3), 7, 7);
        }
        std::optional<QPointF> translation;
        painter.save();
        for (const auto &element : layout.elements) {
            if (draggedElement(element)) {
                if (!translation) {
                    translation = drag_->position - drag_->pointerOffset - element.rectangle.topLeft();
                }
                drawCard(painter, element.rectangle.translated(*translation),
                          *cardFor(element), cardBackImage_);
            }
        }
        painter.restore();
    }
    if (hasFocus()) {
        painter.setBrush(Qt::NoBrush);
        painter.setPen(QPen(palette().color(QPalette::Highlight), 1, Qt::DotLine));
        painter.drawRect(rect().adjusted(2, 2, -3, -3));
    }
}

}
