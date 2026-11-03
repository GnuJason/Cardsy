#include "BoardAccessibility.h"
#include "GameBoard.h"

#include <QAccessible>
#include <QAccessibleWidget>
#include <QApplication>
#include <QKeySequence>

namespace cardsy::ui {
namespace {

class AccessibleGameBoard : public QAccessibleWidget
{
public:
    explicit AccessibleGameBoard(GameBoard *board)
        : QAccessibleWidget(board, QAccessible::Grouping)
    {
    }

    QString text(QAccessible::Text type) const override
    {
        if (type == QAccessible::Value) {
            if (const auto *board = qobject_cast<GameBoard *>(object())) {
                return board->focusedItemDescription();
            }
        }
        return QAccessibleWidget::text(type);
    }

    QStringList actionNames() const override
    {
        auto actions = QAccessibleWidget::actionNames();
        if (!actions.contains(QAccessibleActionInterface::pressAction())) {
            actions.append(QAccessibleActionInterface::pressAction());
        }
        return actions;
    }

    void doAction(const QString &action) override
    {
        if (action == QAccessibleActionInterface::pressAction()) {
            if (auto *board = qobject_cast<GameBoard *>(object())) {
                const auto *modal = QApplication::activeModalWidget();
                if (!board->isVisible() || !board->isEnabled()
                    || (modal && !modal->isAncestorOf(board))) {
                    return;
                }
                board->setFocus(Qt::OtherFocusReason);
                board->activateFocusedItem();
            }
        } else {
            QAccessibleWidget::doAction(action);
        }
    }

    QStringList keyBindingsForAction(const QString &action) const override
    {
        if (action == QAccessibleActionInterface::pressAction()) {
            return {QKeySequence(Qt::Key_Return).toString(QKeySequence::NativeText),
                    QKeySequence(Qt::Key_Space).toString(QKeySequence::NativeText)};
        }
        return QAccessibleWidget::keyBindingsForAction(action);
    }
};

QAccessibleInterface *boardFactory(const QString &name, QObject *object)
{
    if (name == QStringLiteral("cardsy::ui::GameBoard")) {
        if (auto *board = qobject_cast<GameBoard *>(object)) {
            return new AccessibleGameBoard(board);
        }
    }
    return nullptr;
}

}

void installBoardAccessibility()
{
    static const bool installed = [] {
        QAccessible::installFactory(boardFactory);
        return true;
    }();
    Q_UNUSED(installed);
}

}
