#include "BoardTestSupport.h"
#include "ImageTestSupport.h"
#include "ui/CardBackSettings.h"
#include "ui/GameBoard.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QApplication>
#include <QFileDialog>
#include <QFocusEvent>
#include <QMouseEvent>
#include <QScrollArea>
#include <QScrollBar>
#include <QSignalSpy>
#include <QTemporaryDir>
#include <QTest>
#include <QTimer>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class DragInteractionTest : public QObject
{
    Q_OBJECT

    struct MoveCase {
        GameState state;
        PileType source = PileType::Tableau;
        std::size_t sourcePile = 0;
        std::size_t sourceCard = 1;
        PileType target = PileType::Tableau;
        std::size_t targetPile = 1;
        std::size_t count = 1;
        Move move = TableauToTableau{0, 1, 1};
    };

    static void show(GameBoard &board, QSize size = {1000, 700})
    {
        board.resize(size);
        board.show();
        QCoreApplication::processEvents();
    }

    static void movePointer(GameBoard &board, QPointF position,
                            Qt::MouseButtons buttons = Qt::LeftButton)
    {
        QMouseEvent event(QEvent::MouseMove, position, board.mapToGlobal(position.toPoint()),
                          Qt::NoButton, buttons, Qt::NoModifier);
        QApplication::sendEvent(&board, &event);
    }

    static QPoint press(GameBoard &board, const BoardElement &element)
    {
        const auto point = exposedPoint(board.boardLayout(), element);
        QTest::mousePress(&board, Qt::LeftButton, Qt::NoModifier, point);
        return point;
    }

    static void startDrag(GameBoard &board, const BoardElement &element)
    {
        const auto point = press(board, element);
        movePointer(board, point + QPoint(QApplication::startDragDistance() + 2, 0));
    }

    static void drop(GameBoard &board, QPoint point)
    {
        movePointer(board, point);
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, point);
    }

    static MoveCase moveCase(int kind)
    {
        MoveCase result;
        auto &state = result.state;
        state.config = {DrawCount::Three, false};
        const auto hidden = cardsy::test::card(Suit::Diamonds, Rank::Two, false);
        state.tableau[0] = {hidden, cardsy::test::card(Suit::Hearts, Rank::Six)};
        state.tableau[1] = {cardsy::test::card(Suit::Clubs, Rank::Seven)};
        switch (kind) {
        case 0:
            break;
        case 1:
            state.tableau[0].push_back(cardsy::test::card(Suit::Spades, Rank::Five));
            result.count = 2;
            break;
        case 2:
            state.tableau[0] = {
                hidden, cardsy::test::card(Suit::Hearts, Rank::King),
                cardsy::test::card(Suit::Clubs, Rank::Queen)};
            state.tableau[1].clear();
            result.count = 2;
            break;
        case 3:
            state.tableau[0] = {hidden, cardsy::test::card(Suit::Hearts, Rank::Ace)};
            result.target = PileType::Foundation;
            result.targetPile = 2;
            result.move = TableauToFoundation{0, 2};
            break;
        case 4:
            state.tableau[0].clear();
            state.waste = {
                cardsy::test::card(Suit::Spades, Rank::Ace),
                cardsy::test::card(Suit::Hearts, Rank::Six)};
            result.source = PileType::Waste;
            result.move = WasteToTableau{1};
            break;
        case 5:
            state.tableau[0].clear();
            state.waste = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            result.source = PileType::Waste;
            result.target = PileType::Foundation;
            result.targetPile = 2;
            result.move = WasteToFoundation{2};
            break;
        case 6:
            state.tableau[0].clear();
            state.foundations[2] = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            state.tableau[1] = {cardsy::test::card(Suit::Clubs, Rank::Two)};
            result.source = PileType::Foundation;
            result.sourcePile = 2;
            result.move = FoundationToTableau{2, 1};
            break;
        case 7:
            state.tableau[0] = {cardsy::test::card(Suit::Hearts, Rank::Two)};
            state.foundations[2] = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            result.sourceCard = 0;
            result.target = PileType::Foundation;
            result.targetPile = 2;
            result.move = TableauToFoundation{0, 2};
            break;
        }
        cardsy::test::fillRemainingStock(state);
        return result;
    }

private slots:
    void initTestCase()
    {
        QApplication::setAttribute(Qt::AA_DontUseNativeDialogs);
    }

    void clickBelowThresholdRemainsClick_data()
    {
        QTest::addColumn<bool>("jitter");
        QTest::newRow("stationary") << false;
        QTest::newRow("just-below-native-threshold") << true;
    }

    void clickBelowThresholdRemainsClick()
    {
        QFETCH(bool, jitter);
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        const auto source = cardElement(board.boardLayout(), PileType::Tableau, 0, 1);
        const auto position = press(board, source);
        QVERIFY(board.drag());
        QVERIFY(!board.drag()->active);
        QVERIFY(!board.selection());
        QVERIFY(board.gameState() == state);
        const auto distance = jitter ? std::max(0, QApplication::startDragDistance() - 1) : 0;
        movePointer(board, position + QPoint(distance, 0));
        QVERIFY(!board.drag()->active);
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, position + QPoint(distance, 0));
        QVERIFY(!board.drag());
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardId, state.tableau[0][1].id());
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }

    void nativeThresholdStartsPreviewWithoutEngineMutation()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        const auto source = cardElement(board.boardLayout(), PileType::Tableau, 0, 1);
        movePointer(board, exposedPoint(board.boardLayout(), source), Qt::NoButton);
        QCOMPARE(board.cursor().shape(), Qt::OpenHandCursor);
        const auto position = press(board, source);
        movePointer(board, position + QPoint(QApplication::startDragDistance(), 0));
        QVERIFY(board.drag() && board.drag()->active);
        QCOMPARE(board.drag()->sequenceLength, std::size_t{2});
        QCOMPARE(board.drag()->source.cardId, state.tableau[0][1].id());
        QCOMPARE(board.cursor().shape(), Qt::ClosedHandCursor);
        QVERIFY(board.gameState() == state);
        const auto target = topElement(board.boardLayout(), PileType::Tableau, 2);
        movePointer(board, target.rectangle.center());
        QVERIFY(board.drag()->target);
        QCOMPARE(board.drag()->target->pileIndex, std::size_t{2});
        QVERIFY(board.gameState() == state);
        QCOMPARE(changed.count(), 0);
        drop(board, {-20, -20});
        QVERIFY(board.gameState() == state);
    }

    void everySupportedMoveCommitsOnceAndUndoRestoresExactly_data()
    {
        QTest::addColumn<int>("kind");
        QTest::newRow("tableau-card") << 0;
        QTest::newRow("tableau-sequence") << 1;
        QTest::newRow("king-sequence-empty-tableau") << 2;
        QTest::newRow("tableau-foundation") << 3;
        QTest::newRow("waste-tableau") << 4;
        QTest::newRow("waste-foundation") << 5;
        QTest::newRow("foundation-tableau") << 6;
        QTest::newRow("occupied-foundation") << 7;
    }

    void everySupportedMoveCommitsOnceAndUndoRestoresExactly()
    {
        QFETCH(int, kind);
        const auto fixture = moveCase(kind);
        QVERIFY(validate(fixture.state).empty());
        GameBoard board(42);
        QVERIFY(board.loadState(fixture.state));
        show(board);
        Game expected(42);
        QVERIFY(expected.loadState(fixture.state));
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        const auto layout = board.boardLayout();
        const auto source = fixture.source == PileType::Tableau
            ? cardElement(layout, fixture.source, fixture.sourcePile, fixture.sourceCard)
            : topElement(layout, fixture.source, fixture.sourcePile);
        startDrag(board, source);
        QVERIFY(board.drag() && board.drag()->active);
        QCOMPARE(board.drag()->sequenceLength, fixture.count);
        QVERIFY(board.gameState() == fixture.state);
        QVERIFY(!board.canUndo());
        const auto destination = topElement(layout, fixture.target, fixture.targetPile);
        movePointer(board, exposedPoint(layout, destination));
        QVERIFY(board.drag()->target);
        QVERIFY(board.gameState() == fixture.state);
        QCOMPARE(changed.count(), 0);
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, destination));
        QVERIFY(expected.apply(fixture.move));
        QVERIFY(board.gameState() == expected.state());
        QCOMPARE(changed.count(), 1);
        QVERIFY(!board.drag());
        QVERIFY(!board.selection());
        QVERIFY(board.canUndo());
        QVERIFY(validate(board.gameState()).empty());
        board.undo();
        QVERIFY(board.gameState() == fixture.state);
        QVERIFY(!board.drag());
        QVERIFY(!board.canUndo());
    }

    void inaccessibleSourcesNeverStartDrag_data()
    {
        QTest::addColumn<int>("kind");
        QTest::newRow("stock-is-click-only") << 0;
        QTest::newRow("face-down-tableau") << 1;
        QTest::newRow("empty-tableau") << 2;
        QTest::newRow("empty-foundation") << 3;
        QTest::newRow("empty-waste") << 4;
    }

    void inaccessibleSourcesNeverStartDrag()
    {
        QFETCH(int, kind);
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        const auto layout = board.boardLayout();
        const auto source = kind == 0 ? topElement(layout, PileType::Stock)
            : kind == 1 ? cardElement(layout, PileType::Tableau, 0, 0)
            : kind == 2 ? topElement(layout, PileType::Tableau, 6)
            : kind == 3 ? topElement(layout, PileType::Foundation)
                        : topElement(layout, PileType::Waste);
        const auto point = press(board, source);
        QVERIFY(!board.drag());
        movePointer(board, point + QPoint(QApplication::startDragDistance() + 2, 0));
        QVERIFY(!board.drag());
        drop(board, topElement(layout, PileType::Tableau, 1).rectangle.center().toPoint());
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }

    void wasteAndFoundationExposeOnlyTheirTop()
    {
        GameState state;
        state.waste = {
            cardsy::test::card(Suit::Spades, Rank::Ace),
            cardsy::test::card(Suit::Clubs, Rank::Queen)};
        state.foundations[2] = {
            cardsy::test::card(Suit::Hearts, Rank::Ace),
            cardsy::test::card(Suit::Hearts, Rank::Two)};
        cardsy::test::fillRemainingStock(state);
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        show(board);
        startDrag(board, topElement(board.boardLayout(), PileType::Waste));
        QCOMPARE(board.drag()->source.cardId, state.waste.back().id());
        QCOMPARE(board.drag()->source.cardIndex, std::size_t{1});
        QCOMPARE(board.drag()->sequenceLength, std::size_t{1});
        drop(board, {0, 0});
        startDrag(board, topElement(board.boardLayout(), PileType::Foundation, 2));
        QCOMPARE(board.drag()->source.cardId, state.foundations[2].back().id());
        QCOMPARE(board.drag()->source.cardIndex, std::size_t{1});
        QCOMPARE(board.drag()->sequenceLength, std::size_t{1});
        drop(board, {0, 0});
        QVERIFY(board.gameState() == state);
    }

    void invalidAndCanceledGesturesPreserveStateAndHistory_data()
    {
        QTest::addColumn<int>("destination");
        QTest::newRow("illegal-tableau") << 0;
        QTest::newRow("illegal-foundation") << 1;
        QTest::newRow("blank") << 2;
        QTest::newRow("outside-board") << 3;
        QTest::newRow("stock") << 4;
        QTest::newRow("waste") << 5;
        QTest::newRow("own-source") << 6;
        QTest::newRow("between-piles") << 7;
    }

    void invalidAndCanceledGesturesPreserveStateAndHistory()
    {
        QFETCH(int, destination);
        auto state = tableauFixture();
        if (destination == 1) {
            state = {};
            state.tableau[0] = {cardsy::test::card(Suit::Hearts, Rank::Ace)};
            cardsy::test::fillRemainingStock(state);
        }
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        show(board);
        auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Stock)));
        const auto before = board.gameState();
        layout = board.boardLayout();
        const auto source = destination == 1 ? topElement(layout, PileType::Tableau)
            : cardElement(layout, PileType::Tableau, 0, 1);
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, source));
        const auto selection = board.selection();
        QVERIFY(selection);
        const auto selectedId = selection->cardId;
        QPoint target;
        switch (destination) {
        case 0: target = topElement(layout, PileType::Tableau, 2).rectangle.center().toPoint(); break;
        case 1: target = topElement(layout, PileType::Foundation).rectangle.center().toPoint(); break;
        case 2: target = {0, 0}; break;
        case 3: target = {-30, 20}; break;
        case 4: target = topElement(layout, PileType::Stock).rectangle.center().toPoint(); break;
        case 5: target = topElement(layout, PileType::Waste).rectangle.center().toPoint(); break;
        case 6: target = exposedPoint(layout, source); break;
        case 7: {
            const auto stock = topElement(layout, PileType::Stock).rectangle;
            const auto waste = topElement(layout, PileType::Waste).rectangle;
            target = QPointF((stock.right() + waste.left()) / 2, stock.center().y()).toPoint();
            break;
        }
        }
        QSignalSpy changed(&board, &GameBoard::stateChanged);
        startDrag(board, source);
        QVERIFY(board.drag() && board.drag()->active);
        drop(board, target);
        QVERIFY(!board.drag());
        QVERIFY(board.gameState() == before);
        QCOMPARE(changed.count(), 0);
        QVERIFY(board.selection());
        QCOMPARE(board.selection()->cardId, selectedId);
        QVERIFY(board.canUndo());
        board.undo();
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }

    void canceledUnselectedSourceKeepsPreviousDifferentSelection()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        const auto layout = board.boardLayout();
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier,
                          exposedPoint(layout, topElement(layout, PileType::Tableau, 1)));
        const auto previous = board.selection()->cardId;
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        QCOMPARE(board.drag()->source.cardId, state.tableau[0][1].id());
        drop(board, {0, 0});
        QCOMPARE(board.selection()->cardId, previous);
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }

    void successfulUnselectedDragClearsPreviousSelection()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        const auto layout = board.boardLayout();
        const auto target = topElement(layout, PileType::Tableau, 1);
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, target));
        QVERIFY(board.selection());
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        drop(board, exposedPoint(layout, target));
        QVERIFY(!board.selection());
        QVERIFY(!board.drag());
        QCOMPARE(board.gameState().tableau[1].size(), std::size_t{3});
        board.undo();
        QVERIFY(board.gameState() == state);
    }

    void previewFollowsPointerAndRestoresGhostedSource()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        const auto layout = board.boardLayout();
        const auto source = cardElement(layout, PileType::Tableau, 0, 1);
        const auto sourceSample = QPointF(source.rectangle.right() - 15,
                                          source.rectangle.top() + 15).toPoint();
        const auto render = [&board] {
            QImage image(board.size(), QImage::Format_RGB32);
            board.render(&image);
            return image;
        };
        const auto before = render();
        startDrag(board, source);
        movePointer(board, {750, 420});
        const auto firstTop = board.drag()->position - board.drag()->pointerOffset;
        const auto floatingSample = (firstTop + QPointF(layout.cardSize.width() - 15, 15)).toPoint();
        const auto during = render();
        QVERIFY(during.pixelColor(sourceSample).red() < before.pixelColor(sourceSample).red());
        QVERIFY(during.pixelColor(floatingSample).red() > 220);
        movePointer(board, {500, 500});
        const auto second = render();
        QVERIFY(second.pixelColor(floatingSample).red() < 200);
        const auto nextTop = board.drag()->position - board.drag()->pointerOffset;
        QVERIFY(second.pixelColor((nextTop + QPointF(layout.cardSize.width() - 15, 15)).toPoint()).red() > 220);
        QCOMPARE(board.drag()->sequenceLength, std::size_t{2});
        QVERIFY(board.gameState() == state);
        drop(board, {0, 0});
        const auto restored = render();
        QCOMPARE(restored.pixel(sourceSample), before.pixel(sourceSample));
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }

    void stateReplacementCancelsWithoutAcceptingMalformedSequence()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        auto layout = board.boardLayout();
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        auto malformed = state;
        malformed.tableau[0][2].suit = Suit::Diamonds;
        QCOMPARE(board.loadState(malformed).error, GameError::InvalidState);
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.drag());
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        Game replacement(123);
        QVERIFY(board.loadState(replacement.state()));
        QVERIFY(!board.drag());
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        QVERIFY(board.gameState() == replacement.state());
        QVERIFY(!board.canUndo());
    }

    void escapeCancelsAndReleaseCannotReviveDrag()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        const auto layout = board.boardLayout();
        const auto source = cardElement(layout, PileType::Tableau, 0, 1);
        QTest::mouseClick(&board, Qt::LeftButton, Qt::NoModifier, exposedPoint(layout, source));
        startDrag(board, source);
        QTest::keyClick(&board, Qt::Key_Escape);
        QVERIFY(!board.drag());
        QVERIFY(!board.selection());
        drop(board, topElement(layout, PileType::Tableau, 1).rectangle.center().toPoint());
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.canUndo());
    }

    void resizeCancelsAndFreshGeometryStillWorks_data()
    {
        QTest::addColumn<QSize>("size");
        QTest::newRow("minimum") << QSize(720, 480);
        QTest::newRow("normal") << QSize(1000, 700);
        QTest::newRow("large") << QSize(1440, 1000);
    }

    void resizeCancelsAndFreshGeometryStillWorks()
    {
        QFETCH(QSize, size);
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board, size);
        auto layout = board.boardLayout();
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        QVERIFY(board.drag()->active);
        board.resize(size + QSize(100, 100));
        QVERIFY(!board.drag());
        QVERIFY(board.gameState() == state);
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        layout = board.boardLayout();
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        drop(board, topElement(layout, PileType::Tableau, 1).rectangle.center().toPoint());
        QCOMPARE(board.gameState().tableau[1].size(), std::size_t{3});
        QVERIFY(validate(board.gameState()).empty());
        board.undo();
        QVERIFY(board.gameState() == state);
    }

    void deepScrollingUsesCurrentWidgetCoordinates()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        MainWindow window(settings, 42);
        window.resize(760, 600);
        auto *board = window.gameBoard();
        const auto state = deepFixture();
        QVERIFY(board->loadState(state));
        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        auto *scroll = window.findChild<QScrollArea *>(QStringLiteral("boardScrollArea"));
        QVERIFY(scroll);
        QTRY_VERIFY(scroll->verticalScrollBar()->maximum() > 0);
        const auto source = topElement(board->boardLayout(), PileType::Tableau);
        const auto point = exposedPoint(board->boardLayout(), source);
        scroll->ensureVisible(point.x(), point.y(), 10, 10);
        QCoreApplication::processEvents();
        QVERIFY(scroll->viewport()->rect().contains(board->mapTo(scroll->viewport(), point)));
        startDrag(*board, source);
        QVERIFY(board->drag() && board->drag()->active);
        scroll->verticalScrollBar()->setValue(0);
        QCoreApplication::processEvents();
        QVERIFY(board->drag() && board->drag()->active);
        QVERIFY(board->gameState() == state);
        const auto destination = topElement(board->boardLayout(), PileType::Foundation, 2);
        const auto target = destination.rectangle.center().toPoint();
        QVERIFY(scroll->viewport()->rect().contains(board->mapTo(scroll->viewport(), target)));
        drop(*board, target);
        QCOMPARE(board->gameState().foundations[2].back().rank, Rank::Ace);
        QVERIFY(validate(board->gameState()).empty());
        board->undo();
        QVERIFY(board->gameState() == state);
    }

    void existingPersonalizationSurvivesDragAndNewGame()
    {
        QTemporaryDir directory;
        const auto original = directory.filePath(QStringLiteral("synthetic.png"));
        QImage solid({100, 140}, QImage::Format_RGB32);
        solid.fill(QColor(210, 30, 190));
        const auto originalBytes = encodeImage(solid);
        writeBytes(original, originalBytes);
        CardBackSettings settings(directory.filePath(QStringLiteral("private")));
        MainWindow window(settings, 42);
        auto *board = window.gameBoard();
        const auto state = tableauFixture();
        QVERIFY(board->loadState(state));
        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        QImage defaultBefore(board->size(), QImage::Format_RGB32);
        board->render(&defaultBefore);
        auto layout = board->boardLayout();
        const auto stock = exposedPoint(layout, topElement(layout, PileType::Stock));
        startDrag(*board, cardElement(layout, PileType::Tableau, 0, 1));
        movePointer(*board, {750, 420});
        QImage defaultDuring(board->size(), QImage::Format_RGB32);
        board->render(&defaultDuring);
        QCOMPARE(defaultDuring.pixel(stock), defaultBefore.pixel(stock));
        drop(*board, {0, 0});
        QVERIFY(window.installCardBack(original));
        const auto cached = board->cardBackImage();
        const auto persisted = readBytes(settings.managedPath());
        QSignalSpy customization(&settings, &CardBackSettings::changed);
        startDrag(*board, cardElement(layout, PileType::Tableau, 0, 1));
        movePointer(*board, {750, 420});
        QVERIFY(board->drag() && board->drag()->active);
        QImage customDuring(board->size() * 2, QImage::Format_RGB32);
        customDuring.setDevicePixelRatio(2);
        board->render(&customDuring);
        QCOMPARE(customDuring.pixelColor(stock * 2), QColor(210, 30, 190));
        const auto hidden = exposedPoint(layout, cardElement(layout, PileType::Tableau, 0, 0));
        QCOMPARE(customDuring.pixelColor(hidden * 2), QColor(210, 30, 190));
        QVERIFY(board->gameState() == state);
        window.findChild<QAction *>(QStringLiteral("newGameAction"))->trigger();
        QVERIFY(!board->drag());
        QVERIFY(!board->selection());
        QVERIFY(!board->canUndo());
        QCOMPARE(board->gameState().stock.size(), std::size_t{24});
        QVERIFY(board->cardBackImage() == cached);
        QCOMPARE(readBytes(settings.managedPath()), persisted);
        QCOMPARE(readBytes(original), originalBytes);
        QCOMPARE(customization.count(), 0);
        QTest::mouseRelease(board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        QVERIFY(!board->canUndo());
    }

    void keyboardActionsCancelWithoutStaleDrop()
    {
        QTemporaryDir directory;
        CardBackSettings settings(directory.path());
        MainWindow window(settings, 42);
        auto *board = window.gameBoard();
        const auto state = tableauFixture();
        QVERIFY(board->loadState(state));
        window.show();
        QVERIFY(QTest::qWaitForWindowActive(&window));
        auto layout = board->boardLayout();
        auto source = cardElement(layout, PileType::Tableau, 0, 1);
        startDrag(*board, source);
        drop(*board, topElement(layout, PileType::Tableau, 1).rectangle.center().toPoint());
        layout = board->boardLayout();
        startDrag(*board, topElement(layout, PileType::Tableau, 1));
        QTest::keySequence(board, window.findChild<QAction *>(QStringLiteral("undoAction"))->shortcut());
        QTRY_VERIFY(board->gameState() == state);
        QVERIFY(!board->drag());
        QTest::mouseRelease(board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        layout = board->boardLayout();
        startDrag(*board, cardElement(layout, PileType::Tableau, 0, 1));
        QTest::keySequence(board, window.findChild<QAction *>(QStringLiteral("newGameAction"))->shortcut());
        QTRY_VERIFY(!board->drag());
        QVERIFY(!board->canUndo());
        const auto fresh = board->gameState();
        layout = board->boardLayout();
        QTest::mouseRelease(board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        startDrag(*board, topElement(layout, PileType::Tableau));
        QTimer timer;
        connect(&timer, &QTimer::timeout, &window, [&] {
            if (auto *dialog = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                timer.stop();
                dialog->reject();
            }
        });
        timer.start(10);
        window.findChild<QAction *>(QStringLiteral("choosePhotoAction"))->trigger();
        timer.stop();
        QVERIFY(!board->drag());
        QVERIFY(board->gameState() == fresh);
        QTest::mouseRelease(board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        window.findChild<QAction *>(QStringLiteral("quitAction"))->trigger();
        QVERIFY(!window.isVisible());
    }

    void winningDragUsesNormalFeedback()
    {
        Game expected(42);
        QVERIFY(expected.loadState(cardsy::test::nearlyWon()));
        for (std::size_t suit = 0; suit < 3; ++suit) {
            QVERIFY(expected.apply(TableauToFoundation{suit, suit}));
        }
        const auto state = expected.state();
        GameBoard board(42);
        QVERIFY(board.loadState(state));
        show(board);
        auto layout = board.boardLayout();
        startDrag(board, topElement(layout, PileType::Tableau, 3));
        drop(board, topElement(layout, PileType::Foundation, 3).rectangle.center().toPoint());
        QVERIFY(expected.apply(TableauToFoundation{3, 3}));
        QVERIFY(board.gameState() == expected.state());
        QCOMPARE(board.gameState().status, GameStatus::Won);
        QVERIFY(board.feedback().contains(QStringLiteral("You won")));
        board.undo();
        QVERIFY(board.gameState() == state);
        QVERIFY(!board.drag());
    }

    void focusLossAndMissingButtonCancelSafely()
    {
        GameBoard board(42);
        const auto state = tableauFixture();
        QVERIFY(board.loadState(state));
        show(board);
        auto layout = board.boardLayout();
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        QFocusEvent lost(QEvent::FocusOut, Qt::ActiveWindowFocusReason);
        QApplication::sendEvent(&board, &lost);
        QVERIFY(!board.drag());
        QVERIFY(board.gameState() == state);
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        startDrag(board, cardElement(layout, PileType::Tableau, 0, 1));
        movePointer(board, {20, 20}, Qt::NoButton);
        QVERIFY(!board.drag());
        QVERIFY(board.gameState() == state);
        QTest::mouseRelease(&board, Qt::LeftButton, Qt::NoModifier, {10, 10});
        QVERIFY(!board.canUndo());
    }
};

QTEST_MAIN(DragInteractionTest)
#include "DragInteractionTest.moc"
