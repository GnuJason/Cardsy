#include "ApplicationIdentity.h"

#include <QCoreApplication>
#include <QDir>
#include <QFileInfo>
#include <QGuiApplication>
#include <QResource>
#include <QStandardPaths>

static void initializeIconResources()
{
    Q_INIT_RESOURCE(cardsy_icons);
}

namespace cardsy::app {

void initializeCoreIdentity()
{
    QCoreApplication::setOrganizationName({});
    QCoreApplication::setOrganizationDomain(QString::fromLatin1(build::OrganizationDomain));
    QCoreApplication::setApplicationName(QString::fromLatin1(build::ApplicationId));
    QCoreApplication::setApplicationVersion(QString::fromLatin1(build::Version));
}

QIcon applicationIcon()
{
    initializeIconResources();
    QIcon icon;
    for (const int size : {16, 48, 256}) {
        icon.addFile(QStringLiteral(":/cardsy/icons/cardsy-%1.png").arg(size), QSize(size, size));
    }
    return icon;
}

void initializeGuiIdentity()
{
    initializeCoreIdentity();
    QGuiApplication::setApplicationDisplayName(QString::fromLatin1(build::DisplayName));
    QGuiApplication::setDesktopFileName(QString::fromLatin1(build::ApplicationId));
    QGuiApplication::setWindowIcon(applicationIcon());
}

QString developmentDataDirectory()
{
    const auto current = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    if (current.isEmpty()
        || QCoreApplication::applicationName() != QString::fromLatin1(build::ApplicationId)
        || !QCoreApplication::organizationName().isEmpty()) {
        return {};
    }
    return QDir(QFileInfo(current).path()).filePath(QStringLiteral("Cardsy/Cardsy"));
}

}
