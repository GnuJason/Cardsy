#pragma once

#include <QMainWindow>
#include <QPointer>

#include <cstdint>

class QAction;
namespace cardsy::ui {
class CardBackSettings;
class CardBackDialog;
class CardBackCollection;
struct CardBackResult;
class GameBoard;
}

class MainWindow : public QMainWindow
{
public:
    explicit MainWindow(QWidget *parent = nullptr);
    explicit MainWindow(std::uint32_t seed, QWidget *parent = nullptr);
    MainWindow(cardsy::ui::CardBackSettings &settings, std::uint32_t seed,
               QWidget *parent = nullptr);

    cardsy::ui::GameBoard *gameBoard() const { return board_; }
    cardsy::ui::CardBackSettings *cardBackSettings() const { return cardBackSettings_; }
    cardsy::ui::CardBackCollection *cardBackCollection() const { return cardBackCollection_; }
    [[nodiscard]] cardsy::ui::CardBackResult installCardBack(const QString &fileName);

private:
    cardsy::ui::GameBoard *board_ = nullptr;
    QAction *undoAction_ = nullptr;
    cardsy::ui::CardBackSettings *cardBackSettings_ = nullptr;
    cardsy::ui::CardBackCollection *cardBackCollection_ = nullptr;
    QPointer<cardsy::ui::CardBackDialog> cardBackDialog_;

    void initialize(cardsy::ui::GameBoard *board, cardsy::ui::CardBackSettings *settings);
    void choosePhoto();
    void showStatusMessage(const QString &message);
};
