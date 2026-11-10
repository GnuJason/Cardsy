#include "CardBackDialog.h"
#include "CardBackPainting.h"

#include <QComboBox>
#include <QDialogButtonBox>
#include <QDir>
#include <QFileDialog>
#include <QHBoxLayout>
#include <QLabel>
#include <QListWidget>
#include <QMessageBox>
#include <QPainter>
#include <QProgressDialog>
#include <QPushButton>
#include <QScrollBar>
#include <QSet>
#include <QSignalBlocker>
#include <QStackedWidget>
#include <QStandardPaths>
#include <QVBoxLayout>

namespace cardsy::ui {
namespace {

QPixmap thumbnail(const QImage &image, int height, qreal ratio)
{
    const QSize size(height * 5 / 7, height);
    QPixmap pixmap(size * ratio);
    pixmap.setDevicePixelRatio(ratio);
    pixmap.fill(Qt::transparent);
    QPainter painter(&pixmap);
    paintCardBack(painter, QRectF(QPointF(1, 1), QSizeF(size - QSize(2, 2))), image);
    return pixmap;
}

QString picturesDirectory()
{
    const auto path = QStandardPaths::writableLocation(QStandardPaths::PicturesLocation);
    return !path.isEmpty() && QDir(path).exists() ? path : QDir::homePath();
}

}

CardBackDialog::CardBackDialog(CardBackCollection &backs, CardBackSettings &single, QWidget *parent)
    : QDialog(parent), backs_(backs), single_(single), mode_(new QComboBox(this)),
      sections_(new QStackedWidget(this)), list_(new QListWidget(this)),
      preview_(new QLabel(this)), count_(new QLabel(this)), feedback_(new QLabel(this)),
      choose_(new QPushButton(this)), removeSingle_(new QPushButton(tr("Remove Image"), this)),
      remove_(new QPushButton(tr("Remove Selected"), this)),
      clear_(new QPushButton(tr("Clear Collection..."), this))
{
    setObjectName(QStringLiteral("customCardBackDialog"));
    setWindowTitle(tr("Custom Card Backs"));
    auto *layout = new QVBoxLayout(this);
    auto *modeLabel = new QLabel(tr("Card Back Mode:"), this);
    modeLabel->setBuddy(mode_);
    layout->addWidget(modeLabel);
    mode_->setObjectName(QStringLiteral("cardBackMode"));
    mode_->addItem(tr("Default Cardsy Back"), static_cast<int>(CardBackMode::Default));
    mode_->addItem(tr("Single Image"), static_cast<int>(CardBackMode::SingleImage));
    mode_->addItem(tr("Random Image Collection"), static_cast<int>(CardBackMode::RandomCollection));
    layout->addWidget(mode_);
    auto *defaultSection = new QLabel(tr("Use Cardsy's built-in back. Stored images are kept."), this);
    defaultSection->setWordWrap(true);
    sections_->addWidget(defaultSection);
    auto *singleSection = new QWidget(this);
    auto *singleLayout = new QVBoxLayout(singleSection);
    auto *singleExplanation = new QLabel(tr("Use the same image for every face-down card."), this);
    singleExplanation->setWordWrap(true);
    singleLayout->addWidget(singleExplanation);
    preview_->setObjectName(QStringLiteral("cardBackPreview"));
    preview_->setAccessibleName(tr("Single image preview"));
    singleLayout->addWidget(preview_, 0, Qt::AlignHCenter);
    choose_->setObjectName(QStringLiteral("chooseSingleImage"));
    removeSingle_->setObjectName(QStringLiteral("removeSingleImage"));
    singleLayout->addWidget(choose_);
    singleLayout->addWidget(removeSingle_);
    singleLayout->addStretch();
    sections_->addWidget(singleSection);
    auto *collectionSection = new QWidget(this);
    auto *collectionLayout = new QVBoxLayout(collectionSection);
    auto *explanation = new QLabel(tr("Cardsy randomly assigns these images when a new game begins. "
        "Backs remain fixed for that game, even if images are added or removed here. "
        "Collection changes fully apply to the next new game."), this);
    explanation->setWordWrap(true);
    collectionLayout->addWidget(explanation);
    auto *add = new QPushButton(tr("Add Images..."), this);
    add->setObjectName(QStringLiteral("addCollectionImages"));
    collectionLayout->addWidget(add);
    list_->setObjectName(QStringLiteral("cardBackCollection"));
    list_->setAccessibleName(tr("Card-back image collection"));
    list_->setViewMode(QListView::IconMode);
    list_->setResizeMode(QListView::Adjust);
    list_->setMovement(QListView::Static);
    list_->setWordWrap(true);
    list_->setSelectionMode(QAbstractItemView::ExtendedSelection);
    list_->setIconSize(QSize(60, 84));
    list_->setGridSize(QSize(120, 132));
    collectionLayout->addWidget(list_, 1);
    count_->setObjectName(QStringLiteral("collectionImageCount"));
    count_->setWordWrap(true);
    collectionLayout->addWidget(count_);
    auto *row = new QHBoxLayout;
    remove_->setObjectName(QStringLiteral("removeCollectionImages"));
    clear_->setObjectName(QStringLiteral("clearCollectionImages"));
    row->addWidget(remove_);
    row->addWidget(clear_);
    collectionLayout->addLayout(row);
    sections_->addWidget(collectionSection);
    layout->addWidget(sections_, 1);
    feedback_->setObjectName(QStringLiteral("cardBackFeedback"));
    feedback_->setWordWrap(true);
    feedback_->setText(backs_.startupWarning());
    layout->addWidget(feedback_);
    auto *buttons = new QDialogButtonBox(QDialogButtonBox::Close, this);
    layout->addWidget(buttons);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::close);
    connect(mode_, &QComboBox::currentIndexChanged, this, [this](int index) {
        showResult(backs_.setMode(static_cast<CardBackMode>(mode_->itemData(index).toInt())));
        refreshMode();
    });
    connect(&backs_, &CardBackCollection::modeChanged, this, &CardBackDialog::refreshMode);
    connect(&backs_, &CardBackCollection::changed, this, &CardBackDialog::refreshCollection);
    connect(&single_, &CardBackSettings::changed, this, &CardBackDialog::refreshSingle);
    connect(choose_, &QPushButton::clicked, this, &CardBackDialog::chooseSingle);
    connect(removeSingle_, &QPushButton::clicked, this, [this] {
        showResult(single_.useDefault());
    });
    connect(add, &QPushButton::clicked, this, &CardBackDialog::addImages);
    connect(list_, &QListWidget::itemSelectionChanged, this, [this] {
        remove_->setEnabled(!list_->selectedItems().isEmpty());
    });
    connect(remove_, &QPushButton::clicked, this, [this] {
        QStringList ids;
        for (const auto *item : list_->selectedItems()) {
            ids << item->data(Qt::UserRole).toString();
        }
        showResult(backs_.removeImages(ids));
    });
    connect(clear_, &QPushButton::clicked, this, [this] {
        if (QMessageBox::warning(this, tr("Clear Collection"),
                tr("Remove all collection images? This cannot be undone. Original source files, "
                   "the single image and current-game backs will not change."),
                QMessageBox::Yes | QMessageBox::Cancel, QMessageBox::Cancel) == QMessageBox::Yes) {
            showResult(backs_.clear());
        }
    });
    refreshSingle();
    refreshCollection();
    refreshMode();
    resize(fontMetrics().height() * 38, fontMetrics().height() * 34);
}

void CardBackDialog::refreshMode()
{
    const QSignalBlocker blocker(mode_);
    const auto index = mode_->findData(static_cast<int>(backs_.mode()));
    mode_->setCurrentIndex(index);
    sections_->setCurrentIndex(index);
}

void CardBackDialog::refreshSingle()
{
    preview_->setPixmap(thumbnail(single_.image(), fontMetrics().height() * 8, devicePixelRatioF()));
    choose_->setText(single_.isCustom() ? tr("Replace Image...") : tr("Choose Image..."));
    removeSingle_->setEnabled(single_.isCustom());
}

void CardBackDialog::refreshCollection()
{
    QSet<QString> selected;
    for (const auto *item : list_->selectedItems()) {
        selected.insert(item->data(Qt::UserRole).toString());
    }
    const auto scroll = list_->verticalScrollBar()->value();
    list_->clear();
    int number = 0;
    int unavailable = 0;
    for (const auto &entry : backs_.items()) {
        const auto text = entry.warning.isEmpty() ? tr("Image %1").arg(++number)
            : tr("Image %1\nUnavailable").arg(++number);
        auto *item = new QListWidgetItem(
            QIcon(thumbnail(entry.thumbnail, 84, devicePixelRatioF())), text, list_);
        item->setData(Qt::UserRole, entry.id);
        item->setData(Qt::AccessibleTextRole, text);
        item->setToolTip(entry.warning.isEmpty() ? text : entry.warning);
        item->setSelected(selected.contains(entry.id));
        unavailable += !entry.warning.isEmpty();
    }
    list_->verticalScrollBar()->setValue(scroll);
    const auto count = backs_.items().size();
    QString message;
    if (count == 0) {
        message = tr("No images in collection. Using the built-in back.");
    } else if (count == 1) {
        message = tr("1 image in collection. It will be used for all cards.");
    } else if (count < 52) {
        message = tr("%1 images in collection. Images will repeat across the deck.").arg(count);
    } else if (count == 52) {
        message = tr("52 images in collection. Each image will be used once per game.");
    } else {
        message = tr("%1 images in collection. Cardsy will choose 52 for each new game.").arg(count);
    }
    if (unavailable) {
        message += tr(" %1 unavailable; only valid images will be used.").arg(unavailable);
    }
    count_->setText(message);
    remove_->setEnabled(!list_->selectedItems().isEmpty());
    clear_->setEnabled(count != 0);
}

void CardBackDialog::showResult(const CardBackResult &result)
{
    feedback_->setText(result ? tr("Card-back settings updated locally.") : result.message);
    feedback_->setAccessibleDescription(feedback_->text());
}

void CardBackDialog::chooseSingle()
{
    const auto file = QFileDialog::getOpenFileName(this, tr("Choose Single Image"),
        picturesDirectory(), CardBackSettings::fileFilter());
    if (!file.isEmpty()) {
        auto result = single_.installImage(file);
        if (result) {
            result = backs_.setMode(CardBackMode::SingleImage);
        }
        showResult(result);
    }
}

void CardBackDialog::addImages()
{
    QFileDialog picker(this, tr("Add Collection Images"), picturesDirectory(),
                       CardBackSettings::fileFilter());
    picker.setFileMode(QFileDialog::ExistingFiles);
    if (picker.exec() != QDialog::Accepted) {
        return;
    }
    const auto files = picker.selectedFiles();
    if (files.isEmpty()) {
        return;
    }
    QProgressDialog progress(tr("Importing images..."), tr("Cancel Remaining"), 0, files.size(), this);
    progress.setWindowModality(Qt::WindowModal);
    progress.setMinimumDuration(0);
    const auto total = backs_.importImages(files, [&progress](int processed) {
        progress.setValue(processed);
        return !progress.wasCanceled();
    });
    progress.close();
    auto message = tr("%1 images imported. %2 files skipped (invalid, unreadable or storage failure). "
                      "%3 duplicates skipped.").arg(total.imported).arg(total.failed).arg(total.duplicates);
    if (total.canceled) {
        message += tr(" Remaining import canceled.");
    }
    if (!total.details.isEmpty()) {
        message += QLatin1Char('\n') + total.details.mid(0, 5).join(QLatin1Char('\n'));
    }
    feedback_->setText(message);
    feedback_->setAccessibleDescription(message);
}

}
