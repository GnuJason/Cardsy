#include "BoardTestSupport.h"
#include "ImageTestSupport.h"
#include "ui/GameBoard.h"
#include "ui/IndividualCardBacks.h"
#include "ui/MainWindow.h"

#include <QTemporaryDir>
#include <QTest>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class IndividualBackRenderingTest : public QObject
{
    Q_OBJECT

    static QImage render(GameBoard &board, int scale = 1)
    {
        QImage image(board.size() * scale, QImage::Format_ARGB32_Premultiplied);
        image.setDevicePixelRatio(scale);
        image.fill(Qt::transparent);
        board.render(&image);
        return image;
    }

private slots:
    void onlyAssignedHiddenCardsChangeAndGameRemainsUnchanged()
    {
        QTemporaryDir directory;
        CardBackSettings defaults(directory.path());
        MainWindow window(defaults, 42);
        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        auto &board = *window.gameBoard();
        auto &backs = *window.individualCardBacks();
        const auto state = board.gameState();
        const auto before = render(board);
        const auto id = state.stock.back().id();
        const auto otherId = state.tableau[1].front().id();
        const auto source = directory.filePath(QStringLiteral("source.png"));
        QImage solid({100, 140}, QImage::Format_RGB32);
        solid.fill(Qt::magenta);
        writeBytes(source, encodeImage(solid));
        QVERIFY(backs.assign(id, source));
        solid.fill(Qt::cyan);
        writeBytes(source, encodeImage(solid));
        QVERIFY(backs.assign(otherId, source));
        // Assign every face-up card too: their faces must not change.
        for (const auto &pile : state.tableau) {
            QVERIFY(backs.assign(pile.back().id(), source));
        }
        const auto after = render(board);
        const auto layout = board.boardLayout();
        for (const auto &element : layout.elements) {
            if (!element.cardIndex) {
                continue;
            }
            const auto &card = element.pile == PileType::Stock
                ? state.stock[*element.cardIndex]
                : state.tableau[element.pileIndex][*element.cardIndex];
            const auto point = exposedPoint(layout, element);
            if (!card.faceUp && (card.id() == id || card.id() == otherId)) {
                QCOMPARE(after.pixelColor(point), QColor(card.id() == id ? Qt::magenta : Qt::cyan));
            } else if (card.faceUp) {
                const auto area = element.rectangle.toAlignedRect().adjusted(3, 3, -3, -3);
                QCOMPARE(after.copy(area), before.copy(area));
            } else {
                QCOMPARE(after.pixelColor(point), before.pixelColor(point));
            }
        }
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
        for (const auto size : {QSize(760, 600), QSize(1440, 1000)}) {
            window.resize(size);
            QCoreApplication::processEvents();
            const auto highDpi = render(board, 2);
            const auto center = topElement(board.boardLayout(), PileType::Stock).rectangle.center();
            QCOMPARE(highDpi.pixelColor((center * 2).toPoint()), QColor(Qt::magenta));
        }
        QVERIFY(backs.resetAll());
        window.resize(1000, 760);
        QCoreApplication::processEvents();
        QCOMPARE(render(board), before);
    }

    void repaintUsesCacheAndFileLossUpdatesBoardWithoutRestart()
    {
        QTemporaryDir directory;
        CardBackSettings defaults(directory.path());
        MainWindow window(defaults, 42);
        auto &board = *window.gameBoard();
        auto &backs = *window.individualCardBacks();
        const auto id = board.gameState().stock.back().id();
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        QVERIFY(backs.assign(id, source));
        QCoreApplication::processEvents();
        const auto cached = board.cardBackImage(id).cacheKey();
        QVERIFY(QFile::remove(source));
        QVERIFY(QFile::remove(backs.managedPath(id)));
        // No event delivery: repaints must still use decoded pixels, not read the file.
        for (int repeat = 0; repeat < 10; ++repeat) {
            render(board);
            QCOMPARE(board.cardBackImage(id).cacheKey(), cached);
        }
        QTRY_VERIFY(board.cardBackImage(id).isNull());
        const auto initial = board.gameState();
        const auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
        QVERIFY(board.canUndo());
        board.undo();
        QVERIFY(board.gameState() == initial);
    }

    void universalBackRemainsFallbackAndUndoDoesNotUndoAssignments()
    {
        QTemporaryDir directory;
        CardBackSettings defaults(directory.path());
        MainWindow window(defaults, 42);
        auto &board = *window.gameBoard();
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        QVERIFY(defaults.installImage(source));
        const auto id = board.gameState().stock.back().id();
        QCOMPARE(board.cardBackImage(id), defaults.image());
        const auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
        const auto drawn = board.gameState();
        QVERIFY(window.individualCardBacks()->assign(id, source));
        QVERIFY(board.gameState() == drawn);
        board.undo();
        QVERIFY(window.individualCardBacks()->hasAssignment(id));
        board.newGame();
        QVERIFY(window.individualCardBacks()->hasAssignment(id));
        QVERIFY(window.individualCardBacks()->reset(id));
        QCOMPARE(board.cardBackImage(id), defaults.image());
        QVERIFY(defaults.useDefault());
        QVERIFY(board.cardBackImage(id).isNull());
    }
};

QTEST_MAIN(IndividualBackRenderingTest)
#include "IndividualBackRenderingTest.moc"
