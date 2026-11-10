#pragma once

#include "CardBackSettings.h"
#include "engine/Card.h"

#include <QFileInfo>
#include <QFileSystemWatcher>

#include <array>

namespace cardsy::ui {

class IndividualCardBacks : public QObject
{
    Q_OBJECT

public:
    explicit IndividualCardBacks(const QString &dataDirectory, QObject *parent = nullptr);

    const QImage &image(CardId id) const;
    bool hasAssignment(CardId id) const;
    QString warning(CardId id) const;
    QString managedPath(CardId id) const;
    [[nodiscard]] CardBackResult assign(CardId id, const QString &source);
    [[nodiscard]] CardBackResult reset(CardId id);
    [[nodiscard]] CardBackResult resetSuit(Suit suit);
    [[nodiscard]] CardBackResult resetAll();

signals:
    void changed(cardsy::CardId id);

private:
    struct Entry {
        QImage image;
        QFileInfo file;
        QString warning;
    };
    QString dataDirectory_;
    QString directory_;
    std::array<Entry, 52> entries_;
    QFileSystemWatcher watcher_;

    bool safeDirectory() const;
    bool prepareDirectory();
    void refresh(CardId id, bool force);
    void refreshWatches();
    CardBackResult resetRange(unsigned begin, unsigned end);
};

}
