#pragma once

#include "engine/Card.h"

#include <QDialog>

#include <array>

class QLabel;
class QListWidget;
class QPushButton;
class QTabWidget;

namespace cardsy::ui {

class CardBackSettings;
struct CardBackResult;
class IndividualCardBacks;

class CardBackDialog : public QDialog
{
    Q_OBJECT

public:
    CardBackDialog(IndividualCardBacks &backs, CardBackSettings &defaults,
                   QWidget *parent = nullptr);

private:
    IndividualCardBacks &backs_;
    CardBackSettings &defaults_;
    QTabWidget *tabs_;
    std::array<QListWidget *, 4> lists_{};
    QLabel *preview_;
    QLabel *selection_;
    QLabel *feedback_;
    QPushButton *choose_;
    QPushButton *reset_;

    CardId selectedId() const;
    void refreshCard(CardId id);
    void refreshSelection();
    void showResult(const CardBackResult &result);
    void chooseImage();
};

}
