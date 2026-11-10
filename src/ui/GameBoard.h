#pragma once

#include "BoardLayout.h"
#include "BoardFocus.h"
#include "CardBackCollection.h"
#include "engine/Game.h"

#include <QImage>
#include <QPointer>
#include <QString>
#include <QWidget>

#include <cstdint>
#include <array>
#include <optional>

namespace cardsy::ui {

struct BoardSelection {
    PileType pile;
    std::size_t pileIndex;
    std::size_t cardIndex;
    CardId cardId;
};

struct BoardDrag {
    BoardSelection source;
    std::size_t sequenceLength;
    QPointF pressPosition;
    QPointF position;
    QPointF pointerOffset;
    bool active = false;
    std::optional<BoardElement> target;
};

class GameBoard : public QWidget
{
    Q_OBJECT

public:
    explicit GameBoard(QWidget *parent = nullptr);
    explicit GameBoard(std::uint32_t seed, QWidget *parent = nullptr);

    const GameState &gameState() const { return game_.state(); }
    bool canUndo() const { return game_.canUndo(); }
    std::optional<BoardSelection> selection() const { return selection_; }
    std::optional<BoardDrag> drag() const { return drag_; }
    BoardFocus keyboardFocus() const { return keyboardFocus_; }
    std::optional<BoardElement> focusedElement() const;
    std::optional<QRectF> focusedRectangle() const;
    QString focusedItemDescription() const;
    QString feedback() const { return feedback_; }
    BoardLayout boardLayout() const;
    [[nodiscard]] MoveResult loadState(const GameState &state);
    void setCardBackImage(const QImage &image);
    const QImage &cardBackImage() const;
    void setCardBackCollection(CardBackCollection *collection);
    const GameCardBacks &gameCardBacks() const { return gameCardBacks_; }
    const QImage &cardBackImage(CardId id) const;

public slots:
    void undo();
    void newGame();
    void clearSelection();
    void cancelDrag();
    void activateFocusedItem();

signals:
    void stateChanged();
    void feedbackChanged(const QString &message);
    void boardFocusChanged();
    void focusVisibilityRequested(const QRectF &rectangle);
    void cardBacksRandomized();

protected:
    void paintEvent(QPaintEvent *event) override;
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;
    void keyPressEvent(QKeyEvent *event) override;
    void resizeEvent(QResizeEvent *event) override;
    void moveEvent(QMoveEvent *event) override;
    void focusOutEvent(QFocusEvent *event) override;
    void focusInEvent(QFocusEvent *event) override;
    void leaveEvent(QEvent *event) override;
    bool event(QEvent *event) override;

private:
    struct PointerPress {
        std::optional<BoardElement> element;
        QPointF position;
        bool moved = false;
    };

    Game game_;
    std::optional<BoardSelection> selection_;
    std::optional<PointerPress> press_;
    std::optional<BoardDrag> drag_;
    BoardFocus keyboardFocus_;
    bool keyboardActivation_ = false;
    QString accessibleValue_;
    QString feedback_;
    QImage cardBackImage_;
    QPointer<CardBackCollection> collection_;
    GameCardBacks gameCardBacks_;

    void initialize();
    void randomizeCardBacks();
    void updateMinimumHeight();
    void setFeedback(const QString &message);
    void setBoardFocus(BoardFocus focus, bool ensureVisible);
    void requestFocusVisibility();
    void refreshAccessibility();
    QString describeElement(const BoardElement &element) const;
    void finish(MoveResult result, std::optional<BoardFocus> focus = std::nullopt);
    void selectSource(const BoardElement &element);
    void moveTo(const BoardElement &element);
    std::optional<BoardSelection> sourceFor(const BoardElement &element) const;
    std::optional<Move> moveFor(const BoardSelection &source, const BoardElement &target) const;
    std::optional<BoardElement> destinationAt(QPointF point, const BoardSelection &source) const;
    void click(const std::optional<BoardElement> &element);
    void updateDragPosition(QPointF position);
    void updateHoverCursor(QPointF position);
    bool draggedElement(const BoardElement &element) const;
    const Card *cardFor(const BoardElement &element) const;
};

}
