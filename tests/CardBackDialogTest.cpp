#include "ImageTestSupport.h"
#include "ui/CardBackDialog.h"
#include "ui/CardBackIdentity.h"
#include "ui/IndividualCardBacks.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QFileDialog>
#include <QFileSystemModel>
#include <QLabel>
#include <QLineEdit>
#include <QListWidget>
#include <QMessageBox>
#include <QPushButton>
#include <QSet>
#include <QTabWidget>
#include <QTemporaryDir>
#include <QTest>
#include <QTimer>

using namespace cardsy;
using namespace cardsy::ui;
using namespace cardsy::ui::test;

class CardBackDialogTest : public QObject
{
    Q_OBJECT

    static bool confirm(QPushButton *button, QMessageBox::StandardButton answer)
    {
        bool seen = false;
        QTimer timer;
        connect(&timer, &QTimer::timeout, &timer, [&] {
            if (auto *box = qobject_cast<QMessageBox *>(QApplication::activeModalWidget())) {
                seen = true;
                box->button(answer)->click();
            }
        });
        timer.start(10);
        button->click();
        return seen;
    }

private slots:
    void initTestCase()
    {
        QApplication::setAttribute(Qt::AA_DontUseNativeDialogs);
    }

    void menuOpensOneResponsiveManagerWithExactly52Entries()
    {
        QTemporaryDir directory;
        CardBackSettings defaults(directory.path());
        MainWindow window(defaults, 42);
        auto *action = window.findChild<QAction *>(QStringLiteral("customCardBacksAction"));
        QVERIFY(action);
        action->trigger();
        action->trigger();
        const auto dialogs = window.findChildren<CardBackDialog *>();
        QCOMPARE(dialogs.size(), 1);
        auto *dialog = dialogs.front();
        QVERIFY(QTest::qWaitForWindowExposed(dialog));
        auto *tabs = dialog->findChild<QTabWidget *>();
        QCOMPARE(tabs->count(), 4);
        QSet<unsigned> ids;
        for (int suit = 0; suit < 4; ++suit) {
            auto *list = qobject_cast<QListWidget *>(tabs->widget(suit));
            QVERIFY(list);
            QCOMPARE(list->count(), 13);
            for (int rank = 0; rank < 13; ++rank) {
                const auto *item = list->item(rank);
                const auto id = item->data(Qt::UserRole).toUInt();
                ids.insert(id);
                QVERIFY(item->text().contains(cardBackLabel(static_cast<CardId>(id))));
                QVERIFY(item->text().contains(QStringLiteral("Default")));
                QVERIFY(!item->icon().isNull());
            }
        }
        QCOMPARE(ids.size(), 52);
        dialog->resize(520, 520);
        QCoreApplication::processEvents();
        QVERIFY(dialog->width() <= 760);
        QVERIFY(dialog->height() <= 650);
        QVERIFY(dialog->rect().contains(dialog->findChild<QPushButton *>(
            QStringLiteral("chooseIndividualImage"))->geometry().center()));
        dialog->close();
    }

    void cancelPickerAndConfirmationsKeepAssignmentsThenResetsWork()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings defaults(directory.path());
        IndividualCardBacks backs(directory.path());
        QVERIFY(backs.assign(static_cast<CardId>(0), source));
        QVERIFY(backs.assign(static_cast<CardId>(1), source));
        QVERIFY(backs.assign(static_cast<CardId>(13), source));
        CardBackDialog dialog(backs, defaults);
        dialog.show();
        QVERIFY(QTest::qWaitForWindowExposed(&dialog));
        auto *choose = dialog.findChild<QPushButton *>(QStringLiteral("chooseIndividualImage"));
        QCOMPARE(choose->text(), QStringLiteral("Replace Image..."));
        const auto bytes = readBytes(backs.managedPath(static_cast<CardId>(0)));
        bool sawPicker = false;
        QTimer timer;
        connect(&timer, &QTimer::timeout, &dialog, [&] {
            if (auto *picker = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                sawPicker = true;
                picker->reject();
            }
        });
        timer.start(10);
        choose->click();
        timer.stop();
        QVERIFY(sawPicker);
        QCOMPARE(readBytes(backs.managedPath(static_cast<CardId>(0))), bytes);
        auto *resetSuit = dialog.findChild<QPushButton *>(QStringLiteral("resetSuitImages"));
        auto *resetAll = dialog.findChild<QPushButton *>(QStringLiteral("resetAllImages"));
        QVERIFY(confirm(resetSuit, QMessageBox::Cancel));
        QVERIFY(backs.hasAssignment(static_cast<CardId>(0)));
        QVERIFY(confirm(resetAll, QMessageBox::Cancel));
        QVERIFY(backs.hasAssignment(static_cast<CardId>(13)));
        dialog.findChild<QPushButton *>(QStringLiteral("resetIndividualImage"))->click();
        QVERIFY(!backs.hasAssignment(static_cast<CardId>(0)));
        QVERIFY(backs.hasAssignment(static_cast<CardId>(1)));
        QCOMPARE(choose->text(), QStringLiteral("Choose Image..."));
        QVERIFY(confirm(resetSuit, QMessageBox::Yes));
        QVERIFY(!backs.hasAssignment(static_cast<CardId>(1)));
        QVERIFY(backs.hasAssignment(static_cast<CardId>(13)));
        QVERIFY(confirm(resetAll, QMessageBox::Yes));
        QVERIFY(!backs.hasAssignment(static_cast<CardId>(13)));
        QVERIFY(QFileInfo::exists(source));
    }

    void chooserAppliesImageAndReportsInvalidReplacement()
    {
        QTemporaryDir directory;
        const auto source = directory.filePath(QStringLiteral("source.png"));
        writeBytes(source, encodeImage(syntheticImage()));
        CardBackSettings defaults(directory.path());
        IndividualCardBacks backs(directory.path());
        CardBackDialog dialog(backs, defaults);
        auto *choose = dialog.findChild<QPushButton *>(QStringLiteral("chooseIndividualImage"));
        auto *tabs = dialog.findChild<QTabWidget *>();
        tabs->setCurrentIndex(3);
        auto *list = qobject_cast<QListWidget *>(tabs->currentWidget());
        list->setCurrentRow(12);
        const auto id = Card{Suit::Spades, Rank::King}.id();
        for (int attempt = 0; attempt < 2; ++attempt) {
            bool selected = false;
            bool timedOut = false;
            QTimer timeout;
            timeout.setSingleShot(true);
            connect(&timeout, &QTimer::timeout, &dialog, [&] {
                timedOut = true;
                if (auto *picker = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                    picker->reject();
                }
            });
            QTimer timer;
            connect(&timer, &QTimer::timeout, &dialog, [&] {
                if (auto *picker = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                    picker->setDirectory(directory.path());
                    auto *model = picker->findChild<QFileSystemModel *>();
                    auto *edit = picker->findChild<QLineEdit *>(QStringLiteral("fileNameEdit"));
                    if (model && edit && model->index(source).isValid()) {
                        selected = true;
                        timer.stop();
                        edit->setText(source);
                        QMetaObject::invokeMethod(picker, "accept", Qt::QueuedConnection);
                    }
                }
            });
            timeout.start(5000);
            timer.start(10);
            choose->click();
            timer.stop();
            timeout.stop();
            QVERIFY(selected);
            QVERIFY(!timedOut);
            QVERIFY(backs.hasAssignment(id));
            QVERIFY(!backs.hasAssignment(static_cast<CardId>(0)));
            QCOMPARE(backs.image(id).pixelColor(300, 420), QColor(Qt::green));
            if (attempt == 0) {
                QVERIFY(list->currentItem()->text().contains(QStringLiteral("Custom")));
                writeBytes(source, "invalid replacement");
            } else {
                QVERIFY(dialog.findChild<QLabel *>(QStringLiteral("cardBackFeedback"))
                            ->text().contains(QStringLiteral("PNG or JPEG")));
            }
        }
        IndividualCardBacks restored(directory.path());
        QCOMPARE(restored.image(id), backs.image(id));
    }
};

QTEST_MAIN(CardBackDialogTest)
#include "CardBackDialogTest.moc"
