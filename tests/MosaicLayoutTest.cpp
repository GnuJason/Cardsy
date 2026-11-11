#include "ImageTestSupport.h"
#include "ui/VictorySequence.h"

#include <QPainter>
#include <QTest>

#include <cmath>
#include <set>

using namespace cardsy::ui;
using namespace cardsy::ui::test;

class MosaicLayoutTest : public QObject
{
    Q_OBJECT

private slots:
    void geometry_data()
    {
        QTest::addColumn<QSize>("board");
        QTest::addColumn<QSize>("image");
        QTest::addColumn<int>("count");
        for (const auto board : {QSize(688, 448), QSize(1920, 1080), QSize(713, 557),
                                 QSize(300, 900), QSize(1, 1)}) {
            for (const auto image : {QSize(600, 840), QSize(1200, 600), QSize(51, 51)}) {
                for (const int count : {1, 7, 48, 52}) {
                    QTest::newRow(qPrintable(QStringLiteral("%1x%2-%3x%4-%5")
                        .arg(board.width()).arg(board.height())
                        .arg(image.width()).arg(image.height()).arg(count))) << board << image << count;
                }
            }
        }
    }

    void geometry()
    {
        QFETCH(QSize, board);
        QFETCH(QSize, image);
        QFETCH(int, count);
        const QRectF available(QPointF(16, 16), board);
        const auto layout = calculateMosaicLayout(count, available, image);
        QCOMPARE(layout.destinations.size(), std::size_t(count));
        QCOMPARE(layout.sources.size(), std::size_t(count));
        QCOMPARE(layout.rows * layout.columns, std::size_t(count));
        QVERIFY(available.adjusted(-0.001, -0.001, 0.001, 0.001).contains(layout.bounds));
        QVERIFY(QLineF(available.center(), layout.bounds.center()).length() < 0.001);
        QVERIFY(QRectF(QPointF(0, 0), image).adjusted(-0.001, -0.001, 0.001, 0.001)
                    .contains(layout.sourceCrop));
        std::set<std::pair<qreal, qreal>> positions;
        qreal area = 0;
        for (std::size_t index = 0; index < layout.destinations.size(); ++index) {
            const auto tile = layout.destinations[index];
            const auto source = layout.sources[index];
            QVERIFY(tile.width() > 0 && tile.height() > 0);
            QVERIFY(layout.bounds.adjusted(-0.001, -0.001, 0.001, 0.001).contains(tile));
            QVERIFY(layout.sourceCrop.adjusted(-0.001, -0.001, 0.001, 0.001).contains(source));
            QVERIFY(std::abs(tile.height() / tile.width() - 1.4) < 0.001);
            positions.emplace(tile.x(), tile.y());
            area += source.width() * source.height();
            if (index % layout.columns + 1 < layout.columns) {
                QCOMPARE(source.right(), layout.sources[index + 1].left());
                QCOMPARE(tile.right(), layout.destinations[index + 1].left());
            }
            if (index + layout.columns < layout.destinations.size()) {
                QCOMPARE(source.bottom(), layout.sources[index + layout.columns].top());
                QCOMPARE(tile.bottom(), layout.destinations[index + layout.columns].top());
            }
        }
        QCOMPARE(positions.size(), std::size_t(count));
        QVERIFY(std::abs(area - layout.sourceCrop.width() * layout.sourceCrop.height()) < 0.01);
    }

    void tilesReconstructOnePictureRatherThanRepeatedCopies()
    {
        QImage source(601, 839, QImage::Format_RGB32);
        for (int y = 0; y < source.height(); ++y) {
            for (int x = 0; x < source.width(); ++x) {
                source.setPixelColor(x, y, QColor(x * 255 / source.width(), y * 255 / source.height(),
                                                 (x / 20 + y / 20) % 2 ? 40 : 200));
            }
        }
        const auto layout = calculateMosaicLayout(52, QRectF(16, 16, 969, 687), source.size());
        QImage mosaic(1001, 719, QImage::Format_RGB32);
        mosaic.fill(Qt::black);
        QImage reference = mosaic;
        {
            QPainter painter(&mosaic);
            painter.setRenderHint(QPainter::Antialiasing);
            for (std::size_t index = 0; index < layout.sources.size(); ++index) {
                paintMosaicTile(painter, layout.destinations[index], source, layout.sources[index]);
            }
        }
        {
            QPainter painter(&reference);
            painter.setRenderHint(QPainter::SmoothPixmapTransform);
            painter.drawImage(layout.bounds, source, layout.sourceCrop);
        }
        for (const auto &tile : layout.destinations) {
            const auto center = tile.center().toPoint();
            const auto actual = mosaic.pixelColor(center);
            const auto expected = reference.pixelColor(center);
            QVERIFY(std::abs(actual.red() - expected.red()) <= 2);
            QVERIFY(std::abs(actual.green() - expected.green()) <= 2);
            QVERIFY(std::abs(actual.blue() - expected.blue()) <= 2);
        }
        QVERIFY(mosaic.pixelColor(layout.destinations.front().center().toPoint())
                != mosaic.pixelColor(layout.destinations.back().center().toPoint()));
    }

    void invalidBoundsHaveNoTiles()
    {
        QVERIFY(calculateMosaicLayout(0, QRectF(0, 0, 50, 50), {600, 840}).sources.empty());
        QVERIFY(calculateMosaicLayout(52, QRectF(), {600, 840}).sources.empty());
        QVERIFY(calculateMosaicLayout(52, QRectF(0, 0, 50, 50), {}).sources.empty());
    }
};

QTEST_MAIN(MosaicLayoutTest)
#include "MosaicLayoutTest.moc"
