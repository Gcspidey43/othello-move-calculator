/**
 * Board Editor Component
 * 8x8 grid with coordinate labels and click-to-cycle functionality
 */

import React from 'react';
import type { Board, Cell, Move } from '../engine/index.js';

interface BoardEditorProps {
  board: Board;
  onCellClick: (row: number, col: number) => void;
  legalMoves?: Move[];
  suggestedMove?: Move | null;
  isBoardReversed?: boolean;
  className?: string;
}

export const BoardEditor: React.FC<BoardEditorProps> = ({
  board,
  onCellClick,
  legalMoves = [],
  suggestedMove,
  isBoardReversed = false,
  className = ''
}) => {
  const getCellContent = (cell: Cell): string => {
    if (cell === 1) return '●'; // Black (dark)
    if (cell === -1) return '○'; // White (light)
    return ''; // Empty
  };
  
  const renderRowLabel = (row: number): string => {
    // When board is reversed, row labels should be reversed too (8 at top, 1 at bottom)
    return isBoardReversed ? (8 - row).toString() : (row + 1).toString();
  };
  
  const renderColLabel = (col: number): string => {
    // When board is reversed, column labels should be reversed too (h at left, a at right)
    return isBoardReversed ? String.fromCharCode(104 - col) : String.fromCharCode(97 + col);
  };
  
  // Render the board with optional reversal
  return (
    <div className={`inline-block ${className}`}>
      {/* Column labels */}
      <div className="flex">
        <div className="w-8"></div> {/* Space for row labels */}
        {Array.from({ length: 8 }, (_, col) => (
          <div key={col} className="w-12 h-6 flex items-center justify-center text-sm font-semibold text-gray-700">
            {renderColLabel(col)}
          </div>
        ))}
      </div>
      
      {/* Board with row labels */}
      <div>
        {Array.from({ length: 8 }, (_, rowIndex) => {
          // When board is reversed, we create a reversed version of the board data
          const displayBoard = isBoardReversed 
            ? board.map(row => [...row].reverse()).reverse()
            : board;
          
          const row = displayBoard[rowIndex];
          
          return (
            <div key={rowIndex} className="flex">
              {/* Row label */}
              <div className="w-8 h-12 flex items-center justify-center text-sm font-semibold text-gray-700">
                {renderRowLabel(rowIndex)}
              </div>
              {/* Board cells */}
              {row.map((cell, colIndex) => {
                // Transform display coordinates to board coordinates for checking legal moves and suggested move
                const boardR = isBoardReversed ? 7 - rowIndex : rowIndex;
                const boardC = isBoardReversed ? 7 - colIndex : colIndex;
                
                // Check if this position has a legal move (using board coordinates)
                const hasLegalMove = legalMoves.some(move => 
                  move && move.r === boardR && move.c === boardC
                );
                
                // Check if this position is the suggested move (using board coordinates)
                const isSuggested = suggestedMove !== null && 
                  suggestedMove.r === boardR && 
                  suggestedMove.c === boardC;
                
                const baseClass = 'w-12 h-12 border border-green-800 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-200 hover:bg-green-200';
                
                let bgClass = 'bg-green-600';
                let textClass = '';
                
                if (cell === 1) {
                  textClass = 'text-black';
                } else if (cell === -1) {
                  textClass = 'text-white';
                }
                
                if (isSuggested) {
                  bgClass = 'bg-yellow-400 animate-pulse';
                } else if (hasLegalMove && cell === 0) {
                  bgClass = 'bg-green-400';
                }
                
                const cellClass = `${baseClass} ${bgClass} ${textClass}`;
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cellClass}
                    onClick={() => onCellClick(boardR, boardC)}
                  >
                    {getCellContent(cell)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};