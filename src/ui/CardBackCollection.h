#pragma once

#include "CardBackSettings.h"

#include <QFileInfo>
#include <QFileSystemWatcher>
#include <QList>
#include <QRandomGenerator>
#include <QStringList>

#include <array>
#include <functional>

namespace cardsy::ui {

enum class CardBackMode { Default, SingleImage, RandomCollection };

struct CollectionItem {
    QString id;
    QImage thumbnail;
    QString warning;
    QFileInfo file;
};

struct CardBackImportSummary {
    int imported = 0;
    int duplicates = 0;
    int failed = 0;
    bool canceled = false;
    QStringList details;
};

struct GameCardBacks {
    std::array<QString, 52> ids{};
    std::array<QImage, 52> images{};
};

class CardBackCollection : public QObject
{
    Q_OBJECT

public:
    explicit CardBackCollection(const QString &dataDirectory, QObject *parent = nullptr);

    const QList<CollectionItem> &items() const { return items_; }
    CardBackMode mode() const { return mode_; }
    QString startupWarning() const { return startupWarning_; }
    QString manifestPath() const;
    QString managedPath(const QString &id) const;
    [[nodiscard]] CardBackResult setMode(CardBackMode mode);
    [[nodiscard]] CardBackImportSummary importImages(
        const QStringList &sources, const std::function<bool(int)> &progress = {});
    [[nodiscard]] CardBackResult removeImages(const QStringList &ids);
    [[nodiscard]] CardBackResult clear();
    GameCardBacks beginGame(QRandomGenerator &random) const;
    QImage victoryImage(QRandomGenerator &random) const;

signals:
    void changed();
    void modeChanged();

private:
    QString dataDirectory_;
    QString directory_;
    QList<CollectionItem> items_;
    CardBackMode mode_ = CardBackMode::Default;
    bool migrationComplete_ = false;
    bool writable_ = true;
    QString startupWarning_;
    QFileSystemWatcher watcher_;

    bool safeStorage() const;
    bool prepareStorage();
    CardBackResult save(const QList<CollectionItem> &items, CardBackMode mode,
                        bool migrationComplete);
    CardBackResult add(const QImage &image, bool &duplicate);
    void restore();
    void migrate();
    void refresh(CollectionItem &item);
    void refreshWatches();
};

}
