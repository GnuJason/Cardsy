#pragma once

#include "cardsy/ApplicationConfig.h"

#include <QIcon>
#include <QString>

namespace cardsy::app {

void initializeCoreIdentity();
void initializeGuiIdentity();
QIcon applicationIcon();
QString developmentDataDirectory();

}
