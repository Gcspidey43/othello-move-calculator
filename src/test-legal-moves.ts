import { createStartingBoard, generateLegalMoves } from './engine/board';

const board = createStartingBoard();
console.log('Board setup:');
for (let r = 0; r < 8; r++) {
  let row = '';
  for (let c = 0; c < 8; c++) {
    if (board[r][c] === 0) row += '.';
    else if (board[r][c] === 1) row += 'B';
    else if (board[r][c] === -1) row += 'W';
  }
  console.log(row);
}

const blackMoves = generateLegalMoves(board, 1);
console.log('Legal moves for black:', blackMoves);

const whiteMoves = generateLegalMoves(board, -1);
console.log('Legal moves for white:', whiteMoves);