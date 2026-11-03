#include "ui/MainWindow.h"
#include "app/ApplicationIdentity.h"

#include <QApplication>
#include <QCommandLineParser>
#include <QCoreApplication>
#include <QTextStream>

#include <string_view>

namespace {

bool informationRequest(int argc, char *argv[])
{
    for (int index = 1; index < argc; ++index) {
        const std::string_view argument(argv[index]);
        if (argument == "--") break;
        if (argument == "--version" || argument == "-v"
            || argument == "--help" || argument == "-h" || argument == "--help-all") {
            return true;
        }
    }
    return false;
}

void configureParser(QCommandLineParser &parser)
{
    parser.setApplicationDescription(QStringLiteral(
        "%1: native, offline Klondike solitaire. Development toward %2; not a public release.")
        .arg(QString::fromLatin1(cardsy::build::DisplayName),
             QString::fromLatin1(cardsy::build::TargetVersion)));
    parser.addHelpOption();
    parser.addOption({{QStringLiteral("v"), QStringLiteral("version")},
                      QStringLiteral("Display the development version and exit.")});
}

}

int main(int argc, char *argv[])
{
    if (informationRequest(argc, argv)) {
        QCoreApplication application(argc, argv);
        cardsy::app::initializeCoreIdentity();
        QCommandLineParser parser;
        configureParser(parser);
        parser.process(application);
        if (parser.isSet(QStringLiteral("version"))) {
            QTextStream(stdout) << cardsy::build::DisplayName << ' ' << cardsy::build::Version << '\n';
            return 0;
        }
        QTextStream(stderr) << "No informational option was requested.\n";
        return 2;
    }
    QApplication application(argc, argv);
    cardsy::app::initializeGuiIdentity();
    QCommandLineParser parser;
    configureParser(parser);
    parser.process(application);
    if (!parser.positionalArguments().isEmpty()) {
        QTextStream(stderr) << "Cardsy does not accept positional arguments.\n";
        return 2;
    }

    MainWindow window;
    window.show();

    return application.exec();
}
