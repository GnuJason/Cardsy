#include "ImageTestSupport.h"
#include "ui/CardBackDialog.h"
#include "ui/MainWindow.h"

#include <QAction>
#include <QComboBox>
#include <QFileDialog>
#include <QFileSystemModel>
#include <QLabel>
#include <QLineEdit>
#include <QListWidget>
#include <QMessageBox>
#include <QPushButton>
#include <QStackedWidget>
#include <QTemporaryDir>
#include <QTest>
#include <QTimer>

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

    void menuOpensOneResponsiveCollectionManager()
    {
        QTemporaryDir directory;
        CardBackSettings single(directory.path());
        MainWindow window(single, 42);
        auto *action = window.findChild<QAction *>(QStringLiteral("customCardBacksAction"));
        action->trigger();
        action->trigger();
        const auto dialogs = window.findChildren<CardBackDialog *>();
        QCOMPARE(dialogs.size(), 1);
        auto *dialog = dialogs.front();
        QVERIFY(QTest::qWaitForWindowExposed(dialog));
        auto *mode = dialog->findChild<QComboBox *>(QStringLiteral("cardBackMode"));
        QCOMPARE(mode->count(), 3);
        mode->setCurrentIndex(2);
        QCOMPARE(window.cardBackCollection()->mode(), CardBackMode::RandomCollection);
        QCOMPARE(dialog->findChild<QStackedWidget *>()->currentIndex(), 2);
        auto *list = dialog->findChild<QListWidget *>();
        QCOMPARE(list->count(), 0);
        QCOMPARE(list->selectionMode(), QAbstractItemView::ExtendedSelection);
        QVERIFY(dialog->findChild<QLabel *>(QStringLiteral("collectionImageCount"))
                    ->text().contains(QStringLiteral("No images")));
        dialog->resize(520, 520);
        QCoreApplication::processEvents();
        QVERIFY(dialog->width() <= 760);
        QVERIFY(dialog->height() <= 650);
        auto *add = dialog->findChild<QPushButton *>(QStringLiteral("addCollectionImages"));
        const auto position = add->mapTo(dialog, add->rect().center());
        QVERIFY(dialog->rect().contains(position));
        QVERIFY(add->isVisible());
        mode->setCurrentIndex(1);
        QVERIFY(dialog->findChild<QPushButton *>(QStringLiteral("chooseSingleImage"))->isVisible());
        dialog->close();
    }

    void chooserSupportsMultipleFilesCancelSummaryAndRemoval()
    {
        QTemporaryDir directory;
        QStringList paths;
        for (int index = 0; index < 2; ++index) {
            const auto path = directory.filePath(QStringLiteral("source%1.png").arg(index));
            QImage image({10, 14}, QImage::Format_RGB32);
            image.fill(index == 0 ? Qt::magenta : Qt::cyan);
            writeBytes(path, encodeImage(image));
            paths << path;
        }
        const auto bad = directory.filePath(QStringLiteral("bad.png"));
        writeBytes(bad, "invalid");
        CardBackSettings single(directory.filePath(QStringLiteral("private")));
        CardBackCollection backs(QFileInfo(single.managedPath()).path());
        QVERIFY(backs.setMode(CardBackMode::RandomCollection));
        CardBackDialog dialog(backs, single);
        dialog.show();
        auto *add = dialog.findChild<QPushButton *>(QStringLiteral("addCollectionImages"));
        bool sawPicker = false;
        bool multi = false;
        QTimer timer;
        connect(&timer, &QTimer::timeout, &dialog, [&] {
            if (auto *picker = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                sawPicker = true;
                multi = picker->fileMode() == QFileDialog::ExistingFiles;
                picker->reject();
            }
        });
        timer.start(10);
        add->click();
        timer.stop();
        QVERIFY(sawPicker);
        QVERIFY(multi);
        QVERIFY(backs.items().isEmpty());
        QCOMPARE(backs.mode(), CardBackMode::RandomCollection);
        bool selected = false;
        QTimer acceptTimer;
        connect(&acceptTimer, &QTimer::timeout, &dialog, [&] {
            if (auto *picker = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                picker->setDirectory(directory.path());
                auto *model = picker->findChild<QFileSystemModel *>();
                auto *edit = picker->findChild<QLineEdit *>(QStringLiteral("fileNameEdit"));
                if (model && edit && model->index(paths[1]).isValid()) {
                    selected = true;
                    acceptTimer.stop();
                    edit->setText(QStringLiteral("\"%1\" \"%2\" \"%3\"")
                                      .arg(paths[0], paths[1], bad));
                    QMetaObject::invokeMethod(picker, "accept", Qt::QueuedConnection);
                }
            }
        });
        QTimer timeout;
        timeout.setSingleShot(true);
        connect(&timeout, &QTimer::timeout, &dialog, [&] {
            if (auto *picker = qobject_cast<QFileDialog *>(QApplication::activeModalWidget())) {
                picker->reject();
            }
        });
        timeout.start(5000);
        acceptTimer.start(10);
        add->click();
        acceptTimer.stop();
        timeout.stop();
        QVERIFY(selected);
        QCOMPARE(backs.items().size(), 2);
        QVERIFY(dialog.findChild<QLabel *>(QStringLiteral("cardBackFeedback"))
                    ->text().contains(QStringLiteral("2 images imported. 1 files skipped")));
        auto *list = dialog.findChild<QListWidget *>();
        QCOMPARE(list->count(), 2);
        list->item(0)->setSelected(true);
        dialog.findChild<QPushButton *>(QStringLiteral("removeCollectionImages"))->click();
        QCOMPARE(backs.items().size(), 1);
        auto *clear = dialog.findChild<QPushButton *>(QStringLiteral("clearCollectionImages"));
        QVERIFY(confirm(clear, QMessageBox::Cancel));
        QCOMPARE(backs.items().size(), 1);
        QVERIFY(confirm(clear, QMessageBox::Yes));
        QVERIFY(backs.items().isEmpty());
        QVERIFY(QFileInfo::exists(paths[0]));
    }

    void imageCountMessages_data()
    {
        QTest::addColumn<int>("count");
        QTest::addColumn<QString>("expected");
        QTest::newRow("empty") << 0 << QStringLiteral("No images");
        QTest::newRow("one") << 1 << QStringLiteral("all cards");
        QTest::newRow("repeat") << 12 << QStringLiteral("repeat");
        QTest::newRow("full") << 52 << QStringLiteral("once per game");
        QTest::newRow("subset") << 80 << QStringLiteral("choose 52");
    }

    void imageCountMessages()
    {
        QFETCH(int, count);
        QFETCH(QString, expected);
        QTemporaryDir directory;
        CardBackSettings single(directory.filePath(QStringLiteral("private")));
        CardBackCollection backs(QFileInfo(single.managedPath()).path());
        QStringList paths;
        for (int index = 0; index < count; ++index) {
            QImage image({10, 14}, QImage::Format_RGB32);
            image.fill(QColor::fromRgb(index + 1, 120, 200));
            const auto path = directory.filePath(QStringLiteral("source%1.png").arg(index));
            writeBytes(path, encodeImage(image));
            paths << path;
        }
        QCOMPARE(backs.importImages(paths).imported, count);
        CardBackDialog dialog(backs, single);
        QVERIFY(dialog.findChild<QLabel *>(QStringLiteral("collectionImageCount"))->text().contains(expected));
    }
};

QTEST_MAIN(CardBackDialogTest)
#include "CardBackDialogTest.moc"
