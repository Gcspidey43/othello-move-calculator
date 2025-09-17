/**
 * Core types for the Othello game engine
 */

/** Cell state: 0 = empty, 1 = black, -1 = white */
export type Cell = 0 | 1 | -1;

/** 8x8 game board */
export type Board = Cell[][];

/** Move coordinates or null for pass */
export type Move = { r: number; c: number } | null;

/** Engine search result */
export interface EngineResult {
  bestMove: Move;
  bestMoveAlgebraic: string;
  flips: number;
  score: number;
  pv: string[];
  nodes: number;
  timeMs: number;
  depthSearched: number;
}

/** Search options */
export interface SearchOptions {
  depth?: number;
  timeLimitMs?: number;
}

/** Transposition table entry */
export interface TTEntry {
  key: bigint;
  depth: number;
  value: number;
  flag: 'EXACT' | 'LOWER' | 'UPPER';
  bestMove: Move;
}

/** Piece counts */
export interface PieceCount {
  black: number;
  white: number;
}