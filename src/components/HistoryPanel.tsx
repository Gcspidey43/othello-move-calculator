/**
 * History Panel Component
 * Displays move history and provides undo/redo functionality
 */

import React from 'react';
import type { Move } from '../engine/index.js';
import { moveToAlgebraic } from '../engine/index.js';

interface HistoryEntry {
  move: Move;
  color: 1 | -1;
  flips: number;
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  currentIndex: number;
  onUndo: () => void;
  onRedo: () => void;
  onJumpTo: (index: number) => void;
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onUndo,
  onRedo,
  onJumpTo,
  className = ''
}) => {
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length;
  
  const getColorSymbol = (color: 1 | -1): string => {
    return color === 1 ? '●' : '○';
  };
  
  const getColorName = (color: 1 | -1): string => {
    return color === 1 ? 'Black' : 'White';
  };
  
  return (
    <div className={`bg-white border rounded shadow-sm ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Move History</h3>
      </div>
      
      {/* Undo/Redo Controls */}
      <div className="p-3 border-b">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last move"
          >
            ← Undo
          </button>
          <button
            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo next move"
          >
            Redo →
          </button>
        </div>
      </div>
      
      {/* Move List */}
      <div className="max-h-64 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            No moves yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {history.map((entry, index) => {
              const isActive = index < currentIndex;
              const isCurrent = index === currentIndex - 1;
              
              return (
                <button
                  key={index}
                  className={`w-full p-2 text-left rounded transition-colors ${
                    isCurrent
                      ? 'bg-blue-100 border border-blue-300'
                      : isActive
                      ? 'bg-gray-100 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                  onClick={() => onJumpTo(index + 1)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-500">
                        {index + 1}.
                      </span>
                      <span className="text-lg">
                        {getColorSymbol(entry.color)}
                      </span>
                      <span className="font-semibold">
                        {moveToAlgebraic(entry.move)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.flips > 0 && `${entry.flips} flips`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getColorName(entry.color)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Summary */}
      {history.length > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Move {currentIndex} of {history.length}
          </div>
        </div>
      )}
    </div>
  );
};

export type { HistoryEntry };