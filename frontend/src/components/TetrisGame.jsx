import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchTetrisLeaderboard,
  fetchTetrisProfile,
  submitTetrisScore
} from '../services/tetrisService';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;
const PREVIEW_SIZE = 4;
const LEADERBOARD_LIMIT = 10;

// Classic NES Tetris color palette (cycles every 10 levels)
const LEVEL_PALETTES = [
  { primary: '#2038ec', secondary: '#00b0f0' }, // 0 - blue
  { primary: '#1cd000', secondary: '#b0e000' }, // 1 - green
  { primary: '#d82888', secondary: '#f888b0' }, // 2 - pink
  { primary: '#009898', secondary: '#58d8d8' }, // 3 - teal
  { primary: '#e02800', secondary: '#f87058' }, // 4 - red
  { primary: '#58208c', secondary: '#a060e0' }, // 5 - purple
  { primary: '#202020', secondary: '#808080' }, // 6 - black
  { primary: '#b82800', secondary: '#f86830' }, // 7 - orange
  { primary: '#2038ec', secondary: '#ec3880' }, // 8
  { primary: '#b82800', secondary: '#58d8d8' }  // 9
];

const TetrisGlobalStyle = createGlobalStyle`
  .tetris-retro, .tetris-retro * {
    font-family: 'Press Start 2P', monospace !important;
  }
`;

const flash = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const flicker = keyframes`
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 0.96; }
  20%, 24%, 55% { opacity: 0.88; }
`;

const CrtScanlines = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10001;
  mix-blend-mode: multiply;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0.35) 3px,
    rgba(0, 0, 0, 0.35) 4px
  );
  animation: ${flicker} 6s infinite steps(1);
`;

const CrtSubpixel = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10002;
  mix-blend-mode: screen;
  opacity: 0.08;
  background: repeating-linear-gradient(
    to right,
    #ff0000 0px,
    #ff0000 1px,
    #00ff00 1px,
    #00ff00 2px,
    #0000ff 2px,
    #0000ff 3px
  );
`;

const CrtVignette = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10003;
  background: radial-gradient(
    ellipse at center,
    transparent 40%,
    rgba(0, 0, 0, 0.6) 100%
  );
  box-shadow: inset 0 0 180px rgba(0, 0, 0, 0.8);
`;

const CrtGlass = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10004;
  background: radial-gradient(
    ellipse at 30% 20%,
    rgba(255, 255, 255, 0.06) 0%,
    transparent 40%
  );
`;

// Elliptical black bezel + heavy inset shadow fakes the rounded glass of a CRT tube.
const CrtBezel = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10005;
  border-radius: 28px / 80px;
  box-shadow:
    inset 0 0 160px 30px rgba(0, 0, 0, 0.9),
    inset 0 0 40px 4px rgba(0, 0, 0, 0.8);
  border: 6px solid #000000;
`;


const GameContainer = styled.div.attrs({ className: 'tetris-retro' })`
  position: fixed;
  inset: 0;
  background: #000000;
  background-image:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 4px),
    radial-gradient(ellipse at center, #0a0a2e 0%, #000000 80%);
  z-index: 9999;
  overflow: hidden;
  padding: 12px;
  color: #ffffff;
  image-rendering: pixelated;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GameLayout = styled.div`
  width: min(1040px, 100%);
  max-height: 100%;
  display: grid;
  grid-template-columns: minmax(180px, 220px) auto minmax(180px, 220px);
  gap: 14px;
  align-items: start;
  justify-content: center;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    justify-items: center;
    overflow: auto;
    max-height: 100vh;
  }
`;

// Classic NES Tetris frame: double border (outer white, inner shadow)
const RetroFrame = styled.section`
  position: relative;
  background: #000000;
  border: 2px solid #ffffff;
  box-shadow:
    inset 0 0 0 2px #000000,
    inset 0 0 0 4px #ffffff,
    0 0 0 2px #000000,
    0 0 20px rgba(0, 176, 240, 0.2);
  padding: 10px 12px;
  color: #ffffff;
`;

const RetroLabel = styled.div`
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #ff7777;
  margin-bottom: 8px;
  text-align: center;
  text-shadow: 2px 2px 0 #000000;
`;

const BoardColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const TitleBlock = styled.div`
  text-align: center;
  padding: 0 8px;
  h1 {
    margin: 0;
    font-size: clamp(14px, 1.8vw, 20px);
    color: #ffffff;
    letter-spacing: 0.08em;
    white-space: nowrap;
    text-shadow:
      2px 2px 0 #e02800,
      4px 4px 0 #000000;
  }
`;

const BoardFrame = styled.div`
  background: #000000;
  padding: 6px;
  border: 2px solid #ffffff;
  box-shadow:
    inset 0 0 0 2px #000000,
    inset 0 0 0 4px #ffffff,
    0 0 0 2px #000000,
    0 0 24px rgba(0, 176, 240, 0.3);
`;

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${BOARD_WIDTH}, ${CELL_SIZE}px);
  grid-template-rows: repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px);
  gap: 0;
  background: #000000;
  position: relative;
`;

const GameCell = styled.div`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background: ${(props) => {
    if (props.$empty) return '#000000';
    if (props.$ghost) return 'transparent';
    return props.$primary || '#2038ec';
  }};
  border: ${(props) => (props.$empty ? '1px solid #0a0a2e' : 'none')};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;

  ${(props) => !props.$empty && !props.$ghost && `
    box-shadow:
      inset 2px 2px 0 ${props.$secondary || '#ffffff'},
      inset -2px -2px 0 rgba(0, 0, 0, 0.6);
  `}

  ${(props) => props.$ghost && `
    border: 2px dashed rgba(255, 255, 255, 0.25);
  `}

  img {
    width: ${CELL_SIZE - 8}px;
    height: ${CELL_SIZE - 8}px;
    object-fit: contain;
    opacity: ${(props) => (props.$ghost ? 0.2 : 1)};
    pointer-events: none;
    filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.6));
  }
`;

const ExitButton = styled.button`
  position: fixed;
  top: 16px;
  right: 16px;
  background: #e02800;
  color: #ffffff;
  border: 3px solid #ffffff;
  box-shadow: 4px 4px 0 #000000;
  padding: 10px 14px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  z-index: 10000;

  &:hover {
    background: #ff4020;
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0 #000000;
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 #000000;
  }
`;

const SideStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-height: 100%;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2px 0;

  .label {
    font-size: 8px;
    color: #00b0f0;
    letter-spacing: 0.08em;
  }

  .value {
    font-size: 13px;
    color: #ffffff;
    font-variant-numeric: tabular-nums;
    text-shadow: 2px 2px 0 #000000;
  }
`;

const PreviewBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${PREVIEW_SIZE}, 18px);
  grid-template-rows: repeat(${PREVIEW_SIZE}, 18px);
  gap: 0;
  justify-content: center;
  margin: 0 auto;
  background: #000000;
  padding: 4px;
  border: 2px solid #ffffff;
`;

const PreviewCell = styled.div`
  width: 18px;
  height: 18px;
  background: ${(props) => (props.$empty ? '#000000' : props.$primary || '#2038ec')};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  ${(props) => !props.$empty && `
    box-shadow:
      inset 1px 1px 0 ${props.$secondary || '#ffffff'},
      inset -1px -1px 0 rgba(0, 0, 0, 0.6);
  `}

  img {
    width: 12px;
    height: 12px;
    object-fit: contain;
    pointer-events: none;
  }
`;

const StatusBanner = styled.div`
  padding: 10px;
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.12em;
  background: ${(props) => props.$background || '#000000'};
  color: ${(props) => props.$color || '#ffffff'};
  border: 2px solid ${(props) => props.$color || '#ffffff'};
  animation: ${(props) => (props.$blink ? flash : 'none')} 0.8s infinite;
  line-height: 1.5;
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 480px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #00b0f0; }
`;

const LeaderboardRow = styled.div`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  padding: 5px 4px;
  background: ${(props) => (props.$highlight ? '#2038ec' : 'transparent')};
  border-left: 3px solid ${(props) => {
    if (props.$highlight) return '#ffff00';
    if (props.$rank === 1) return '#ffff00';
    if (props.$rank === 2) return '#c0c0c0';
    if (props.$rank === 3) return '#e08040';
    return 'transparent';
  }};
  font-size: 9px;
  letter-spacing: 0.04em;

  .rank {
    color: ${(props) => {
      if (props.$rank === 1) return '#ffff00';
      if (props.$rank === 2) return '#c0c0c0';
      if (props.$rank === 3) return '#e08040';
      return '#00b0f0';
    }};
  }

  .name {
    min-width: 0;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .score {
    color: #ffffff;
    font-variant-numeric: tabular-nums;
  }
`;

const EmptyMessage = styled.div`
  padding: 14px 8px;
  color: #888888;
  font-size: 9px;
  line-height: 1.7;
  text-align: center;
`;

const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  font-size: 7px;
  color: #ffffff;
  line-height: 1.3;

  .key {
    color: #ffff00;
    text-align: right;
  }

  .action {
    color: #ffffff;
  }
`;

const FooterNote = styled.div`
  font-size: 8px;
  color: #888888;
  line-height: 1.6;
  text-align: center;
  padding: 4px;
`;

const BLOCK_LOGOS = {
  I: '/images/openai-logo.png',
  O: '/images/google.png',
  T: '/images/claude-logo.png',
  S: '/images/gemini-logo.png',
  Z: '/images/meta-logo.png',
  J: '/images/deepseek-logo.png',
  L: '/images/grok-logo.png'
};

// Brand colors keyed to each logo so blocks read like the AI they represent
const BLOCK_COLORS = {
  I: { primary: '#0d8f6e', secondary: '#4fd6ad' }, // OpenAI teal
  O: { primary: '#f5b400', secondary: '#ffe066' }, // Google yellow
  T: { primary: '#d97757', secondary: '#ffb38c' }, // Claude orange
  S: { primary: '#8b5cf6', secondary: '#c4b5fd' }, // Gemini violet
  Z: { primary: '#1877f2', secondary: '#6aa9ff' }, // Meta blue
  J: { primary: '#0ea5e9', secondary: '#7dd3fc' }, // DeepSeek sky
  L: { primary: '#3f3f46', secondary: '#71717a' }  // Grok slate
};

const TETRIS_SHAPES = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]]
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]]
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]]
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]]
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]]
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]]
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]]
  ]
};

const createEmptyBoard = () => (
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null))
);

const getRandomShape = () => {
  const shapes = Object.keys(TETRIS_SHAPES);
  return shapes[Math.floor(Math.random() * shapes.length)];
};

const createPiece = (shape = getRandomShape()) => {
  const spawnMatrix = TETRIS_SHAPES[shape][0];
  const width = spawnMatrix[0].length;

  return {
    shape,
    rotation: 0,
    x: Math.floor((BOARD_WIDTH - width) / 2),
    y: 0
  };
};

const canMoveOnBoard = (board, piece, dx, dy, rotation = piece.rotation) => {
  const shape = TETRIS_SHAPES[piece.shape][rotation];

  for (let row = 0; row < shape.length; row += 1) {
    for (let col = 0; col < shape[row].length; col += 1) {
      if (!shape[row][col]) {
        continue;
      }

      const newX = piece.x + col + dx;
      const newY = piece.y + row + dy;

      if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
        return false;
      }

      if (newY >= 0 && board[newY][newX]) {
        return false;
      }
    }
  }

  return true;
};

const placePieceOnBoard = (board, piece) => {
  const nextBoard = board.map((row) => [...row]);
  const shape = TETRIS_SHAPES[piece.shape][piece.rotation];

  for (let row = 0; row < shape.length; row += 1) {
    for (let col = 0; col < shape[row].length; col += 1) {
      if (!shape[row][col]) {
        continue;
      }

      const x = piece.x + col;
      const y = piece.y + row;

      if (y >= 0) {
        nextBoard[y][x] = piece.shape;
      }
    }
  }

  return nextBoard;
};

const clearLines = (board) => {
  const remainingRows = board.filter((row) => row.some((cell) => cell === null));
  const linesCleared = BOARD_HEIGHT - remainingRows.length;

  if (linesCleared === 0) {
    return { board, linesCleared: 0 };
  }

  const emptyRows = Array.from({ length: linesCleared }, () => Array(BOARD_WIDTH).fill(null));
  return {
    board: [...emptyRows, ...remainingRows],
    linesCleared
  };
};

const getPreviewMatrix = (shapeKey) => {
  const preview = Array.from({ length: PREVIEW_SIZE }, () => Array(PREVIEW_SIZE).fill(null));
  const shape = TETRIS_SHAPES[shapeKey][0];
  const offsetX = Math.floor((PREVIEW_SIZE - shape[0].length) / 2);
  const offsetY = Math.floor((PREVIEW_SIZE - shape.length) / 2);

  for (let row = 0; row < shape.length; row += 1) {
    for (let col = 0; col < shape[row].length; col += 1) {
      if (shape[row][col]) {
        preview[row + offsetY][col + offsetX] = shapeKey;
      }
    }
  }

  return preview;
};

// NES-style line clear scoring
const SCORE_TABLE = { 1: 40, 2: 100, 3: 300, 4: 1200 };

const TetrisGame = ({ onExit }) => {
  const { user } = useAuth();
  const [board, setBoard] = useState(createEmptyBoard);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPieceShape, setNextPieceShape] = useState(() => getRandomShape());
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');
  const [personalBest, setPersonalBest] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState('');

  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderboardError('');
      const data = await fetchTetrisLeaderboard(LEADERBOARD_LIMIT);
      setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
    } catch (error) {
      setLeaderboardError(error.message || 'Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadInitialData = async () => {
      try {
        const [leaderboardData, profileData] = await Promise.all([
          fetchTetrisLeaderboard(LEADERBOARD_LIMIT),
          user ? fetchTetrisProfile().catch(() => null) : Promise.resolve(null)
        ]);

        if (!isActive) return;

        setLeaderboard(Array.isArray(leaderboardData?.leaderboard) ? leaderboardData.leaderboard : []);
        setPersonalBest(profileData?.highScore || 0);
        setLeaderboardError('');
      } catch (error) {
        if (!isActive) return;
        setLeaderboardError(error.message || 'Failed to load leaderboard');
      } finally {
        if (isActive) setLeaderboardLoading(false);
      }
    };

    setLeaderboardLoading(true);
    loadInitialData();

    const refreshInterval = window.setInterval(() => {
      if (isActive) void loadLeaderboard();
    }, 30000);

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, [loadLeaderboard, user]);

  const persistScore = useCallback(async (finalScore, finalLines, finalLevel) => {
    if (finalScore <= 0) return;

    if (!user) {
      setSubmissionStatus('SIGN IN TO SAVE YOUR SCORE');
      return;
    }

    try {
      const result = await submitTetrisScore({
        score: finalScore,
        lines: finalLines,
        level: finalLevel
      });

      setPersonalBest(result.highScore || finalScore);
      setSubmissionStatus(result.updated ? 'NEW HIGH SCORE!' : 'SCORE SAVED');
      await loadLeaderboard();
    } catch (error) {
      setSubmissionStatus((error.message || 'SYNC FAILED').toUpperCase());
    }
  }, [loadLeaderboard, user]);

  const handleGameOver = useCallback((finalScore, finalLines, finalLevel) => {
    setGameOver(true);
    setPaused(false);
    void persistScore(finalScore, finalLines, finalLevel);
  }, [persistScore]);

  const lockPiece = useCallback((pieceToLock) => {
    const lockedBoard = placePieceOnBoard(board, pieceToLock);
    const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);
    const nextLines = lines + linesCleared;
    const lineScore = SCORE_TABLE[linesCleared] ? SCORE_TABLE[linesCleared] * level : 0;
    const nextScore = score + lineScore;

    setBoard(clearedBoard);
    setLines(nextLines);
    setScore(nextScore);

    const spawnedPiece = createPiece(nextPieceShape);
    if (canMoveOnBoard(clearedBoard, spawnedPiece, 0, 0)) {
      setCurrentPiece(spawnedPiece);
      setNextPieceShape(getRandomShape());
      return;
    }

    setCurrentPiece(null);
    handleGameOver(nextScore, nextLines, level);
  }, [board, handleGameOver, level, lines, nextPieceShape, score]);

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    if (canMoveOnBoard(board, currentPiece, 0, 1)) {
      setCurrentPiece((previous) => ({ ...previous, y: previous.y + 1 }));
      return;
    }

    lockPiece(currentPiece);
  }, [board, currentPiece, gameOver, isPaused, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let dropDistance = 0;
    while (canMoveOnBoard(board, currentPiece, 0, dropDistance + 1)) {
      dropDistance += 1;
    }

    lockPiece({
      ...currentPiece,
      y: currentPiece.y + dropDistance
    });
  }, [board, currentPiece, gameOver, isPaused, lockPiece]);

  const getGhostPosition = useCallback((piece) => {
    if (!piece) return null;

    let dropDistance = 0;
    while (canMoveOnBoard(board, piece, 0, dropDistance + 1)) {
      dropDistance += 1;
    }

    return {
      ...piece,
      y: piece.y + dropDistance
    };
  }, [board]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onExit?.();
      return;
    }

    if (gameOver) return;

    if (event.key === 'p' || event.key === 'P') {
      event.preventDefault();
      setPaused((previous) => !previous);
      return;
    }

    if (isPaused) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (currentPiece && canMoveOnBoard(board, currentPiece, -1, 0)) {
          setCurrentPiece((previous) => ({ ...previous, x: previous.x - 1 }));
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentPiece && canMoveOnBoard(board, currentPiece, 1, 0)) {
          setCurrentPiece((previous) => ({ ...previous, x: previous.x + 1 }));
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        dropPiece();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (currentPiece) {
          const nextRotation = (currentPiece.rotation + 1) % 4;
          if (canMoveOnBoard(board, currentPiece, 0, 0, nextRotation)) {
            setCurrentPiece((previous) => ({ ...previous, rotation: nextRotation }));
          }
        }
        break;
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        hardDrop();
        break;
      default:
        break;
    }
  }, [board, currentPiece, dropPiece, gameOver, hardDrop, isPaused, onExit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (currentPiece || gameOver) return;

    const spawnedPiece = createPiece(nextPieceShape);
    if (canMoveOnBoard(board, spawnedPiece, 0, 0)) {
      setCurrentPiece(spawnedPiece);
      setNextPieceShape(getRandomShape());
      return;
    }

    handleGameOver(score, lines, level);
  }, [board, currentPiece, gameOver, handleGameOver, level, lines, nextPieceShape, score]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      dropPiece();
    }, Math.max(100, 500 - ((level - 1) * 30)));

    return () => window.clearInterval(intervalId);
  }, [dropPiece, level]);

  useEffect(() => {
    setLevel(Math.floor(lines / 10) + 1);
  }, [lines]);

  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);
    const ghostBoard = createEmptyBoard();

    if (currentPiece) {
      const ghostPiece = getGhostPosition(currentPiece);

      if (ghostPiece && ghostPiece.y !== currentPiece.y) {
        const ghostShape = TETRIS_SHAPES[ghostPiece.shape][ghostPiece.rotation];
        for (let row = 0; row < ghostShape.length; row += 1) {
          for (let col = 0; col < ghostShape[row].length; col += 1) {
            if (!ghostShape[row][col]) continue;
            const x = ghostPiece.x + col;
            const y = ghostPiece.y + row;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              ghostBoard[y][x] = ghostPiece.shape;
            }
          }
        }
      }
    }

    if (currentPiece) {
      const shape = TETRIS_SHAPES[currentPiece.shape][currentPiece.rotation];
      for (let row = 0; row < shape.length; row += 1) {
        for (let col = 0; col < shape[row].length; col += 1) {
          if (!shape[row][col]) continue;
          const x = currentPiece.x + col;
          const y = currentPiece.y + row;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            displayBoard[y][x] = currentPiece.shape;
          }
        }
      }
    }

    return displayBoard.map((row, rowIndex) => (
      row.map((cell, colIndex) => {
        const ghostCell = ghostBoard[rowIndex][colIndex];
        const isGhost = !!ghostCell && !cell;
        const shapeKey = cell || ghostCell;
        const colors = shapeKey ? BLOCK_COLORS[shapeKey] : null;

        return (
          <GameCell
            key={`${rowIndex}-${colIndex}`}
            $empty={!shapeKey}
            $ghost={isGhost}
            $primary={colors?.primary}
            $secondary={colors?.secondary}
          >
            {shapeKey && (
              <img
                src={BLOCK_LOGOS[shapeKey]}
                alt={shapeKey}
                draggable={false}
              />
            )}
          </GameCell>
        );
      })
    ));
  };

  const previewMatrix = getPreviewMatrix(nextPieceShape);
  const palette = LEVEL_PALETTES[(level - 1) % LEVEL_PALETTES.length];

  return (
    <GameContainer>
      <TetrisGlobalStyle />
      <ExitButton onClick={onExit}>EXIT</ExitButton>
      <CrtScanlines />
      <CrtSubpixel />
      <CrtVignette />
      <CrtGlass />
      <CrtBezel />

      <GameLayout>
        {/* LEFT: LEADERBOARD */}
        <RetroFrame>
          <RetroLabel>HIGH SCORES</RetroLabel>
          {leaderboardLoading ? (
            <EmptyMessage>LOADING...</EmptyMessage>
          ) : leaderboardError ? (
            <EmptyMessage style={{ color: '#ff7777' }}>{leaderboardError.toUpperCase()}</EmptyMessage>
          ) : leaderboard.length === 0 ? (
            <EmptyMessage>NO SCORES YET.<br />BE THE FIRST!</EmptyMessage>
          ) : (
            <LeaderboardList>
              {leaderboard.map((entry, index) => (
                <LeaderboardRow
                  key={`${entry.username}-${entry.score}-${index}`}
                  $highlight={entry.username === user?.username}
                  $rank={index + 1}
                >
                  <div className="rank">#{String(index + 1).padStart(2, '0')}</div>
                  <div className="name">{entry.username}</div>
                  <div className="score">{entry.score.toLocaleString()}</div>
                </LeaderboardRow>
              ))}
            </LeaderboardList>
          )}
        </RetroFrame>

        {/* CENTER: BOARD */}
        <BoardColumn>
          <TitleBlock>
            <h1>SCULPTOR TETRIS</h1>
          </TitleBlock>

          <BoardFrame style={{ boxShadow: `inset 0 0 0 2px #000, inset 0 0 0 4px #fff, 0 0 0 2px #000, 0 0 24px ${palette.secondary}66` }}>
            <GameBoard>
              {renderBoard()}
            </GameBoard>
          </BoardFrame>
        </BoardColumn>

        {/* RIGHT: STATS / NEXT / CONTROLS */}
        <SideStack>
          <RetroFrame>
            <RetroLabel>NEXT</RetroLabel>
            <PreviewBoard>
              {previewMatrix.flatMap((row, rowIndex) => (
                row.map((cell, colIndex) => {
                  const colors = cell ? BLOCK_COLORS[cell] : null;
                  return (
                    <PreviewCell
                      key={`${rowIndex}-${colIndex}`}
                      $empty={!cell}
                      $primary={colors?.primary}
                      $secondary={colors?.secondary}
                    >
                      {cell && (
                        <img src={BLOCK_LOGOS[cell]} alt={cell} draggable={false} />
                      )}
                    </PreviewCell>
                  );
                })
              ))}
            </PreviewBoard>
          </RetroFrame>

          <RetroFrame>
            <RetroLabel>STATISTICS</RetroLabel>
            <StatRow>
              <span className="label">SCORE</span>
              <span className="value">{score.toLocaleString()}</span>
            </StatRow>
            <StatRow>
              <span className="label">LINES</span>
              <span className="value">{lines}</span>
            </StatRow>
            <StatRow>
              <span className="label">LEVEL</span>
              <span className="value">{level}</span>
            </StatRow>
            <StatRow>
              <span className="label">BEST</span>
              <span className="value">{personalBest.toLocaleString()}</span>
            </StatRow>
          </RetroFrame>

          {gameOver && (
            <StatusBanner $background="#000000" $color="#ff4040" $blink>
              GAME OVER
            </StatusBanner>
          )}

          {isPaused && !gameOver && (
            <StatusBanner $background="#000000" $color="#ffff00" $blink>
              PAUSED
            </StatusBanner>
          )}

          {submissionStatus && (
            <StatusBanner $background="#000000" $color="#00b0f0">
              {submissionStatus}
            </StatusBanner>
          )}

          <RetroFrame>
            <RetroLabel>CONTROLS</RetroLabel>
            <ControlGrid>
              <span className="key">←→</span><span className="action">MOVE</span>
              <span className="key">↑</span><span className="action">ROTATE</span>
              <span className="key">↓</span><span className="action">SOFT DROP</span>
              <span className="key">SPC</span><span className="action">HARD DROP</span>
              <span className="key">P</span><span className="action">PAUSE</span>
              <span className="key">ESC</span><span className="action">EXIT</span>
            </ControlGrid>
          </RetroFrame>

          <FooterNote>
            {user
              ? `PLAYER: ${user.username.toUpperCase()}`
              : 'SIGN IN TO SAVE SCORES'}
          </FooterNote>
        </SideStack>
      </GameLayout>
    </GameContainer>
  );
};

export default TetrisGame;
