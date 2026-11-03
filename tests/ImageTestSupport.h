#pragma once

#include <QBuffer>
#include <QFile>
#include <QImage>
#include <QPainter>
#include <QtEndian>

#include <stdexcept>

namespace cardsy::ui::test {

inline QImage syntheticImage(QSize size = {900, 600})
{
    QImage image(size, QImage::Format_RGB32);
    image.fill(Qt::green);
    QPainter painter(&image);
    painter.fillRect(0, 0, size.width() / 4, size.height(), Qt::red);
    painter.fillRect(size.width() * 3 / 4, 0, size.width() / 4, size.height(), Qt::blue);
    return image;
}

inline QByteArray encodeImage(const QImage &image, const char *format = "PNG")
{
    QByteArray bytes;
    QBuffer buffer(&bytes);
    if (!buffer.open(QIODevice::WriteOnly) || !image.save(&buffer, format)) {
        throw std::runtime_error("Cannot encode synthetic test image");
    }
    return bytes;
}

inline void writeBytes(const QString &path, const QByteArray &bytes)
{
    QFile file(path);
    if (!file.open(QIODevice::WriteOnly) || file.write(bytes) != bytes.size()) {
        throw std::runtime_error("Cannot write synthetic test file");
    }
}

inline QByteArray readBytes(const QString &path)
{
    QFile file(path);
    if (!file.open(QIODevice::ReadOnly)) {
        throw std::runtime_error("Cannot read synthetic test file");
    }
    return file.readAll();
}

inline QByteArray pngWithDeclaredSize(QSize size)
{
    auto bytes = encodeImage(syntheticImage({1, 1}));
    qToBigEndian<quint32>(static_cast<quint32>(size.width()),
                          reinterpret_cast<uchar *>(bytes.data() + 16));
    qToBigEndian<quint32>(static_cast<quint32>(size.height()),
                          reinterpret_cast<uchar *>(bytes.data() + 20));
    quint32 crc = 0xffffffffU;
    for (const auto byte : bytes.mid(12, 17)) {
        crc ^= static_cast<unsigned char>(byte);
        for (int bit = 0; bit < 8; ++bit) {
            crc = (crc >> 1) ^ ((crc & 1U) ? 0xedb88320U : 0U);
        }
    }
    qToBigEndian<quint32>(crc ^ 0xffffffffU, reinterpret_cast<uchar *>(bytes.data() + 29));
    return bytes;
}

inline QByteArray orientedJpeg()
{
    QImage image(100, 60, QImage::Format_RGB32);
    image.fill(Qt::red);
    {
        QPainter painter(&image);
        painter.fillRect(50, 0, 50, 60, Qt::blue);
    }
    auto bytes = encodeImage(image, "JPEG");
    // Minimal synthetic EXIF: little-endian TIFF, orientation 6 (clockwise 90).
    bytes.insert(2, QByteArray::fromHex(
        "ffe1002245786966000049492a0008000000010012010300010000000600000000000000"));
    return bytes;
}

}
