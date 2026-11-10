#pragma once

#include <QImage>
#include <QRectF>

class QPainter;

namespace cardsy::ui {

void paintCardBack(QPainter &painter, QRectF rectangle, const QImage &image);

}
