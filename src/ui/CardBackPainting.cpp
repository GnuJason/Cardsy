#include "CardBackPainting.h"

#include <QPainter>
#include <QPainterPath>

#include <algorithm>

namespace cardsy::ui {

void paintCardBack(QPainter &painter, QRectF rectangle, const QImage &image)
{
    painter.setPen(QPen(QColor(35, 40, 35), 1));
    painter.setBrush(QColor(35, 64, 112));
    painter.drawRoundedRect(rectangle, 7, 7);
    if (!image.isNull()) {
        painter.save();
        QPainterPath clip;
        clip.addRoundedRect(rectangle.adjusted(1, 1, -1, -1), 6, 6);
        painter.setClipPath(clip);
        painter.setRenderHint(QPainter::SmoothPixmapTransform);
        const auto scale = std::max(rectangle.width() / image.width(),
                                    rectangle.height() / image.height());
        const QSizeF sourceSize(rectangle.width() / scale, rectangle.height() / scale);
        painter.drawImage(rectangle, image,
                         QRectF((image.width() - sourceSize.width()) / 2,
                                (image.height() - sourceSize.height()) / 2,
                                sourceSize.width(), sourceSize.height()));
        painter.restore();
        return;
    }
    const auto inner = rectangle.adjusted(6, 6, -6, -6);
    painter.setPen(QPen(QColor(190, 210, 235), 1));
    painter.setBrush(Qt::NoBrush);
    painter.drawRoundedRect(inner, 4, 4);
    painter.save();
    painter.setClipRect(inner.adjusted(3, 3, -3, -3));
    for (qreal offset = -inner.height(); offset < inner.width(); offset += 14) {
        painter.drawLine(QPointF(inner.left() + offset, inner.bottom()),
                         QPointF(inner.left() + offset + inner.height(), inner.top()));
    }
    painter.restore();
}

}
