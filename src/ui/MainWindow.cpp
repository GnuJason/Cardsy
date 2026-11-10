#include "MainWindow.h"
#include "CardBackSettings.h"
#include "CardBackDialog.h"
#include "CardBackCollection.h"
#include "GameBoard.h"
#include "app/ApplicationIdentity.h"

#include <QAction>
#include <QDir>
#include <QFileDialog>
#include <QFileInfo>
#include <QKeySequence>
#include <QMenu>
#include <QMenuBar>
#include <QScrollArea>
#include <QStatusBar>
#include <QStandardPaths>
#include <QtMath>

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
    cardBackCollection_ = new cardsy::ui::CardBackCollection(
        settings->managedPath().isEmpty() ? QString{} : QFileInfo(settings->managedPath()).path(), this);
    board_->setCardBackCollection(cardBackCollection_);
    setWindowTitle(QString::fromLatin1(cardsy::build::DisplayName));
    setAccessibleName(tr("%1 Solitaire").arg(QString::fromLatin1(cardsy::build::DisplayName)));
    setMinimumSize(760, 600);
    resize(1000, 760);

    auto *scroll = new QScrollArea(this);
    scroll->setObjectName(QStringLiteral("boardScrollArea"));
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    scroll->setWidget(board_);
    setCentralWidget(scroll);
    setFocusProxy(board_);
    connect(board_, &cardsy::ui::GameBoard::focusVisibilityRequested, scroll,
            [scroll](const QRectF &rectangle) {
        scroll->ensureVisible(qRound(rectangle.center().x()), qRound(rectangle.center().y()),
                              qCeil(rectangle.width() / 2) + 8, qCeil(rectangle.height() / 2) + 8);
    });

    auto *menu = menuBar()->addMenu(tr("&Game"));
    menu->setObjectName(QStringLiteral("gameMenu"));
    menu->setAccessibleName(tr("Game"));
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
    backs->setObjectName(QStringLiteral("cardBackMenu"));
    backs->setAccessibleName(tr("Card Back"));
    auto *choosePhotoAction = backs->addAction(tr("&Choose Photo..."));
    choosePhotoAction->setObjectName(QStringLiteral("choosePhotoAction"));
    choosePhotoAction->setShortcut(QKeySequence::Open);
    connect(choosePhotoAction, &QAction::triggered, this, &MainWindow::choosePhoto);
    auto *defaultBackAction = backs->addAction(tr("Use &Default Card Back"));
    defaultBackAction->setObjectName(QStringLiteral("defaultCardBackAction"));
    connect(defaultBackAction, &QAction::triggered, this, [this] {
        const auto result = cardBackCollection_->setMode(cardsy::ui::CardBackMode::Default);
        if (!result) {
            showStatusMessage(result.message);
        }
    });
    backs->addSeparator();
    auto *manageBacks = backs->addAction(tr("&Custom Card Backs..."));
    manageBacks->setObjectName(QStringLiteral("customCardBacksAction"));
    connect(manageBacks, &QAction::triggered, this, [this] {
        board_->cancelDrag();
        if (!cardBackDialog_) {
            cardBackDialog_ = new cardsy::ui::CardBackDialog(
                *cardBackCollection_, *cardBackSettings_, this);
            cardBackDialog_->setAttribute(Qt::WA_DeleteOnClose);
        }
        cardBackDialog_->show();
        cardBackDialog_->raise();
        cardBackDialog_->activateWindow();
    });
    connect(settings, &cardsy::ui::CardBackSettings::changed, this, [this] {
        board_->setCardBackImage(cardBackSettings_->image());
        const auto result = cardBackCollection_->setMode(cardBackSettings_->isCustom()
            ? cardsy::ui::CardBackMode::SingleImage : cardsy::ui::CardBackMode::Default);
        showStatusMessage(!result ? result.message : cardBackSettings_->isCustom()
            ? tr("Personal photo card back applied locally.")
            : tr("Using the default card back."));
    });
    menu->addSeparator();
    auto *quitAction = menu->addAction(tr("&Quit"));
    quitAction->setObjectName(QStringLiteral("quitAction"));
    const QKeySequence quitShortcut(QKeySequence::Quit);
    quitAction->setShortcut(quitShortcut.isEmpty()
        ? QKeySequence(QKeyCombination(Qt::ControlModifier, Qt::Key_Q)) : quitShortcut);
    connect(quitAction, &QAction::triggered, this, &QWidget::close);

    statusBar()->setSizeGripEnabled(false);
    statusBar()->setAccessibleName(tr("Game status"));
    const auto warnings = (settings->startupWarning() + QLatin1Char(' ')
        + cardBackCollection_->startupWarning()).trimmed();
    showStatusMessage(warnings.isEmpty() ? board_->feedback() : warnings);
    connect(board_, &cardsy::ui::GameBoard::feedbackChanged, this, [this](const QString &message) {
        showStatusMessage(message);
    });
    connect(board_, &cardsy::ui::GameBoard::stateChanged, this, [this] {
        undoAction_->setEnabled(board_->canUndo());
    });
    board_->setFocus(Qt::OtherFocusReason);
}

cardsy::ui::CardBackResult MainWindow::installCardBack(const QString &fileName)
{
    auto result = cardBackSettings_->installImage(fileName);
    if (result) {
        result = cardBackCollection_->setMode(cardsy::ui::CardBackMode::SingleImage);
    }
    if (!result) {
        showStatusMessage(result.message);
    }
    return result;
}

void MainWindow::showStatusMessage(const QString &message)
{
    statusBar()->showMessage(message);
    if (statusBar()->accessibleDescription() != message) {
        statusBar()->setAccessibleDescription(message);
    }
}

void MainWindow::choosePhoto()
{
    board_->cancelDrag();
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
