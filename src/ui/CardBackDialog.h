#pragma once

#include "CardBackCollection.h"

#include <QDialog>

class QComboBox;
class QLabel;
class QListWidget;
class QPushButton;
class QStackedWidget;

namespace cardsy::ui {

class CardBackDialog : public QDialog
{
    Q_OBJECT

public:
    CardBackDialog(CardBackCollection &backs, CardBackSettings &single, QWidget *parent = nullptr);

private:
    CardBackCollection &backs_;
    CardBackSettings &single_;
    QComboBox *mode_;
    QStackedWidget *sections_;
    QListWidget *list_;
    QLabel *preview_;
    QLabel *count_;
    QLabel *feedback_;
    QPushButton *choose_;
    QPushButton *removeSingle_;
    QPushButton *remove_;
    QPushButton *clear_;

    void refreshMode();
    void refreshCollection();
    void refreshSingle();
    void showResult(const CardBackResult &result);
    void chooseSingle();
    void addImages();
};

}
