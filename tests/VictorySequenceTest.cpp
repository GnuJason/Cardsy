#include "KeyboardTestSupport.h"
#include "ImageTestSupport.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QLinearGradient>
#include <QPainter>
#include <QPointer>
#include <QProxyStyle>
#include <QSignalSpy>
#include <QStyleFactory>
#include <QTemporaryDir>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class AnimationStyle : public QProxyStyle
{
public:
    explicit AnimationStyle(bool animate) : QProxyStyle(QStyleFactory::create("Fusion")), animate_(animate) {}
    int styleHint(StyleHint hint, const QStyleOption *option, const QWidget *widget,
                  QStyleHintReturn *data) const override
    {
        return hint == SH_Widget_Animate ? animate_ : QProxyStyle::styleHint(hint, option, widget, data);
    }
private:
    bool animate_;
};

class VictorySequenceTest : public QObject
{
    Q_OBJECT

    static void capture(GameBoard &board, const QString &name)
    {
        const auto directory = qEnvironmentVariable("CARDSY_VICTORY_CAPTURE_DIR");
        if (!directory.isEmpty()) {
            QVERIFY(board.grab().save(directory + QLatin1Char('/') + name + QStringLiteral(".png")));
        }
    }

    static QImage victoryPicture()
    {
        QImage image(900, 600, QImage::Format_RGB32);
        QPainter painter(&image);
        QLinearGradient sky(0, 0, 0, 600);
        sky.setColorAt(0, QColor(35, 115, 210));
        sky.setColorAt(1, QColor(200, 230, 250));
        painter.fillRect(image.rect(), sky);
        painter.setPen(Qt::NoPen);
        painter.setBrush(QColor(255, 215, 70));
        painter.drawEllipse(QPointF(690, 225), 75, 75);
        painter.setBrush(QColor(80, 95, 140));
        painter.drawPolygon(QPolygonF{QPointF(0, 500), QPointF(290, 170), QPointF(600, 500)});
        painter.setBrush(QColor(240, 245, 255));
        painter.drawPolygon(QPolygonF{QPointF(220, 250), QPointF(290, 170), QPointF(365, 250)});
        painter.setBrush(QColor(30, 115, 65));
        painter.drawEllipse(QRectF(-100, 370, 850, 300));
        painter.setBrush(QColor(40, 155, 80));
        painter.drawEllipse(QRectF(400, 340, 650, 400));
        return image;
    }

    static void moveKing(GameBoard &board, std::size_t suit)
    {
        QVERIFY(goTableau(board, suit));
        QTest::keyClick(&board, Qt::Key_Return);
        QVERIFY(goTop(board, suit + 2));
        QTest::keyClick(&board, Qt::Key_Return);
    }

    static void win(GameBoard &board)
    {
        QVERIFY(board.loadState(cardsy::test::nearlyWon()));
        for (std::size_t suit = 0; suit < board.gameState().foundations.size(); ++suit) {
            moveKing(board, suit);
        }
        QCOMPARE(board.gameState().status, GameStatus::Won);
    }

private slots:
    void authoritativeWinOnlyOncePerGameAndUndoWorks()
    {
        AnimationStyle style(true);
        GameBoard board(42);
        board.setStyle(&style);
        showKeyboardBoard(board);
        QVERIFY(!board.victorySequence().active());
        QVERIFY(board.loadState(cardsy::test::nearlyWon()));
        for (std::size_t suit = 0; suit < 3; ++suit) {
            moveKing(board, suit);
            QVERIFY(!board.victorySequence().active());
        }
        moveKing(board, 3);
        QCOMPARE(board.victorySequence().stage(), VictoryStage::Cascade);
        QCOMPARE(board.victorySequence().cards().size(), createDeck().size());
        const auto generation = board.victorySequence().generation();
        const auto completed = board.gameState();
        board.activateFocusedItem();
        board.clearSelection();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier, QPoint(50, 50));
        QCOMPARE(board.victorySequence().generation(), generation);
        QVERIFY(board.gameState() == completed);
        board.undo();
        QVERIFY(!board.victorySequence().active());
        QCOMPARE(board.gameState().status, GameStatus::Playing);
        moveKing(board, 3);
        QCOMPARE(board.gameState().status, GameStatus::Won);
        QVERIFY(!board.victorySequence().active());
        board.newGame();
        win(board);
        QCOMPARE(board.victorySequence().stage(), VictoryStage::Cascade);
    }

    void newGameCancelsEveryStage_data()
    {
        QTest::addColumn<int>("stage");
        QTest::addColumn<bool>("photo");
        QTest::newRow("cascade") << int(VictoryStage::Cascade) << true;
        QTest::newRow("assembly") << int(VictoryStage::Assembling) << true;
        QTest::newRow("flip") << int(VictoryStage::Flipping) << true;
        QTest::newRow("mosaic") << int(VictoryStage::MosaicComplete) << true;
        QTest::newRow("cascade-only") << int(VictoryStage::CascadeComplete) << false;
    }

    void newGameCancelsEveryStage()
    {
        QFETCH(int, stage);
        QFETCH(bool, photo);
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        AnimationStyle style(true);
        MainWindow window(settings, 42);
        auto *board = window.gameBoard();
        board->setStyle(&style);
        if (photo) {
            // No disk source is needed for an explicitly supplied in-memory test image.
            board->setCardBackImage(syntheticImage());
            auto *collection = window.findChild<CardBackCollection *>();
            QVERIFY(collection);
            QVERIFY(collection->setMode(CardBackMode::SingleImage));
        }
        window.show();
        QVERIFY(QTest::qWaitForWindowActive(&window));
        win(*board);
        QTRY_COMPARE_WITH_TIMEOUT(int(board->victorySequence().stage()), stage, 7500);
        capture(*board, QStringLiteral("cancel-stage-%1").arg(stage));
        const auto oldGeneration = board->victorySequence().generation();
        QTest::keySequence(board, window.findChild<QAction *>(QStringLiteral("newGameAction"))->shortcut());
        QTRY_COMPARE(board->victorySequence().stage(), VictoryStage::Inactive);
        QVERIFY(board->victorySequence().generation() > oldGeneration);
        QVERIFY(!board->victorySequence().animating());
        QVERIFY(board->victorySequence().cards().empty());
        QVERIFY(board->victorySequence().image().isNull());
        QVERIFY(board->victorySequence().mosaic().sources.empty());
        const auto newState = board->gameState();
        QTest::qWait(70);
        QVERIFY(board->gameState() == newState);
        QCOMPARE(board->victorySequence().stage(), VictoryStage::Inactive);
        QVERIFY(!board->selection());
        QVERIFY(!board->drag());
        QVERIFY(!board->canUndo());
    }

    void cascadeAssemblesFlipsAndStopsWithResize()
    {
        AnimationStyle style(true);
        GameBoard board(42);
        board.setStyle(&style);
        board.setCardBackImage(victoryPicture());
        showKeyboardBoard(board);
        win(board);
        const auto completed = board.gameState();
        const auto image = board.victorySequence().image();
        const auto initial = board.victorySequence().cards().back().rectangle;
        QCOMPARE(board.victorySequence().cards().back().card.rank, Rank::King);
        QTest::qWait(250);
        QVERIFY(board.victorySequence().cards().back().rectangle != initial);
        capture(board, QStringLiteral("cascade"));
        board.resize(720, 480);
        QTRY_COMPARE_WITH_TIMEOUT(board.victorySequence().stage(), VictoryStage::Assembling, 4000);
        const auto assembly = board.victorySequence().cards().back().rectangle;
        QTest::qWait(450);
        QVERIFY(board.victorySequence().cards().back().rectangle != assembly);
        capture(board, QStringLiteral("assembly"));
        board.resize(1281, 803);
        QTRY_COMPARE_WITH_TIMEOUT(board.victorySequence().stage(), VictoryStage::Flipping, 2000);
        QTest::qWait(450);
        bool revealed = false;
        bool unrevealed = false;
        for (const auto &card : board.victorySequence().cards()) {
            revealed |= card.revealed;
            unrevealed |= !card.revealed;
        }
        QVERIFY(revealed && unrevealed);
        capture(board, QStringLiteral("flipping"));
        board.resize(761, 601);
        QTRY_COMPARE_WITH_TIMEOUT(board.victorySequence().stage(), VictoryStage::MosaicComplete, 2000);
        QVERIFY(!board.victorySequence().animating());
        capture(board, QStringLiteral("mosaic"));
        for (const auto size : {QSize(720, 480), QSize(1920, 1080), QSize(761, 603)}) {
            board.resize(size);
            QCoreApplication::processEvents();
            const auto &sequence = board.victorySequence();
            for (std::size_t index = 0; index < sequence.cards().size(); ++index) {
                QCOMPARE(sequence.cards()[index].rectangle, sequence.mosaic().destinations[index]);
                QVERIFY(QRectF(board.rect()).contains(sequence.cards()[index].rectangle));
                QVERIFY(sequence.cards()[index].revealed);
                QCOMPARE(sequence.cards()[index].horizontalScale, 1.0);
            }
        }
        QSignalSpy frames(&board.victorySequence(), &VictorySequence::frameChanged);
        QTest::qWait(80);
        QCOMPARE(frames.count(), 0);
        QCOMPARE(board.victorySequence().image(), image);
        QVERIFY(board.gameState() == completed);
    }

    void reducedMotionRevealsImmediatelyAndRendersCorrectTiles()
    {
        AnimationStyle style(false);
        GameBoard board(42);
        board.setStyle(&style);
        const auto source = syntheticImage({900, 600});
        board.setCardBackImage(source);
        showKeyboardBoard(board);
        win(board);
        QCOMPARE(board.victorySequence().stage(), VictoryStage::MosaicComplete);
        QVERIFY(!board.victorySequence().animating());
        QImage rendered(board.size(), QImage::Format_RGB32);
        board.render(&rendered);
        const auto &layout = board.victorySequence().mosaic();
        for (std::size_t index = 0; index < layout.destinations.size(); ++index) {
            QCOMPARE(rendered.pixelColor(layout.destinations[index].center().toPoint()),
                     source.pixelColor(layout.sources[index].center().toPoint()));
        }
        board.newGame();
        board.setCardBackImage({});
        win(board);
        QCOMPARE(board.victorySequence().stage(), VictoryStage::CascadeComplete);
        QVERIFY(!board.victorySequence().animating());
    }

    void replacementAndDestructionInvalidateTimers()
    {
        AnimationStyle style(true);
        auto *board = new GameBoard(42);
        board->setStyle(&style);
        showKeyboardBoard(*board);
        win(*board);
        const auto generation = board->victorySequence().generation();
        auto invalid = board->gameState();
        invalid.status = GameStatus::Playing;
        QVERIFY(!board->loadState(invalid));
        QCOMPARE(board->victorySequence().generation(), generation);
        Game fresh(123);
        QVERIFY(board->loadState(fresh.state()));
        QVERIFY(!board->victorySequence().active());
        QTest::qWait(50);
        QVERIFY(board->gameState() == fresh.state());
        win(*board);
        QPointer<const VictorySequence> pointer(&board->victorySequence());
        delete board;
        QVERIFY(pointer.isNull());
        QTest::qWait(50);
    }

    void closingWindowDuringCascadeKeepsShutdownSafe()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        AnimationStyle style(true);
        auto *window = new MainWindow(settings, 42);
        auto *board = window->gameBoard();
        board->setStyle(&style);
        window->show();
        QVERIFY(QTest::qWaitForWindowActive(window));
        win(*board);
        QPointer<const VictorySequence> pointer(&board->victorySequence());
        window->close();
        QVERIFY(!window->isVisible());
        delete window;
        QVERIFY(pointer.isNull());
        QTest::qWait(50);
    }

    void rapidNewGamesLeaveNoFramesOrStateFromPreviousGames()
    {
        AnimationStyle style(true);
        GameBoard board(42);
        board.setStyle(&style);
        board.setCardBackImage(victoryPicture());
        showKeyboardBoard(board);
        QSignalSpy frames(&board.victorySequence(), &VictorySequence::frameChanged);
        for (int repeat = 0; repeat < 12; ++repeat) {
            win(board);
            QCOMPARE(board.victorySequence().stage(), VictoryStage::Cascade);
            board.newGame();
            QCOMPARE(board.victorySequence().stage(), VictoryStage::Inactive);
            QVERIFY(board.victorySequence().cards().empty());
        }
        frames.clear();
        const auto fresh = board.gameState();
        QTest::qWait(100);
        QCOMPARE(frames.count(), 0);
        QVERIFY(board.gameState() == fresh);
    }
};

QTEST_MAIN(VictorySequenceTest)
#include "VictorySequenceTest.moc"
