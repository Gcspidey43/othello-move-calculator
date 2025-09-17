# Othello Next Move

A complete client-side web application for analyzing Othello/Reversi positions and calculating the best next move. Built with React, TypeScript, and Vite, featuring a sophisticated game engine with minimax search, alpha-beta pruning, and advanced evaluation heuristics.

## Features

- **Interactive Board Editor**: Click cells to set up any 8×8 Othello position
- **Powerful AI Engine**: Minimax search with alpha-beta pruning, iterative deepening, and transposition tables
- **Real-time Analysis**: Calculate best moves with configurable search depth and time limits
- **Comprehensive Evaluation**: Multi-factor position evaluation including:
  - Piece-square tables for positional value
  - Mobility analysis
  - Frontier disc evaluation
  - Stability analysis
  - Material balance
- **Move History**: Full undo/redo functionality with move navigation
- **Import/Export**: Save and load positions in JSON format
- **Web Worker Integration**: CPU-intensive calculations run in background without blocking UI

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd othello-next-move

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Development Server

Run `npm run dev` and open http://localhost:5173 in your browser.

## Usage

### Setting Up the Board

1. **Click any square** to cycle through: Empty → Black → White → Empty
2. **Right-click** for faster toggling between Black/White (skips empty)
3. **Use coordinate labels**: Columns a-h (left to right), Rows 1-8 (top to bottom)

### Calculating Moves

1. **Choose side to move**: Click Black (●) or White (○) button
2. **Adjust search settings**:
   - **Depth**: 1-12 plies (default: 6)
   - **Time Limit**: 500-10000ms (default: 2000ms)
3. **Click "Calculate Move"** to start analysis
4. **View results** in the analysis pane:
   - Best move in algebraic notation (e.g., "d3")
   - Evaluation score (positive = good for current player)
   - Search statistics (nodes, time, depth reached)
   - Principal variation (best line of play)

### Applying Moves

1. After calculation, the suggested move will be highlighted on the board
2. Click **"Apply Move"** to make the move and flip pieces
3. The move will be added to the history panel

### Managing History

- **Undo/Redo**: Navigate through move history
- **Jump to Position**: Click any move in the history to jump to that position
- **View Details**: See move notation, flipped pieces, and player for each move

### Import/Export

- **Export**: Save current position and history as JSON file
- **Import**: Load position from JSON file

### Keyboard Shortcuts

- **C**: Calculate move
- **S**: Stop calculation
- **R**: Reset to starting position

## Engine Details

### Search Algorithm

The engine uses **minimax** with **alpha-beta pruning** and several optimizations:

- **Iterative Deepening**: Searches progressively deeper depths, respecting time limits
- **Transposition Table**: Zobrist hashing with 64-bit keys for position caching
- **Move Ordering**: Prioritizes corner moves, high-flip moves, and mobility-reducing moves
- **Principal Variation**: Tracks and returns the best line of play

### Evaluation Function

The position evaluation combines five weighted factors:

```
evaluation = 
  1.0 × piece_square_score +
  78.0 × mobility_normalized +
  -50.0 × frontier_normalized +
  100.0 × stability_count +
  1.0 × disc_difference
```

#### 1. Piece-Square Tables
Positional values for each square, emphasizing corners and edges:

```
[100, -20, 10,  5,  5, 10, -20, 100]
[-20, -50, -2, -2, -2, -2, -50, -20]
[10,  -2,  -1, -1, -1, -1,  -2,  10]
[5,   -2,  -1, -1, -1, -1,  -2,   5]
[5,   -2,  -1, -1, -1, -1,  -2,   5]
[10,  -2,  -1, -1, -1, -1,  -2,  10]
[-20, -50, -2, -2, -2, -2, -50, -20]
[100, -20, 10,  5,  5, 10, -20, 100]
```

#### 2. Mobility
Normalized difference in legal moves:
```
mobility = 100 × (my_moves - opp_moves) / (my_moves + opp_moves + 1)
```

#### 3. Frontier Discs
Penalizes pieces adjacent to empty squares (vulnerable to capture):
```
frontier = -50 × (my_frontier - opp_frontier) / (my_frontier + opp_frontier + 1)
```

#### 4. Stability
Rewards "stable" discs that cannot be flipped:
- **Corner-based algorithm**: Starts from occupied corners
- **Iterative expansion**: Marks discs stable if they connect to stable chains
- **Edge connectivity**: Considers paths to board edges

#### 5. Disc Difference
Simple material count difference (low weight as it's less important in middle game).

### Configuration

Evaluation weights can be modified in `src/engine/evaluation.ts`:

```typescript
export const EVAL_WEIGHTS = {
  PIECE_SQUARE: 1.0,
  MOBILITY: 78.0,
  FRONTIER: -50.0,
  STABILITY: 100.0,
  DISC_DIFF: 1.0
};
```

## Example Workflows

### 1. Analyze Starting Position

1. Load the app (starts with standard Othello opening)
2. Ensure **Black** is selected as side to move
3. Click **"Calculate Move"**
4. Observe that 4 legal moves are available
5. Review the suggested move and evaluation

### 2. Custom Position Analysis

1. Click **"Reset"** to clear the board
2. Set up a custom position by clicking squares
3. Choose the side to move
4. Set depth to 4 and time limit to 1000ms
5. Click **"Calculate Move"**
6. View the best move overlay and principal variation
7. Click **"Apply Move"** to see the result

### 3. Position Import/Export

1. Set up an interesting position
2. Click **"Export"** to save as JSON
3. Modify the position
4. Click **"Import"** and select your saved file
5. Position and history are restored

## Example Position Format

```json
{
  "board": "........\n........\n........\n...WB...\n...BW...\n........\n........\n........",
  "sideToMove": 1,
  "history": [
    {
      "move": { "r": 2, "c": 3 },
      "color": 1,
      "flips": 1
    }
  ]
}
```

**Board notation**: 
- `.` = empty square
- `B` = black piece  
- `W` = white piece
- 8 rows × 8 columns, newline-separated

**Coordinates**:
- Rows: 0-7 (top to bottom, displayed as 8-1)
- Columns: 0-7 (left to right, displayed as a-h)

## Architecture

```
src/
├── engine/           # Game engine (TypeScript)
│   ├── types.ts      # Core types and interfaces
│   ├── board.ts      # Board logic and move generation  
│   ├── evaluation.ts # Position evaluation functions
│   ├── zobrist.ts    # Hash functions for transposition table
│   ├── search.ts     # Minimax search with alpha-beta
│   └── index.ts      # Public API exports
├── worker/           # Web Worker for background computation
│   └── engine-worker.ts
├── components/       # React UI components
│   ├── BoardEditor.tsx    # 8×8 interactive board
│   ├── Controls.tsx       # Game controls and settings
│   ├── ResultPane.tsx     # Analysis results display
│   └── HistoryPanel.tsx   # Move history with undo/redo
├── App.tsx          # Main application component
└── main.tsx         # React entry point
```

## Testing

Run the test suite:

```bash
npm test
```

**Test Coverage**:
- ✅ Legal move generation returns 4 moves for starting position
- ✅ Move application correctly flips pieces
- ✅ Board serialization/deserialization roundtrip
- ✅ Zobrist hash consistency for identical positions
- ✅ Engine search returns legal moves with valid scores
- ✅ Engine handles "pass" situations correctly
- ✅ Time limit enforcement
- ✅ Search result consistency

## Performance

**Typical Performance** (depth 6, 2000ms limit):
- **Nodes/second**: 50,000-200,000
- **Search depth**: 6-8 plies
- **Response time**: 100-2000ms
- **Memory usage**: <50MB

**Optimizations**:
- Web Worker prevents UI blocking
- Transposition table reduces duplicate work
- Move ordering improves alpha-beta pruning
- Iterative deepening ensures timely responses

## Browser Compatibility

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

**Requirements**:
- Web Workers support
- ES2020 features
- BigInt for hash keys

## License

MIT License - see LICENSE file for details.

---

**Built with**:
- React 18 + TypeScript for UI
- Vite for fast development and building
- Tailwind CSS for styling
- Jest for testing
- Web Workers for background processing