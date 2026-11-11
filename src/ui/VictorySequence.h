#pragma once

#include "BoardLayout.h"

#include <QElapsedTimer>
#include <QImage>
#include <QObject>
#include <QTimer>

#include <functional>
#include <vector>

class QPainter;

namespace cardsy::ui {

enum class VictoryStage { Inactive, Cascade, Assembling, Flipping, MosaicComplete, CascadeComplete };

struct MosaicLayout {
    std::size_t columns = 0;
    std::size_t rows = 0;
    QRectF bounds;
    QRectF sourceCrop;
    std::vector<QRectF> destinations;
    std::vector<QRectF> sources;
};

MosaicLayout calculateMosaicLayout(std::size_t count, QRectF available, QSizeF imageSize);
void paintMosaicTile(QPainter &painter, QRectF destination, const QImage &image, QRectF source);

struct VictoryCard {
    Card card;
    QRectF origin;
    QRectF rectangle;
    QRectF assemblyOrigin;
    qreal rotation = 0;
    qreal assemblyRotation = 0;
    qreal horizontalScale = 1;
    bool revealed = false;
};

class VictorySequence : public QObject
{
    Q_OBJECT

public:
    explicit VictorySequence(QObject *parent = nullptr);
    ~VictorySequence() override;
    void start(std::vector<VictoryCard> cards, QImage image, QRectF available,
               bool reducedMotion, std::function<bool()> stillCurrent);
    void cancel();
    void resize(QRectF available);
    VictoryStage stage() const { return stage_; }
    bool active() const { return stage_ != VictoryStage::Inactive; }
    bool animating() const { return timer_.isActive(); }
    quint64 generation() const { return generation_; }
    const std::vector<VictoryCard> &cards() const { return cards_; }
    const QImage &image() const { return image_; }
    const MosaicLayout &mosaic() const { return mosaic_; }

signals:
    void frameChanged();

private:
    QTimer timer_;
    QElapsedTimer clock_;
    QMetaObject::Connection frameConnection_;
    quint64 generation_ = 0;
    VictoryStage stage_ = VictoryStage::Inactive;
    std::vector<VictoryCard> cards_;
    QImage image_;
    QRectF available_;
    MosaicLayout mosaic_;
    bool reducedMotion_ = false;
    std::function<bool()> stillCurrent_;

    void advance(qint64 elapsed);
    void cascade(qreal seconds);
    void settle();
};

}
