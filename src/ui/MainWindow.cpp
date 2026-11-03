#include "MainWindow.h"
#include "GameBoard.h"

#include <QAction>
#include <QKeySequence>
#include <QMenu>
#include <QMenuBar>
#include <QScrollArea>
#include <QStatusBar>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    initialize(new cardsy::ui::GameBoard(this));
}

MainWindow::MainWindow(std::uint32_t seed, QWidget *parent)
    : QMainWindow(parent)
{
    initialize(new cardsy::ui::GameBoard(seed, this));
}

void MainWindow::initialize(cardsy::ui::GameBoard *board)
{
    board_ = board;
    setWindowTitle(QStringLiteral("Cardsy"));
    setMinimumSize(760, 600);
    resize(1000, 760);

    auto *scroll = new QScrollArea(this);
    scroll->setObjectName(QStringLiteral("boardScrollArea"));
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    scroll->setWidget(board_);
    setCentralWidget(scroll);
    setFocusProxy(board_);

    auto *menu = menuBar()->addMenu(tr("&Game"));
    auto *newGameAction = menu->addAction(tr("&New Game"));
    newGameAction->setObjectName(QStringLiteral("newGameAction"));
    newGameAction->setShortcut(QKeySequence::New);
    connect(newGameAction, &QAction::triggered, board_, &cardsy::ui::GameBoard::newGame);

    undoAction_ = menu->addAction(tr("&Undo"));
    undoAction_->setObjectName(QStringLiteral("undoAction"));
    undoAction_->setShortcut(QKeySequence::Undo);
    undoAction_->setEnabled(board_->canUndo());
    connect(undoAction_, &QAction::triggered, board_, &cardsy::ui::GameBoard::undo);
    menu->addSeparator();
    auto *quitAction = menu->addAction(tr("&Quit"));
    quitAction->setObjectName(QStringLiteral("quitAction"));
    quitAction->setShortcut(QKeySequence::Quit);
    connect(quitAction, &QAction::triggered, this, &QWidget::close);

    statusBar()->setSizeGripEnabled(false);
    statusBar()->showMessage(board_->feedback());
    connect(board_, &cardsy::ui::GameBoard::feedbackChanged, this, [this](const QString &message) {
        statusBar()->showMessage(message);
    });
    connect(board_, &cardsy::ui::GameBoard::stateChanged, this, [this] {
        undoAction_->setEnabled(board_->canUndo());
    });
}
