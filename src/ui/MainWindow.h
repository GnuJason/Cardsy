#pragma once

#include <QMainWindow>

#include <cstdint>

class QAction;
namespace cardsy::ui {
class GameBoard;
}

class MainWindow : public QMainWindow
{
public:
    explicit MainWindow(QWidget *parent = nullptr);
    explicit MainWindow(std::uint32_t seed, QWidget *parent = nullptr);

    cardsy::ui::GameBoard *gameBoard() const { return board_; }

private:
    cardsy::ui::GameBoard *board_ = nullptr;
    QAction *undoAction_ = nullptr;

    void initialize(cardsy::ui::GameBoard *board);
};
