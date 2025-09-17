/**
 * Result Pane Component
 * Displays engine search results and diagnostic information
 */

import React from 'react';
import type { EngineResult } from '../engine/index.js';

interface ResultPaneProps {
  result: EngineResult | null;
  isCalculating: boolean;
  progress?: {
    nodes: number;
    timeMs: number;
    depth: number;
  };
  className?: string;
}

export const ResultPane: React.FC<ResultPaneProps> = ({
  result,
  isCalculating,
  progress,
  className = ''
}) => {
  if (!result && !isCalculating) {
    return (
      <div className={`p-4 bg-gray-100 rounded ${className}`}>
        <p className="text-gray-600">No analysis yet. Click "Calculate Move" to begin.</p>
      </div>
    );
  }
  
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  const getEvaluationDescription = (score: number): string => {
    if (Math.abs(score) < 50) return 'Equal position';
    if (score > 0) {
      if (score > 500) return 'Winning advantage';
      if (score > 200) return 'Strong advantage';
      return 'Slight advantage';
    } else {
      if (score < -500) return 'Losing position';
      if (score < -200) return 'Strong disadvantage';
      return 'Slight disadvantage';
    }
  };
  
  return (
    <div className={`p-4 bg-white border rounded shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        {isCalculating ? 'Calculating...' : 'Analysis Result'}
      </h3>
      
      {isCalculating && progress && (
        <div className="space-y-2 mb-4 p-3 bg-blue-50 rounded">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Time:</span>
            <span className="text-sm font-mono">{progress.timeMs}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Depth:</span>
            <span className="text-sm font-mono">{progress.depth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Nodes:</span>
            <span className="text-sm font-mono">{formatNumber(progress.nodes)}</span>
          </div>
        </div>
      )}
      
      {result && (
        <div className="space-y-3">
          {/* Best Move */}
          <div className="p-3 bg-green-50 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Best Move:</span>
              <span className="text-xl font-bold text-green-700">
                {result.bestMoveAlgebraic}
              </span>
            </div>
            {result.flips > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                Flips {result.flips} piece{result.flips !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Evaluation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Evaluation</div>
              <div className="text-lg font-bold" title={getEvaluationDescription(result.score)}>
                {result.score > 0 ? '+' : ''}{result.score}
              </div>
              <div className="text-xs text-gray-500">
                {getEvaluationDescription(result.score)}
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Depth</div>
              <div className="text-lg font-bold">{result.depthSearched}</div>
            </div>
          </div>
          
          {/* Performance Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Nodes</div>
              <div className="text-lg font-bold">{formatNumber(result.nodes)}</div>
              <div className="text-xs text-gray-500">
                {Math.round(result.nodes / (result.timeMs / 1000)).toLocaleString()} nps
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Time</div>
              <div className="text-lg font-bold">{result.timeMs}ms</div>
            </div>
          </div>
          
          {/* Principal Variation */}
          {result.pv.length > 0 && (
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm text-gray-600 mb-2">Principal Variation:</div>
              <div className="font-mono text-sm">
                {result.pv.join(' ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};