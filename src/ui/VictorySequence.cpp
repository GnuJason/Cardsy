#include "VictorySequence.h"

#include <QCoreApplication>
#include <QPainter>
#include <QPainterPath>

#include <algorithm>
#include <cmath>
#include <limits>

namespace cardsy::ui {
namespace {

constexpr qint64 CascadeDuration = 3200;
constexpr qint64 AssemblyDuration = 1500;
constexpr qint64 FlipDuration = 1300;

qreal progress(qreal time, qreal delay, qreal duration)
{
    return std::clamp((time - delay) / duration, qreal{0}, qreal{1});
}

QRectF interpolate(QRectF from, QRectF to, qreal amount)
{
    return {from.topLeft() + (to.topLeft() - from.topLeft()) * amount,
            from.size() + (to.size() - from.size()) * amount};
}

}

MosaicLayout calculateMosaicLayout(std::size_t count, QRectF available, QSizeF imageSize)
{
    MosaicLayout result;
    if (count == 0 || available.width() <= 0 || available.height() <= 0
        || imageSize.width() <= 0 || imageSize.height() <= 0) {
        return result;
    }
    qreal bestScore = -std::numeric_limits<qreal>::infinity();
    for (std::size_t columns = 1; columns <= count; ++columns) {
        if (count % columns != 0) {
            continue;
        }
        const auto rows = count / columns;
        const auto tileWidth = std::min(available.width() / columns,
                                        available.height() / (rows * 1.4));
        const QSizeF size(tileWidth * columns, tileWidth * 1.4 * rows);
        const auto aspect = size.width() / size.height();
        const auto imageAspect = imageSize.width() / imageSize.height();
        const auto retention = std::min(aspect / imageAspect, imageAspect / aspect);
        const auto score = size.width() * size.height() * std::pow(retention, 0.35);
        if (score > bestScore) {
            bestScore = score;
            result.columns = columns;
            result.rows = rows;
            result.bounds = QRectF(available.center() - QPointF(size.width(), size.height()) / 2, size);
        }
    }
    const auto scale = std::max(result.bounds.width() / imageSize.width(),
                                result.bounds.height() / imageSize.height());
    const QSizeF cropSize(result.bounds.width() / scale, result.bounds.height() / scale);
    result.sourceCrop = QRectF(QPointF((imageSize.width() - cropSize.width()) / 2,
                                       (imageSize.height() - cropSize.height()) / 2), cropSize);
    result.destinations.reserve(count);
    result.sources.reserve(count);
    for (std::size_t index = 0; index < count; ++index) {
        const auto column = index % result.columns;
        const auto row = index / result.columns;
        const auto region = [column, row, &result](QRectF bounds) {
            const auto left = bounds.left() + bounds.width() * column / result.columns;
            const auto right = bounds.left() + bounds.width() * (column + 1) / result.columns;
            const auto top = bounds.top() + bounds.height() * row / result.rows;
            const auto bottom = bounds.top() + bounds.height() * (row + 1) / result.rows;
            return QRectF(QPointF(left, top), QPointF(right, bottom));
        };
        result.destinations.push_back(region(result.bounds));
        result.sources.push_back(region(result.sourceCrop));
    }
    return result;
}

void paintMosaicTile(QPainter &painter, QRectF destination, const QImage &image, QRectF source)
{
    painter.save();
    QPainterPath clip;
    const auto radius = std::min(qreal{3}, destination.width() * 0.04);
    clip.addRoundedRect(destination, radius, radius);
    painter.setClipPath(clip, Qt::IntersectClip);
    painter.setRenderHint(QPainter::SmoothPixmapTransform);
    painter.drawImage(destination, image, source);
    painter.setBrush(Qt::NoBrush);
    painter.setPen(QPen(QColor(255, 253, 245, 100), 0.5));
    painter.drawRoundedRect(destination.adjusted(0.25, 0.25, -0.25, -0.25), radius, radius);
    painter.restore();
}

VictorySequence::VictorySequence(QObject *parent) : QObject(parent)
{
    timer_.setInterval(16);
    timer_.setTimerType(Qt::PreciseTimer);
    connect(qApp, &QCoreApplication::aboutToQuit, this, &VictorySequence::cancel);
}

VictorySequence::~VictorySequence()
{
    cancel();
}

void VictorySequence::cancel()
{
    ++generation_;
    timer_.stop();
    disconnect(frameConnection_);
    stillCurrent_ = {};
    stage_ = VictoryStage::Inactive;
    cards_.clear();
    image_ = {};
    mosaic_ = {};
}

void VictorySequence::start(std::vector<VictoryCard> cards, QImage image, QRectF available,
                            bool reducedMotion, std::function<bool()> stillCurrent)
{
    if (active()) {
        return;
    }
    cancel();
    if (cards.empty() || !stillCurrent || !stillCurrent()) {
        qWarning("Cardsy could not start the victory animation for the current game.");
        return;
    }
    cards_ = std::move(cards);
    image_ = std::move(image);
    reducedMotion_ = reducedMotion;
    stillCurrent_ = std::move(stillCurrent);
    stage_ = VictoryStage::Cascade;
    resize(available);
    clock_.start();
    if (stage_ == VictoryStage::CascadeComplete) {
        emit frameChanged();
        return;
    }
    if (reducedMotion_) {
        if (image_.isNull()) {
            cascade(CascadeDuration / 1000.0);
            stage_ = VictoryStage::CascadeComplete;
        } else {
            settle();
            stage_ = VictoryStage::MosaicComplete;
        }
        emit frameChanged();
        return;
    }
    const auto sequence = generation_;
    frameConnection_ = connect(&timer_, &QTimer::timeout, this, [this, sequence] {
        if (sequence != generation_) {
            return;
        }
        if (QCoreApplication::closingDown() || !stillCurrent_ || !stillCurrent_()) {
            cancel();
            emit frameChanged();
            return;
        }
        advance(clock_.elapsed());
        emit frameChanged();
    });
    timer_.start();
    emit frameChanged();
}

void VictorySequence::resize(QRectF available)
{
    available_ = available;
    if (!image_.isNull()) {
        mosaic_ = calculateMosaicLayout(cards_.size(), available_, image_.size());
        if (mosaic_.destinations.size() != cards_.size()) {
            qWarning("Cardsy cannot fit the victory picture; preserving the card cascade.");
            image_ = {};
            mosaic_ = {};
            for (auto &card : cards_) {
                card.revealed = false;
                card.horizontalScale = 1;
            }
            stage_ = VictoryStage::CascadeComplete;
            timer_.stop();
        } else if (stage_ == VictoryStage::MosaicComplete || stage_ == VictoryStage::Flipping) {
            for (std::size_t index = 0; index < cards_.size(); ++index) {
                cards_[index].rectangle = mosaic_.destinations[index];
            }
        }
    }
}

void VictorySequence::cascade(qreal seconds)
{
    const auto cardWidth = std::min(cards_.front().origin.width(), available_.width() / 7);
    const QSizeF cardSize(cardWidth, std::min(cardWidth * 1.4, available_.height()));
    const auto horizontalRange = std::max(qreal{1}, available_.width() - cardSize.width());
    const auto verticalRange = std::max(qreal{1}, available_.height() - cardSize.height());
    for (std::size_t index = 0; index < cards_.size(); ++index) {
        auto &card = cards_[index];
        const auto t = std::max(qreal{0}, seconds - (cards_.size() - index - 1) * 0.025);
        if (t == 0) {
            card.rectangle = card.origin;
            continue;
        }
        const auto velocity = (index % 2 ? -1 : 1) * (130.0 + (index * 37 % 140));
        const auto start = card.origin.left() - available_.left();
        const auto phase = std::fmod(std::abs(start + velocity * t), horizontalRange * 2);
        const auto x = phase <= horizontalRange ? phase : horizontalRange * 2 - phase;
        const auto flight = card.origin.top() - available_.top()
            - (120 + index % 80) * t + (210 + index % 7 * 12) * t * t;
        const auto verticalPhase = std::fmod(std::abs(flight), verticalRange * 2);
        const auto y = verticalPhase <= verticalRange
            ? verticalPhase : verticalRange * 2 - verticalPhase;
        card.rectangle = QRectF(available_.topLeft() + QPointF(x, y), cardSize);
        card.rotation = std::sin(t * 2 + index) * 9;
    }
}

void VictorySequence::settle()
{
    for (std::size_t index = 0; index < cards_.size(); ++index) {
        auto &card = cards_[index];
        card.rectangle = mosaic_.destinations[index];
        card.rotation = 0;
        card.horizontalScale = 1;
        card.revealed = true;
    }
}

void VictorySequence::advance(qint64 elapsed)
{
    if (stage_ == VictoryStage::Inactive || stage_ == VictoryStage::MosaicComplete
        || stage_ == VictoryStage::CascadeComplete) {
        timer_.stop();
        return;
    }
    if (elapsed < CascadeDuration) {
        cascade(elapsed / 1000.0);
        return;
    }
    if (stage_ == VictoryStage::Cascade) {
        cascade(CascadeDuration / 1000.0);
        if (image_.isNull()) {
            stage_ = VictoryStage::CascadeComplete;
            timer_.stop();
            return;
        }
        for (auto &card : cards_) {
            card.assemblyOrigin = card.rectangle;
            card.assemblyRotation = card.rotation;
        }
        stage_ = VictoryStage::Assembling;
    }
    if (elapsed < CascadeDuration + AssemblyDuration) {
        for (std::size_t index = 0; index < cards_.size(); ++index) {
            auto &card = cards_[index];
            const auto delay = 350.0 * index / std::max(std::size_t{1}, cards_.size() - 1);
            const auto p = progress(elapsed - CascadeDuration, delay, 1150);
            const auto ease = p * p * (3 - 2 * p);
            card.rectangle = interpolate(card.assemblyOrigin, mosaic_.destinations[index], ease);
            card.rotation = card.assemblyRotation * (1 - ease);
        }
        return;
    }
    stage_ = VictoryStage::Flipping;
    for (std::size_t index = 0; index < cards_.size(); ++index) {
        auto &card = cards_[index];
        const auto delay = 650.0 * index / std::max(std::size_t{1}, cards_.size() - 1);
        const auto p = progress(elapsed - CascadeDuration - AssemblyDuration, delay, 650);
        card.rectangle = mosaic_.destinations[index];
        card.rotation = 0;
        card.horizontalScale = std::abs(std::cos(p * 3.14159265358979323846));
        card.revealed = p >= 0.5;
    }
    if (elapsed >= CascadeDuration + AssemblyDuration + FlipDuration) {
        settle();
        stage_ = VictoryStage::MosaicComplete;
        timer_.stop();
    }
}

}
