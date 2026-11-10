#include "CardBackDialog.h"
#include "CardBackIdentity.h"
#include "CardBackPainting.h"
#include "CardBackSettings.h"
#include "IndividualCardBacks.h"

#include <QDialogButtonBox>
#include <QDir>
#include <QFileDialog>
#include <QHBoxLayout>
#include <QLabel>
#include <QListWidget>
#include <QMessageBox>
#include <QPainter>
#include <QPushButton>
#include <QStandardPaths>
#include <QTabWidget>
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

}

CardBackDialog::CardBackDialog(IndividualCardBacks &backs, CardBackSettings &defaults,
                             QWidget *parent)
    : QDialog(parent), backs_(backs), defaults_(defaults), tabs_(new QTabWidget(this)),
      preview_(new QLabel(this)), selection_(new QLabel(this)), feedback_(new QLabel(this)),
      choose_(new QPushButton(this)), reset_(new QPushButton(tr("Reset This Card"), this))
{
    setObjectName(QStringLiteral("customCardBackDialog"));
    setWindowTitle(tr("Custom Card Backs"));
    auto *layout = new QVBoxLayout(this);
    auto *explanation = new QLabel(tr("Choose a card, then choose its image. "
        "Default uses your universal card back (the original pattern unless a photo is set)."), this);
    explanation->setWordWrap(true);
    layout->addWidget(explanation);
    layout->addWidget(tabs_, 1);
    tabs_->setObjectName(QStringLiteral("cardBackSuitTabs"));
    for (unsigned suit = 0; suit < lists_.size(); ++suit) {
        auto *list = new QListWidget(tabs_);
        lists_[suit] = list;
        list->setObjectName(QStringLiteral("cardBackSuit%1").arg(suit));
        list->setAccessibleName(cardBackSuitName(static_cast<Suit>(suit)));
        list->setViewMode(QListView::IconMode);
        list->setResizeMode(QListView::Adjust);
        list->setMovement(QListView::Static);
        list->setWordWrap(true);
        list->setSelectionMode(QAbstractItemView::SingleSelection);
        list->setIconSize(QSize(fontMetrics().height() * 4, fontMetrics().height() * 28 / 5));
        list->setGridSize(QSize(fontMetrics().height() * 10, fontMetrics().height() * 9));
        for (unsigned rank = 0; rank < 13; ++rank) {
            const auto id = static_cast<CardId>(suit * 13 + rank);
            auto *item = new QListWidgetItem(list);
            item->setData(Qt::UserRole, static_cast<unsigned>(id));
            refreshCard(id);
        }
        list->setCurrentRow(0);
        tabs_->addTab(list, cardBackSuitName(static_cast<Suit>(suit)));
        connect(list, &QListWidget::currentRowChanged, this, [this] { refreshSelection(); });
    }
    auto *selected = new QHBoxLayout;
    preview_->setObjectName(QStringLiteral("cardBackPreview"));
    selected->addWidget(preview_);
    auto *controls = new QVBoxLayout;
    selection_->setWordWrap(true);
    selection_->setObjectName(QStringLiteral("selectedCardBack"));
    controls->addWidget(selection_);
    choose_->setObjectName(QStringLiteral("chooseIndividualImage"));
    reset_->setObjectName(QStringLiteral("resetIndividualImage"));
    controls->addWidget(choose_);
    controls->addWidget(reset_);
    controls->addStretch();
    selected->addLayout(controls, 1);
    layout->addLayout(selected);
    feedback_->setWordWrap(true);
    feedback_->setObjectName(QStringLiteral("cardBackFeedback"));
    layout->addWidget(feedback_);
    auto *buttons = new QDialogButtonBox(QDialogButtonBox::Close, this);
    auto *resetSuit = buttons->addButton(tr("Reset This Suit"), QDialogButtonBox::ActionRole);
    auto *resetAll = buttons->addButton(tr("Reset All Card Backs"), QDialogButtonBox::ActionRole);
    resetSuit->setObjectName(QStringLiteral("resetSuitImages"));
    resetAll->setObjectName(QStringLiteral("resetAllImages"));
    layout->addWidget(buttons);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::close);
    connect(tabs_, &QTabWidget::currentChanged, this, [this] { refreshSelection(); });
    connect(choose_, &QPushButton::clicked, this, &CardBackDialog::chooseImage);
    connect(reset_, &QPushButton::clicked, this, [this] {
        showResult(backs_.reset(selectedId()));
    });
    connect(resetSuit, &QPushButton::clicked, this, [this] {
        const auto suit = static_cast<Suit>(tabs_->currentIndex());
        if (QMessageBox::question(this, tr("Reset This Suit"),
                tr("Remove all 13 individual image assignments for %1? "
                   "The universal back and other suits will not change.")
                    .arg(cardBackSuitName(suit)),
                QMessageBox::Yes | QMessageBox::Cancel, QMessageBox::Cancel) == QMessageBox::Yes) {
            showResult(backs_.resetSuit(suit));
        }
    });
    connect(resetAll, &QPushButton::clicked, this, [this] {
        if (QMessageBox::warning(this, tr("Reset All Card Backs"),
                tr("Remove ALL 52 individual image assignments? This cannot be undone. "
                   "Your original images, universal back and game will not change."),
                QMessageBox::Yes | QMessageBox::Cancel, QMessageBox::Cancel) == QMessageBox::Yes) {
            showResult(backs_.resetAll());
        }
    });
    connect(&backs_, &IndividualCardBacks::changed, this, [this](CardId id) {
        refreshCard(id);
        if (id == selectedId()) {
            refreshSelection();
        }
    });
    connect(&defaults_, &CardBackSettings::changed, this, [this] {
        for (unsigned index = 0; index < 52; ++index) {
            refreshCard(static_cast<CardId>(index));
        }
        refreshSelection();
    });
    refreshSelection();
    resize(fontMetrics().height() * 38, fontMetrics().height() * 36);
}

CardId CardBackDialog::selectedId() const
{
    const auto suit = tabs_->currentIndex();
    return static_cast<CardId>(suit * 13 + lists_[suit]->currentRow());
}

void CardBackDialog::refreshCard(CardId id)
{
    const auto index = static_cast<unsigned>(id);
    auto *item = lists_[index / 13]->item(index % 13);
    const auto &image = backs_.image(id).isNull() ? defaults_.image() : backs_.image(id);
    const auto state = !backs_.warning(id).isEmpty() ? tr("Unavailable - default")
        : backs_.hasAssignment(id) ? tr("Custom") : tr("Default");
    const auto text = tr("%1\n%2").arg(cardBackLabel(id), state);
    item->setText(text);
    item->setData(Qt::AccessibleTextRole, text);
    item->setToolTip(backs_.warning(id).isEmpty() ? text : backs_.warning(id));
    item->setIcon(QIcon(thumbnail(image, fontMetrics().height() * 28 / 5, devicePixelRatioF())));
}

void CardBackDialog::refreshSelection()
{
    const auto id = selectedId();
    const auto &image = backs_.image(id).isNull() ? defaults_.image() : backs_.image(id);
    preview_->setPixmap(thumbnail(image, fontMetrics().height() * 8, devicePixelRatioF()));
    preview_->setAccessibleName(tr("Back preview: %1").arg(cardBackLabel(id)));
    selection_->setText(tr("%1: %2").arg(cardBackLabel(id),
        !backs_.warning(id).isEmpty() ? backs_.warning(id)
        : backs_.hasAssignment(id) ? tr("Custom image") : tr("Default back")));
    choose_->setText(backs_.hasAssignment(id) ? tr("Replace Image...") : tr("Choose Image..."));
    reset_->setEnabled(backs_.hasAssignment(id));
}

void CardBackDialog::showResult(const CardBackResult &result)
{
    feedback_->setText(result ? tr("Card backs updated locally.") : result.message);
    feedback_->setAccessibleDescription(feedback_->text());
}

void CardBackDialog::chooseImage()
{
    const auto id = selectedId();
    auto directory = QStandardPaths::writableLocation(QStandardPaths::PicturesLocation);
    if (directory.isEmpty() || !QDir(directory).exists()) {
        directory = QDir::homePath();
    }
    const auto file = QFileDialog::getOpenFileName(this, tr("Choose Image for %1")
        .arg(cardBackLabel(id)), directory, CardBackSettings::fileFilter());
    if (!file.isEmpty()) {
        showResult(backs_.assign(id, file));
    }
}

}
