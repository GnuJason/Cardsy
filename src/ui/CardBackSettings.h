#pragma once

#include <QImage>
#include <QObject>
#include <QString>

namespace cardsy::ui {

enum class CardBackError {
    None, InvalidFile, UnsupportedFormat, InputTooLarge, InvalidDimensions,
    DecodeFailed, StorageFailed
};

struct CardBackResult {
    CardBackError error = CardBackError::None;
    QString message;

    explicit operator bool() const { return error == CardBackError::None; }
};

class CardBackSettings : public QObject
{
    Q_OBJECT

public:
    static constexpr qint64 MaximumInputBytes = 20 * 1024 * 1024;
    static constexpr int MaximumInputDimension = 8192;
    static constexpr qint64 MaximumInputPixels = 16 * 1024 * 1024;
    static QSize normalizedSize() { return {600, 840}; }

    explicit CardBackSettings(QObject *parent = nullptr);
    explicit CardBackSettings(const QString &dataDirectory, QObject *parent = nullptr);

    bool isCustom() const { return !image_.isNull(); }
    const QImage &image() const { return image_; }
    QString managedPath() const;
    QString startupWarning() const { return startupWarning_; }
    static QString fileFilter();

    [[nodiscard]] CardBackResult installImage(const QString &fileName);
    [[nodiscard]] CardBackResult useDefault();

signals:
    void changed();

private:
    QString directory_;
    QImage image_;
    QString startupWarning_;

    void restore();
    bool prepareDirectory();
    CardBackResult persistImage(const QImage &image);
    void migrateDevelopmentBack();
};

}
