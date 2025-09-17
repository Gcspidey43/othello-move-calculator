/**
 * Controls Component
 * Game controls including side selection, depth, time limit, and action buttons
 */

import React from 'react';
import type { Cell } from '../engine/index.js';

interface ControlsProps {
  sideToMove: Cell;
  onSideChange: (side: Cell) => void;
  depth: number;
  onDepthChange: (depth: number) => void;
  timeLimitMs: number;
  onTimeLimitChange: (limit: number) => void;
  onApplyMove: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (data: string) => void;
  hasSuggestedMove: boolean;
  className?: string;
}

export const Controls: React.FC<ControlsProps> = ({
  sideToMove,
  onSideChange,
  depth,
  onDepthChange,
  timeLimitMs,
  onTimeLimitChange,
  onApplyMove,
  onReset,
  onExport,
  onImport,
  hasSuggestedMove,
  className = ''
}) => {
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          onImport(content);
        }
      };
      reader.readAsText(file);
    }
    // Reset input value to allow re-importing the same file
    event.target.value = '';
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Side to Move */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Side to Move:
        </label>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded font-medium transition-colors ${
              sideToMove === 1
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => onSideChange(1)}
          >
            ● Black
          </button>
          <button
            className={`px-4 py-2 rounded font-medium transition-colors border ${
              sideToMove === -1
                ? 'bg-white text-black border-gray-400'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
            }`}
            onClick={() => onSideChange(-1)}
          >
            ○ White
          </button>
        </div>
      </div>
      
      {/* Search Depth */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Search Depth: {depth}
        </label>
        <input
          type="range"
          min="1"
          max="12"
          value={depth}
          onChange={(e) => onDepthChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      
      {/* Time Limit */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Time Limit: {timeLimitMs}ms
        </label>
        <input
          type="range"
          min="500"
          max="10000"
          step="500"
          value={timeLimitMs}
          onChange={(e) => onTimeLimitChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-2">
        {hasSuggestedMove && (
          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
            onClick={onApplyMove}
          >
            Apply Move
          </button>
        )}
        
        <button
          className="w-full px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 transition-colors"
          onClick={onReset}
          title="Reset (R)"
        >
          Reset
        </button>
      </div>
      
      {/* Import/Export */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition-colors"
            onClick={onExport}
          >
            Export
          </button>
          
          <label className="flex-1">
            <input
              type="file"
              accept=".txt"
              onChange={handleImportFile}
              className="hidden"
            />
            <div className="w-full px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition-colors text-center cursor-pointer">
              Import
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};