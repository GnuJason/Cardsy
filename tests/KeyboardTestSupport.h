#pragma once

#include "BoardTestSupport.h"
#include "ui/GameBoard.h"

#include <QApplication>
#include <QMouseEvent>
#include <QTest>

namespace cardsy::ui::test {

inline void showKeyboardBoard(GameBoard &board)
{
    board.resize(1000, 700);
    board.show();
    board.setFocus(Qt::TabFocusReason);
    QCoreApplication::processEvents();
}

inline bool goTop(GameBoard &board, std::size_t position)
{
    for (int step = 0; step < 53 && board.keyboardFocus().pile == PileType::Tableau; ++step) {
        QTest::keyClick(&board, Qt::Key_Up);
    }
    if (board.keyboardFocus().pile == PileType::Tableau || position > 5) {
        return false;
    }
    for (int step = 0; step < 5; ++step) {
        QTest::keyClick(&board, Qt::Key_Left);
    }
    for (std::size_t step = 0; step < position; ++step) {
        QTest::keyClick(&board, Qt::Key_Right);
    }
    const auto focus = board.keyboardFocus();
    return position == 0 ? focus.pile == PileType::Stock
        : position == 1 ? focus.pile == PileType::Waste
                         : focus.pile == PileType::Foundation && focus.pileIndex == position - 2;
}

inline bool goTableau(GameBoard &board, std::size_t column, std::size_t visibleOffset = 0)
{
    if (column > 6 || !goTop(board, 0)) {
        return false;
    }
    QTest::keyClick(&board, Qt::Key_Down);
    for (std::size_t step = 0; step < column; ++step) {
        QTest::keyClick(&board, Qt::Key_Right);
    }
    for (std::size_t step = 0; step < visibleOffset; ++step) {
        QTest::keyClick(&board, Qt::Key_Down);
    }
    return board.keyboardFocus().pile == PileType::Tableau
        && board.keyboardFocus().pileIndex == column;
}

inline bool validKeyboardFocus(const GameBoard &board)
{
    return reconcileBoardFocus(board.gameState(), board.keyboardFocus()) == board.keyboardFocus()
        && board.focusedElement().has_value();
}

inline void moveHeldPointer(GameBoard &board, QPoint point)
{
    QMouseEvent event(QEvent::MouseMove, point, board.mapToGlobal(point),
                      Qt::NoButton, Qt::LeftButton, Qt::NoModifier);
    QApplication::sendEvent(&board, &event);
}

}
