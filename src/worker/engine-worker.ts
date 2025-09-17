/**
 * Web Worker for running Othello engine search
 * Handles search requests and provides progress updates
 */

import { engineSearch } from '../engine/index.js';
import type { Board, Cell, EngineResult } from '../engine/index.js';

interface SearchMessage {
  cmd: 'search';
  board: Board;
  color: Cell;
  depth?: number;
  timeLimitMs?: number;
  requestId: string;
}

interface StopMessage {
  cmd: 'stop';
}

type WorkerMessage = SearchMessage | StopMessage;

interface InfoResponse {
  type: 'info';
  nodes: number;
  depth: number;
  bestMoveSoFar: string;
  timeMs: number;
  requestId: string;
}

interface ResultResponse {
  type: 'result';
  result: EngineResult;
  requestId: string;
}

interface ErrorResponse {
  type: 'error';
  error: string;
  requestId: string;
}

type WorkerResponse = InfoResponse | ResultResponse | ErrorResponse;

let currentSearch: Promise<EngineResult> | null = null;
let shouldStop = false;

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  
  if (message.cmd === 'stop') {
    shouldStop = true;
    return;
  }
  
  if (message.cmd === 'search') {
    try {
      shouldStop = false;
      
      // Send initial info
      const infoResponse: InfoResponse = {
        type: 'info',
        nodes: 0,
        depth: 0,
        bestMoveSoFar: '',
        timeMs: 0,
        requestId: message.requestId
      };
      self.postMessage(infoResponse);
      
      // Run the search with progress callback
      currentSearch = engineSearch(message.board, message.color, {
        depth: message.depth,
        timeLimitMs: message.timeLimitMs
      }, (progress) => {
        if (!shouldStop) {
          const progressInfo: InfoResponse = {
            type: 'info',
            nodes: progress.nodes,
            depth: progress.depth,
            bestMoveSoFar: progress.bestMove,
            timeMs: progress.timeMs,
            requestId: message.requestId
          };
          self.postMessage(progressInfo);
        }
      });
      
      const result = await currentSearch;
      
      if (!shouldStop) {
        const resultResponse: ResultResponse = {
          type: 'result',
          result,
          requestId: message.requestId
        };
        self.postMessage(resultResponse);
      }
      
    } catch (error) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: message.requestId
      };
      self.postMessage(errorResponse);
    } finally {
      currentSearch = null;
    }
  }
};

// Export types for the main thread
export type { WorkerMessage, WorkerResponse, InfoResponse, ResultResponse, ErrorResponse };