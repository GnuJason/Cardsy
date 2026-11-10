#include "BoardTestSupport.h"
#include "ImageTestSupport.h"
#include "ui/CardBackSettings.h"
#include "ui/GameBoard.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QFileDialog>
#include <QFileSystemModel>
#include <QLineEdit>
#include <QSignalSpy>
#include <QStatusBar>
#include <QTemporaryDir>
#include <QTest>
#include <QTimer>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class PersonalizationTest : public QObject
{
    Q_OBJECT

    static void clickStock(GameBoard &board)
    {
        const auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
    }

    static QImage render(GameBoard &board, int scale = 1)
    {
        QImage image(board.size() * scale, QImage::Format_ARGB32_Premultiplied);
        image.setDevicePixelRatio(scale);
        image.fill(Qt::transparent);
        board.render(&image);
        return image;
    }

private slots:
    void initTestCase()
    {
        QApplication::setAttribute(Qt::AA_DontUseNativeDialogs);
    }

    void allFaceDownCardsChangeButFaceUpCardsDoNot()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("synthetic.png"));
        QImage solid({100, 140}, QImage::Format_RGB32);
        const QColor custom(210, 30, 190);
        solid.fill(custom);
        writeBytes(source, encodeImage(solid));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        auto *board = window.gameBoard();
        const auto layout = board->boardLayout();
        const auto before = render(*board);
        const auto state = board->gameState();
        QSignalSpy gameChanged(board, &GameBoard::stateChanged);
        QVERIFY(window.installCardBack(source));
        const auto after = render(*board);
        std::size_t changedBacks = 0;
        for (const auto &element : layout.elements) {
            if (!element.cardIndex) {
                continue;
            }
            const Card *card = nullptr;
            if (element.pile == PileType::Stock) {
                card = &state.stock[*element.cardIndex];
            } else if (element.pile == PileType::Tableau) {
                card = &state.tableau[element.pileIndex][*element.cardIndex];
            }
            if (!card) {
                continue;
            }
            if (!card->faceUp) {
                QCOMPARE(after.pixelColor(exposedPoint(layout, element)), custom);
                ++changedBacks;
            } else {
                const auto area = element.rectangle.toAlignedRect().adjusted(3, 3, -3, -3);
                QVERIFY(before.copy(area) == after.copy(area));
            }
        }
        QCOMPARE(changedBacks, std::size_t{22});
        QCOMPARE(gameChanged.count(), 0);
        QVERIFY(board->gameState() == state);
    }

    void personalizationDoesNotChangeSelectionStateSeedOrUndoHistory()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("synthetic.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        auto *board = window.gameBoard();
        const auto initial = board->gameState();
        clickStock(*board);
        const auto drawnOnce = board->gameState();
        clickStock(*board);
        const auto drawnTwice = board->gameState();
        const auto layout = board->boardLayout();
        const auto selected = topElement(layout, PileType::Tableau);
        QTest::mouseClick(board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, selected));
        QVERIFY(board->selection());
        const auto id = board->selection()->cardId;
        QSignalSpy changed(board, &GameBoard::stateChanged);
        QVERIFY(window.installCardBack(source));
        QVERIFY(board->gameState() == drawnTwice);
        QCOMPARE(board->selection()->cardId, id);
        QVERIFY(board->gameState().shuffleSeed == 42U);
        QVERIFY(board->canUndo());
        QCOMPARE(changed.count(), 0);
        board->undo();
        QVERIFY(board->gameState() == drawnOnce);
        QVERIFY(settings.isCustom());
        const auto custom = board->cardBackImage();
        QVERIFY(settings.useDefault());
        QVERIFY(board->cardBackImage().isNull());
        QVERIFY(board->gameState() == drawnOnce);
        board->undo();
        QVERIFY(board->gameState() == initial);
        QVERIFY(!board->canUndo());
        QVERIFY(!custom.isNull());
    }

    void newGameRetainsPersonalizationAndResizeUsesSameCachedImage()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("synthetic.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        auto *board = window.gameBoard();
        QVERIFY(window.installCardBack(source));
        const auto image = board->cardBackImage();
        const auto persisted = readBytes(settings.managedPath());
        clickStock(*board);
        board->newGame();
        QVERIFY(board->cardBackImage() == image);
        QVERIFY(!board->canUndo());
        QCOMPARE(board->gameState().stock.size(), std::size_t{24});
        QVERIFY(validate(board->gameState()).empty());
        window.show();
        for (const auto size : {QSize(760, 600), QSize(1000, 760), QSize(1440, 1000)}) {
            window.resize(size);
            QCoreApplication::processEvents();
            const auto one = render(*board);
            const auto highDpi = render(*board, 2);
            const auto center = topElement(board->boardLayout(), PileType::Stock).rectangle.center();
            QVERIFY(one.pixelColor(center.toPoint()).green() > 200);
            QVERIFY(highDpi.pixelColor((center * 2).toPoint()).green() > 200);
            QVERIFY(board->cardBackImage() == image);
        }
        QCOMPARE(readBytes(settings.managedPath()), persisted);
    }

    void recreatedWindowLoadsPreferenceWithoutOriginal()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("synthetic.png"));
        const auto data = directory.filePath(QStringLiteral("private"));
        writeBytes(source, encodeImage(syntheticImage()));
        QImage expected;
        {
            CardBackSettings settings(data);
            MainWindow window(settings, 42);
            QVERIFY(window.installCardBack(source));
            expected = window.gameBoard()->cardBackImage();
        }
        QVERIFY(QFile::remove(source));
        CardBackSettings restarted(data);
        MainWindow window(restarted, 99);
        QVERIFY(window.gameBoard()->cardBackImage() == expected);
        QVERIFY(validate(window.gameBoard()->gameState()).empty());
        auto *reset = window.findChild<QAction *>(QStringLiteral("defaultCardBackAction"));
        QVERIFY(reset);
        const auto state = window.gameBoard()->gameState();
        reset->trigger();
        QVERIFY(window.gameBoard()->cardBackImage().isNull());
        QVERIFY(window.gameBoard()->gameState() == state);
        QVERIFY(QFileInfo::exists(restarted.managedPath()));
        QVERIFY(restarted.isCustom());
    }

    void filePickerCancelChangesNothing()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("synthetic.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        QVERIFY(window.installCardBack(source));
        clickStock(*window.gameBoard());
        const auto before = window.gameBoard()->gameState();
        const auto image = settings.image();
        QSignalSpy changed(&settings, &CardBackSettings::changed);
        bool sawDialog = false;
        QTimer timer;
        connect(&timer, &QTimer::timeout, &window, [&] {
            if (auto *dialog = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                sawDialog = true;
                timer.stop();
                dialog->reject();
            }
        });
        timer.start(10);
        auto *choose = window.findChild<QAction *>(QStringLiteral("choosePhotoAction"));
        QVERIFY(choose);
        choose->trigger();
        timer.stop();
        QVERIFY(sawDialog);
        QCOMPARE(changed.count(), 0);
        QVERIFY(settings.image() == image);
        QVERIFY(window.gameBoard()->gameState() == before);
        QVERIFY(window.gameBoard()->canUndo());
    }

    void filePickerCanInstallSyntheticLocalImage()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("synthetic.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        const auto initial = window.gameBoard()->gameState();
        bool sawDialog = false;
        bool configured = false;
        bool timedOut = false;
        QTimer timer;
        connect(&timer, &QTimer::timeout, &window, [&] {
            if (auto *dialog = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                sawDialog = true;
                if (!configured) {
                    dialog->setDirectory(directory.path());
                    configured = true;
                }
                auto *model = dialog->findChild<QFileSystemModel *>();
                if (model && model->index(source).isValid()
                    && model->rowCount(model->index(directory.path())) > 0) {
                    auto *edit = dialog->findChild<QLineEdit *>(QStringLiteral("fileNameEdit"));
                    if (!edit) {
                        dialog->reject();
                        return;
                    }
                    timer.stop();
                    edit->setText(source);
                    if (!QMetaObject::invokeMethod(dialog, "accept", Qt::QueuedConnection)) {
                        dialog->reject();
                    }
                }
            }
        });
        QTimer::singleShot(5000, &window, [&] {
            timedOut = true;
            if (auto *dialog = window.findChild<QFileDialog *>()) {
                if (auto *modal = QApplication::activeModalWidget()) {
                    QMetaObject::invokeMethod(modal, "reject", Qt::QueuedConnection);
                }
                QMetaObject::invokeMethod(dialog, "reject", Qt::QueuedConnection);
            }
        });
        timer.start(10);
        window.findChild<QAction *>(QStringLiteral("choosePhotoAction"))->trigger();
        timer.stop();
        QVERIFY(sawDialog);
        QVERIFY(!timedOut);
        QVERIFY(settings.isCustom());
        QVERIFY(window.gameBoard()->cardBackImage() == settings.image());
        QVERIFY(window.gameBoard()->gameState() == initial);
    }

    void explicitInvalidSelectionReportsWithoutReplacingCurrentBack()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("synthetic.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        QVERIFY(window.installCardBack(source));
        const auto image = window.gameBoard()->cardBackImage();
        const auto state = window.gameBoard()->gameState();
        writeBytes(source, QByteArray("not an image"));
        QVERIFY(!window.installCardBack(source));
        QVERIFY(window.gameBoard()->cardBackImage() == image);
        QVERIFY(window.gameBoard()->gameState() == state);
        QVERIFY(!window.statusBar()->currentMessage().isEmpty());
        QVERIFY(!window.statusBar()->currentMessage().contains(source));
    }
};

QTEST_MAIN(PersonalizationTest)
#include "PersonalizationTest.moc"
