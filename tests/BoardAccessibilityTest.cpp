#include "KeyboardTestSupport.h"
#include "ImageTestSupport.h"
#include "ui/CardBackSettings.h"
#include "ui/MainWindow.h"

#include <QAccessible>
#include <QAction>
#include <QMenu>
#include <QPointer>
#include <QSet>
#include <QSignalSpy>
#include <QStatusBar>
#include <QTemporaryDir>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class BoardAccessibilityTest : public QObject
{
    Q_OBJECT

private slots:
    void nativeInterfaceExposesBoardContextAndActivation()
    {
        GameBoard board(42);
        showKeyboardBoard(board);
        QVERIFY(QTest::qWaitForWindowActive(&board));
        auto *interface = QAccessible::queryAccessibleInterface(&board);
        QVERIFY(interface);
        QVERIFY(interface->isValid());
        QCOMPARE(interface->role(), QAccessible::Grouping);
        QCOMPARE(interface->text(QAccessible::Name), QStringLiteral("Klondike Solitaire board"));
        QVERIFY(interface->text(QAccessible::Description).contains(QStringLiteral("Left/Right")));
        QVERIFY(interface->text(QAccessible::Description).contains(QStringLiteral("Enter or Space")));
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("Stock: 24")));
        QVERIFY(interface->state().focusable);
        QVERIFY(interface->state().focused);
        QCOMPARE(interface->childCount(), 0);
        auto *actions = interface->actionInterface();
        QVERIFY(actions);
        QVERIFY(actions->actionNames().contains(QAccessibleActionInterface::pressAction()));
        QVERIFY(!actions->keyBindingsForAction(QAccessibleActionInterface::pressAction()).isEmpty());
        actions->doAction(QAccessibleActionInterface::pressAction());
        QCOMPARE(board.gameState().stock.size(), std::size_t{23});
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("Stock: 23")));
    }

    void currentPileCardAndSelectedSourceAreDistinct()
    {
        GameBoard board(42);
        QVERIFY(board.loadState(tableauFixture()));
        showKeyboardBoard(board);
        auto *interface = QAccessible::queryAccessibleInterface(&board);
        QVERIFY(interface);
        constexpr std::array<const char *, 4> suits{"Clubs", "Diamonds", "Hearts", "Spades"};
        for (std::size_t index = 0; index < 4; ++index) {
            QVERIFY(goTop(board, index + 2));
            const auto text = interface->text(QAccessible::Value);
            QVERIFY(text.contains(QString::fromLatin1(suits[index])));
            QVERIFY(text.contains(QStringLiteral("empty")));
        }
        QVERIFY(goTop(board, 1));
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("Waste: empty")));
        QVERIFY(goTableau(board, 0));
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("6 of Hearts")));
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("face up")));
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("1 hidden")));
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(goTableau(board, 1));
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("7 of Clubs")));
        QVERIFY(interface->text(QAccessible::Description).contains(QStringLiteral("Selected source:")));
        QVERIFY(interface->text(QAccessible::Description).contains(QStringLiteral("6 of Hearts")));
        QTest::keyClick(&board, Qt::Key_Escape);
        QVERIFY(interface->text(QAccessible::Description).contains(QStringLiteral("No move source selected")));
    }

    void hiddenIdentitiesAreNotExposedAndRepaintsDoNotChangeContext()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        showKeyboardBoard(board);
        auto *interface = QAccessible::queryAccessibleInterface(&board);
        QVERIFY(interface);
        QVERIFY(interface->text(QAccessible::Value).contains(QStringLiteral("face-down")));
        QVERIFY(!interface->text(QAccessible::Value).contains(QStringLiteral("of Diamonds")));
        QVERIFY(goTableau(board, 0));
        const auto description = interface->text(QAccessible::Description);
        QVERIFY(!description.contains(QStringLiteral("2 of Diamonds")));
        QSignalSpy focusChanged(&board, &GameBoard::boardFocusChanged);
        QImage render(board.size(), QImage::Format_RGB32);
        board.render(&render);
        const auto target = topElement(board.boardLayout(), PileType::Tableau, 1).rectangle.center();
        QMouseEvent hover(QEvent::MouseMove, target, board.mapToGlobal(target.toPoint()),
                          Qt::NoButton, Qt::NoButton, Qt::NoModifier);
        QApplication::sendEvent(&board, &hover);
        board.render(&render);
        QCOMPARE(focusChanged.count(), 0);
        QCOMPARE(interface->text(QAccessible::Description), description);
    }

    void nativeMenusActionsAndShortcutsRemainMeaningful()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        MainWindow window(settings, 42);
        QCOMPARE(window.accessibleName(), QStringLiteral("Cardsy Solitaire"));
        auto *game = window.findChild<QMenu *>(QStringLiteral("gameMenu"));
        auto *backs = window.findChild<QMenu *>(QStringLiteral("cardBackMenu"));
        QVERIFY(game && backs);
        auto *gameInterface = QAccessible::queryAccessibleInterface(game);
        auto *backsInterface = QAccessible::queryAccessibleInterface(backs);
        QVERIFY(gameInterface && backsInterface);
        QCOMPARE(gameInterface->text(QAccessible::Name), QStringLiteral("Game"));
        QCOMPARE(backsInterface->text(QAccessible::Name), QStringLiteral("Card Back"));
        QStringList gameLabels;
        for (int index = 0; index < gameInterface->childCount(); ++index) {
            gameLabels << gameInterface->child(index)->text(QAccessible::Name);
        }
        const auto labels = gameLabels.join(QLatin1Char(' ')).remove(QLatin1Char('&'));
        QVERIFY(labels.contains(QStringLiteral("New Game")));
        QVERIFY(labels.contains(QStringLiteral("Undo")));
        QVERIFY(labels.contains(QStringLiteral("Quit")));
        QStringList backLabels;
        for (int index = 0; index < backsInterface->childCount(); ++index) {
            backLabels << backsInterface->child(index)->text(QAccessible::Name);
        }
        const auto personal = backLabels.join(QLatin1Char(' ')).remove(QLatin1Char('&'));
        QVERIFY(personal.contains(QStringLiteral("Choose Photo")));
        QVERIFY(personal.contains(QStringLiteral("Use Default Card Back")));
        QSet<QString> shortcuts;
        for (const auto *name : {"newGameAction", "undoAction", "quitAction", "choosePhotoAction"}) {
            const auto *action = window.findChild<QAction *>(QString::fromLatin1(name));
            QVERIFY(action);
            QVERIFY2(!action->shortcut().isEmpty(), name);
            shortcuts.insert(action->shortcut().toString(QKeySequence::PortableText));
        }
        QCOMPARE(shortcuts.size(), 4);
    }

    void gameAndImageErrorsExposeAccessibleStatusWithoutPaths()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        auto *board = window.gameBoard();
        QVERIFY(board->loadState(tableauFixture()));
        QVERIFY(goTableau(*board, 0));
        QTest::keyClick(board, Qt::Key_Return);
        QVERIFY(goTableau(*board, 2));
        QTest::keyClick(board, Qt::Key_Return);
        auto *status = QAccessible::queryAccessibleInterface(window.statusBar());
        QVERIFY(status);
        QCOMPARE(status->text(QAccessible::Name), QStringLiteral("Game status"));
        QVERIFY(status->text(QAccessible::Description).contains(QStringLiteral("not allowed")));
        const auto source = directory.filePath(QStringLiteral("invalid.png"));
        writeBytes(source, QByteArray("not an image"));
        QVERIFY(!window.installCardBack(source));
        QCOMPARE(status->text(QAccessible::Description), window.statusBar()->currentMessage());
        QVERIFY(!status->text(QAccessible::Description).contains(source));
        QVERIFY(!status->text(QAccessible::Description).isEmpty());
    }

    void nativeAccessibleCacheDoesNotRetainDestroyedBoard()
    {
        auto *board = new GameBoard(42);
        QPointer<GameBoard> guarded(board);
        auto *interface = QAccessible::queryAccessibleInterface(board);
        QVERIFY(interface);
        const auto id = QAccessible::uniqueId(interface);
        delete board;
        QVERIFY(guarded.isNull());
        QVERIFY(!QAccessible::accessibleInterface(id));
    }

    void accessibleActivationRespectsDisabledAndHiddenBoard()
    {
        GameBoard board(42);
        showKeyboardBoard(board);
        const auto initial = board.gameState();
        auto *interface = QAccessible::queryAccessibleInterface(&board);
        QVERIFY(interface && interface->actionInterface());
        board.setEnabled(false);
        QVERIFY(interface->state().disabled);
        interface->actionInterface()->doAction(QAccessibleActionInterface::pressAction());
        QVERIFY(board.gameState() == initial);
        board.setEnabled(true);
        board.hide();
        interface->actionInterface()->doAction(QAccessibleActionInterface::pressAction());
        QVERIFY(board.gameState() == initial);
        QVERIFY(!board.canUndo());
    }
};

QTEST_MAIN(BoardAccessibilityTest)
#include "BoardAccessibilityTest.moc"
