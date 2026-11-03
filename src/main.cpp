#include "ui/MainWindow.h"

#include <QApplication>
#include <QCoreApplication>

int main(int argc, char *argv[])
{
    QApplication application(argc, argv);
    QCoreApplication::setOrganizationName(QStringLiteral("Cardsy"));
    QCoreApplication::setApplicationName(QStringLiteral("Cardsy"));

    MainWindow window;
    window.show();

    return application.exec();
}
