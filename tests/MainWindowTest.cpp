#include "ui/MainWindow.h"

#include <QLabel>
#include <QTest>

class MainWindowTest : public QObject
{
    Q_OBJECT

private slots:
    void opensResizesAndCloses()
    {
        MainWindow window;
        QCOMPARE(window.windowTitle(), QStringLiteral("Cardsy"));

        auto *placeholder = qobject_cast<QLabel *>(window.centralWidget());
        QVERIFY(placeholder);
        QCOMPARE(placeholder->text(), QStringLiteral("Cardsy is running."));

        window.show();
        QVERIFY(QTest::qWaitForWindowExposed(&window));
        QVERIFY(window.isVisible());

        window.resize(1024, 768);
        QTRY_COMPARE(window.size(), QSize(1024, 768));
        QTRY_COMPARE(placeholder->size(), window.contentsRect().size());

        QVERIFY(window.close());
        QVERIFY(!window.isVisible());
    }
};

QTEST_MAIN(MainWindowTest)
#include "MainWindowTest.moc"
