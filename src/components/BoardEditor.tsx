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
  className?: string;
}

export const BoardEditor: React.FC<BoardEditorProps> = ({
  board,
  onCellClick,
  legalMoves = [],
  suggestedMove,
  className = ''
}) => {
  const isLegalMove = (r: number, c: number): boolean => {
    return legalMoves.some(move => move && move.r === r && move.c === c);
  };
  
  const isSuggestedMove = (r: number, c: number): boolean => {
    return suggestedMove !== null && suggestedMove?.r === r && suggestedMove?.c === c;
  };
  
  const getCellContent = (cell: Cell): string => {
    if (cell === 1) return '●'; // Black
    if (cell === -1) return '○'; // White
    return ''; // Empty
  };
  
  const getCellClass = (r: number, c: number, cell: Cell): string => {
    const baseClass = 'w-12 h-12 border border-green-800 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-200 hover:bg-green-200';
    
    let bgClass = 'bg-green-600';
    let textClass = '';
    
    if (cell === 1) {
      textClass = 'text-black';
    } else if (cell === -1) {
      textClass = 'text-white';
    }
    
    if (isSuggestedMove(r, c)) {
      bgClass = 'bg-yellow-400 animate-pulse';
    } else if (isLegalMove(r, c) && cell === 0) {
      bgClass = 'bg-green-400';
    }
    
    return `${baseClass} ${bgClass} ${textClass}`;
  };
  
  const renderRowLabel = (row: number): string => {
    return (row + 1).toString(); // Row 0 = "1", Row 7 = "8"
  };
  
  const renderColLabel = (col: number): string => {
    return String.fromCharCode(97 + col); // Col 0 = "a", Col 7 = "h"
  };
  
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
      {board.map((row, r) => (
        <div key={r} className="flex">
          {/* Row label */}
          <div className="w-8 h-12 flex items-center justify-center text-sm font-semibold text-gray-700">
            {renderRowLabel(r)}
          </div>
          
          {/* Board cells */}
          {row.map((cell, c) => (
            <button
              key={c}
              className={getCellClass(r, c, cell)}
              onClick={() => onCellClick(r, c)}
              onContextMenu={(e) => {
                e.preventDefault();
                onCellClick(r, c);
              }}
              aria-label={`${renderColLabel(c)}${renderRowLabel(r)} - ${cell === 0 ? 'empty' : cell === 1 ? 'black' : 'white'}`}
            >
              {cell === 0 && isLegalMove(r, c) && (
                <div className="w-3 h-3 bg-gray-400 rounded-full opacity-60"></div>
              )}
              {cell !== 0 && getCellContent(cell)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};