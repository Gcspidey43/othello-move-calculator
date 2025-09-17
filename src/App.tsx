/**
 * Main Othello Next Move Application
 * Integrates board editor, controls, engine worker, and results display
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BoardEditor } from './components/BoardEditor.js';
import { Controls } from './components/Controls.js';
import { ResultPane } from './components/ResultPane.js';
import { HistoryPanel, type HistoryEntry } from './components/HistoryPanel.js';
import {
  createStartingBoard,
  generateLegalMoves,
  applyMove,
  countPieces,
  serializeBoard,
  deserializeBoard,
  type Board,
  type Cell,
  type Move,
  type EngineResult
} from './engine/index.js';
import type { WorkerMessage, WorkerResponse } from './worker/engine-worker.js';

interface GameState {
  board: Board;
  sideToMove: Cell;
  legalMoves: Move[];
  suggestedMove: Move | null;
  result: EngineResult | null;
  isCalculating: boolean;
  progress: { nodes: number; timeMs: number; depth: number } | undefined;
}

function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialBoard = createStartingBoard();
    return {
      board: initialBoard,
      sideToMove: 1, // Black starts
      legalMoves: generateLegalMoves(initialBoard, 1),
      suggestedMove: null,
      result: null,
      isCalculating: false,
      progress: undefined
    };
  });
  
  const [depth, setDepth] = useState(6);
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef<string>('');
  
  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker/engine-worker.ts', import.meta.url), {
      type: 'module'
    });
    
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      
      if (response.requestId !== requestIdRef.current) {
        return; // Ignore old requests
      }
      
      if (response.type === 'info') {
        setGameState(prev => ({
          ...prev,
          progress: {
            nodes: response.nodes,
            timeMs: response.timeMs,
            depth: response.depth
          }
        }));
      } else if (response.type === 'result') {
        setGameState(prev => ({
          ...prev,
          result: response.result,
          suggestedMove: response.result.bestMove,
          isCalculating: false,
          progress: undefined
        }));
      } else if (response.type === 'error') {
        console.error('Worker error:', response.error);
        setGameState(prev => ({
          ...prev,
          isCalculating: false,
          progress: undefined
        }));
      }
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  
  // Update legal moves when board or side changes
  useEffect(() => {
    const legalMoves = generateLegalMoves(gameState.board, gameState.sideToMove);
    setGameState(prev => ({ ...prev, legalMoves }));
  }, [gameState.board, gameState.sideToMove]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      
      switch (event.key.toLowerCase()) {
        case 'c':
          if (!gameState.isCalculating) {
            handleCalculateMove();
          }
          break;
        case 's':
          if (gameState.isCalculating) {
            handleStopCalculation();
          }
          break;
        case 'r':
          handleReset();
          break;
        case 'enter':
          event.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isCalculating]);
  
  const handleCellClick = useCallback((row: number, col: number) => {
    setGameState(prev => {
      // Check if this is a legal move
      const isLegal = prev.legalMoves.some(move => move && move.r === row && move.c === col);
      
      // If it's a legal move, apply it immediately with proper flipping
      if (isLegal) {
        const { board: newBoard, flips } = applyMove(prev.board, { r: row, c: col }, prev.sideToMove);
        
        // Add to history
        const newHistoryEntry: HistoryEntry = {
          move: { r: row, c: col },
          color: prev.sideToMove as 1 | -1,
          flips
        };
        
        setHistory(prevHistory => [...prevHistory.slice(0, historyIndex), newHistoryEntry]);
        setHistoryIndex(prevIndex => prevIndex + 1);
        
        return {
          ...prev,
          board: newBoard,
          sideToMove: (-prev.sideToMove) as Cell,
          suggestedMove: null,
          result: null
        };
      }
      
      // Otherwise, just edit the board (for setting up positions)
      const newBoard = prev.board.map(r => [...r]);
      
      // Place the piece of the player whose turn it is
      if (newBoard[row][col] === 0) {
        newBoard[row][col] = prev.sideToMove; // Place current player's piece
      } else {
        newBoard[row][col] = 0; // empty
      }
      
      return {
        ...prev,
        board: newBoard,
        suggestedMove: null,
        result: null
      };
    });
  }, [historyIndex]);
  
  const handleCalculateMove = useCallback(() => {
    if (gameState.isCalculating || !workerRef.current) return;
    
    requestIdRef.current = Math.random().toString(36);
    
    const message: WorkerMessage = {
      cmd: 'search',
      board: gameState.board,
      color: gameState.sideToMove,
      depth,
      timeLimitMs,
      requestId: requestIdRef.current
    };
    
    setGameState(prev => ({
      ...prev,
      isCalculating: true,
      progress: { nodes: 0, timeMs: 0, depth: 0 },
      suggestedMove: null,
      result: null
    }));
    
    workerRef.current.postMessage(message);
  }, [gameState.board, gameState.sideToMove, gameState.isCalculating, depth, timeLimitMs]);
  
  const handleStopCalculation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ cmd: 'stop' });
    }
    setGameState(prev => ({
      ...prev,
      isCalculating: false,
      progress: undefined
    }));
  }, []);
  
  const handleApplyMove = useCallback(() => {
    if (!gameState.suggestedMove) return;
    
    const { board: newBoard, flips } = applyMove(gameState.board, gameState.suggestedMove, gameState.sideToMove);
    
    // Add to history
    const newHistoryEntry: HistoryEntry = {
      move: gameState.suggestedMove,
      color: gameState.sideToMove as 1 | -1,
      flips
    };
    
    setHistory(prev => [...prev.slice(0, historyIndex), newHistoryEntry]);
    setHistoryIndex(prev => prev + 1);
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      sideToMove: (-prev.sideToMove) as Cell,
      suggestedMove: null,
      result: null
    }));
  }, [gameState.suggestedMove, gameState.board, gameState.sideToMove, historyIndex]);
  
  const handleReset = useCallback(() => {
    const initialBoard = createStartingBoard();
    setGameState({
      board: initialBoard,
      sideToMove: 1,
      legalMoves: generateLegalMoves(initialBoard, 1),
      suggestedMove: null,
      result: null,
      isCalculating: false,
      progress: undefined
    });
    setHistory([]);
    setHistoryIndex(0);
  }, []);
  
  const handleExport = useCallback(() => {
    const data = {
      board: serializeBoard(gameState.board),
      sideToMove: gameState.sideToMove,
      history: history.slice(0, historyIndex)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'othello-position.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [gameState.board, gameState.sideToMove, history, historyIndex]);
  
  const handleImport = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      const board = deserializeBoard(parsed.board);
      const sideToMove = parsed.sideToMove || 1;
      const importedHistory = parsed.history || [];
      
      setGameState({
        board,
        sideToMove,
        legalMoves: generateLegalMoves(board, sideToMove),
        suggestedMove: null,
        result: null,
        isCalculating: false,
        progress: undefined
      });
      
      setHistory(importedHistory);
      setHistoryIndex(importedHistory.length);
    } catch (error) {
      alert('Invalid file format');
    }
  }, []);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      // Rebuild board state from history
      let board = createStartingBoard();
      let sideToMove: Cell = 1;
      
      for (let i = 0; i < historyIndex - 1; i++) {
        const entry = history[i];
        const result = applyMove(board, entry.move, entry.color);
        board = result.board;
        sideToMove = (-entry.color) as Cell;
      }
      
      setGameState(prev => ({
        ...prev,
        board,
        sideToMove,
        suggestedMove: null,
        result: null
      }));
    }
  }, [historyIndex, history]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length) {
      const entry = history[historyIndex];
      const { board: newBoard } = applyMove(gameState.board, entry.move, entry.color);
      
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        sideToMove: (-entry.color) as Cell,
        suggestedMove: null,
        result: null
      }));
      
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history, gameState.board]);
  
  const handleJumpTo = useCallback((index: number) => {
    // Rebuild board state from history up to index
    let board = createStartingBoard();
    let sideToMove: Cell = 1;
    
    for (let i = 0; i < index; i++) {
      const entry = history[i];
      const result = applyMove(board, entry.move, entry.color);
      board = result.board;
      sideToMove = (-entry.color) as Cell;
    }
    
    setGameState(prev => ({
      ...prev,
      board,
      sideToMove,
      suggestedMove: null,
      result: null
    }));
    
    setHistoryIndex(index);
  }, [history]);
  
  const pieceCount = countPieces(gameState.board);
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Othello Next Move
          </h1>
          <p className="text-gray-600">
            Click cells to set up the board, choose a side, and calculate the best move.
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Board and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Board */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Game Board</h2>
                <div className="text-sm text-gray-600">
                  Black: {pieceCount.black} | White: {pieceCount.white}
                </div>
              </div>
              
              <div className="flex justify-center">
                <BoardEditor
                  board={gameState.board}
                  onCellClick={handleCellClick}
                  legalMoves={gameState.legalMoves}
                  suggestedMove={gameState.suggestedMove}
                />
              </div>
              
              {gameState.legalMoves.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-center">
                  <span className="text-yellow-800">
                    No legal moves for {gameState.sideToMove === 1 ? 'Black' : 'White'}. 
                    {generateLegalMoves(gameState.board, -gameState.sideToMove as Cell).length === 0 
                      ? ' Game Over!' 
                      : ' Must pass turn.'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Controls</h2>
              <Controls
                sideToMove={gameState.sideToMove}
                onSideChange={(side) => setGameState(prev => ({ ...prev, sideToMove: side }))}
                depth={depth}
                onDepthChange={setDepth}
                timeLimitMs={timeLimitMs}
                onTimeLimitChange={setTimeLimitMs}
                onApplyMove={handleApplyMove}
                onReset={handleReset}
                onExport={handleExport}
                onImport={handleImport}
                hasSuggestedMove={gameState.suggestedMove !== null}
              />
            </div>
          </div>
          
          {/* Right Column - Results, Calculate Move Button, and History */}
          <div className="space-y-6">
            {/* Results */}
            <ResultPane
              result={gameState.result}
              isCalculating={gameState.isCalculating}
              progress={gameState.progress}
            />
            
            {/* Calculate Move Button */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                onClick={handleCalculateMove}
                disabled={gameState.isCalculating}
                title="Calculate Move (C)"
              >
                {gameState.isCalculating ? 'Calculating...' : 'Calculate Move'}
              </button>
              
              {gameState.isCalculating && (
                <button
                  className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                  onClick={handleStopCalculation}
                  title="Stop (S)"
                >
                  Stop
                </button>
              )}
              
              {gameState.suggestedMove && (
                <button
                  className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                  onClick={handleApplyMove}
                >
                  Apply Move
                </button>
              )}
            </div>
            
            {/* History */}
            <HistoryPanel
              history={history}
              currentIndex={historyIndex}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onJumpTo={handleJumpTo}
            />
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Built with React + TypeScript + Vite. Engine uses minimax with alpha-beta pruning.</p>
          <p className="mt-1">
            Keyboard shortcuts: C = Calculate, S = Stop, R = Reset
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;