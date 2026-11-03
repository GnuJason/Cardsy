#include "MainWindow.h"
#include "CardBackSettings.h"
#include "GameBoard.h"

#include <QAction>
#include <QDir>
#include <QFileDialog>
#include <QKeySequence>
#include <QMenu>
#include <QMenuBar>
#include <QScrollArea>
#include <QStatusBar>
#include <QStandardPaths>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    initialize(new cardsy::ui::GameBoard(this), new cardsy::ui::CardBackSettings(this));
}

MainWindow::MainWindow(std::uint32_t seed, QWidget *parent)
    : QMainWindow(parent)
{
    initialize(new cardsy::ui::GameBoard(seed, this), new cardsy::ui::CardBackSettings(this));
}

MainWindow::MainWindow(cardsy::ui::CardBackSettings &settings, std::uint32_t seed, QWidget *parent)
    : QMainWindow(parent)
{
    initialize(new cardsy::ui::GameBoard(seed, this), &settings);
}

void MainWindow::initialize(cardsy::ui::GameBoard *board, cardsy::ui::CardBackSettings *settings)
{
    board_ = board;
    cardBackSettings_ = settings;
    board_->setCardBackImage(settings->image());
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
    auto *backs = menu->addMenu(tr("Card &Back"));
    auto *choosePhotoAction = backs->addAction(tr("&Choose Photo..."));
    choosePhotoAction->setObjectName(QStringLiteral("choosePhotoAction"));
    choosePhotoAction->setShortcut(QKeySequence::Open);
    connect(choosePhotoAction, &QAction::triggered, this, &MainWindow::choosePhoto);
    auto *defaultBackAction = backs->addAction(tr("Use &Default Card Back"));
    defaultBackAction->setObjectName(QStringLiteral("defaultCardBackAction"));
    connect(defaultBackAction, &QAction::triggered, this, [this] {
        const auto result = cardBackSettings_->useDefault();
        if (!result) {
            statusBar()->showMessage(result.message);
        }
    });
    connect(settings, &cardsy::ui::CardBackSettings::changed, this, [this] {
        board_->setCardBackImage(cardBackSettings_->image());
        statusBar()->showMessage(cardBackSettings_->isCustom()
            ? tr("Personal photo card back applied locally.")
            : tr("Using the default card back."));
    });
    menu->addSeparator();
    auto *quitAction = menu->addAction(tr("&Quit"));
    quitAction->setObjectName(QStringLiteral("quitAction"));
    quitAction->setShortcut(QKeySequence::Quit);
    connect(quitAction, &QAction::triggered, this, &QWidget::close);

    statusBar()->setSizeGripEnabled(false);
    statusBar()->showMessage(settings->startupWarning().isEmpty()
        ? board_->feedback() : settings->startupWarning());
    connect(board_, &cardsy::ui::GameBoard::feedbackChanged, this, [this](const QString &message) {
        statusBar()->showMessage(message);
    });
    connect(board_, &cardsy::ui::GameBoard::stateChanged, this, [this] {
        undoAction_->setEnabled(board_->canUndo());
    });
}

cardsy::ui::CardBackResult MainWindow::installCardBack(const QString &fileName)
{
    const auto result = cardBackSettings_->installImage(fileName);
    if (!result) {
        statusBar()->showMessage(result.message);
    }
    return result;
}

void MainWindow::choosePhoto()
{
    auto directory = QStandardPaths::writableLocation(QStandardPaths::PicturesLocation);
    if (directory.isEmpty() || !QDir(directory).exists()) {
        directory = QDir::homePath();
    }
    const auto fileName = QFileDialog::getOpenFileName(
        this, tr("Choose Photo"), directory,
        cardsy::ui::CardBackSettings::fileFilter());
    if (!fileName.isEmpty()) {
        const auto result = installCardBack(fileName);
        Q_UNUSED(result);
    }
}
