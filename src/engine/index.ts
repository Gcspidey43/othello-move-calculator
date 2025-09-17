/**
 * Main engine module exports
 * Provides the stable API for the Othello game engine
 */

export type { Cell, Board, Move, EngineResult, SearchOptions, PieceCount } from './types.js';

export {
  createStartingBoard,
  generateLegalMoves,
  applyMove,
  countPieces,
  serializeBoard,
  deserializeBoard,
  moveToAlgebraic,
  algebraicToMove
} from './board.js';

export { engineSearch } from './search.js';
export { evaluatePosition, EVAL_WEIGHTS } from './evaluation.js';