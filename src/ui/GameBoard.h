#pragma once

#include "BoardLayout.h"
#include "engine/Game.h"

#include <QString>
#include <QWidget>

#include <cstdint>
#include <optional>

namespace cardsy::ui {

struct BoardSelection {
    PileType pile;
    std::size_t pileIndex;
    std::size_t cardIndex;
    CardId cardId;
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
    QString feedback() const { return feedback_; }
    BoardLayout boardLayout() const;
    [[nodiscard]] MoveResult loadState(const GameState &state);

public slots:
    void undo();
    void newGame();
    void clearSelection();

signals:
    void stateChanged();
    void feedbackChanged(const QString &message);

protected:
    void paintEvent(QPaintEvent *event) override;
    void mousePressEvent(QMouseEvent *event) override;
    void keyPressEvent(QKeyEvent *event) override;
    void resizeEvent(QResizeEvent *event) override;

private:
    Game game_;
    std::optional<BoardSelection> selection_;
    QString feedback_;

    void initialize();
    void updateMinimumHeight();
    void setFeedback(const QString &message);
    void finish(MoveResult result);
    void selectSource(const BoardElement &element);
    void moveTo(const BoardElement &element);
    const Card *cardFor(const BoardElement &element) const;
};

}
