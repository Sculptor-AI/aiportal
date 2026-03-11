import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchTetrisLeaderboard,
  fetchTetrisProfile,
  submitTetrisScore
} from '../services/tetrisService';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;
const PREVIEW_SIZE = 4;
const LEADERBOARD_LIMIT = 10;

const GameContainer = styled.div`
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(42, 84, 160, 0.22), transparent 42%),
    linear-gradient(180deg, #06070a 0%, #020304 100%);
  z-index: 9999;
  overflow: auto;
  padding: 72px 28px 28px;
`;

const GameLayout = styled.div`
  width: min(1240px, 100%);
  min-height: calc(100vh - 100px);
  margin: 0 auto;
  padding-left: clamp(24px, 4vw, 72px);
  display: grid;
  grid-template-columns: minmax(240px, 280px) auto minmax(220px, 260px);
  gap: clamp(24px, 4vw, 48px);
  align-items: start;

  @media (max-width: 1120px) {
    padding-left: 0;
    grid-template-columns: 1fr;
    justify-items: center;
  }
`;

const Panel = styled.section`
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(11, 14, 20, 0.88);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  color: #f5f7fb;
`;

const LeaderboardPanel = styled(Panel)`
  padding: 20px 18px;
`;

const BoardColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const BoardTitle = styled.div`
  color: #f5f7fb;
  text-align: center;

  h2 {
    margin: 0;
    font-size: 2rem;
    letter-spacing: 0.08em;
  }

  p {
    margin: 8px 0 0;
    font-size: 0.95rem;
    color: rgba(245, 247, 251, 0.72);
  }
`;

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${BOARD_WIDTH}, ${CELL_SIZE}px);
  grid-template-rows: repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px);
  gap: 1px;
  background: #141922;
  border: 3px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 12px;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
`;

const GameCell = styled.div`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background: ${(props) => (props.empty ? '#050607' : '#2a3140')};
  border: 1px solid ${(props) => (props.ghost ? 'rgba(255, 255, 255, 0.28)' : '#3a4355')};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 6px;

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    opacity: ${(props) => (props.ghost ? 0.28 : 1)};
    filter: ${(props) => (props.ghost ? 'grayscale(0.2)' : 'none')};
    pointer-events: none;
  }
`;

const RightSidebar = styled(Panel)`
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const ExitButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ff4b55;
  color: white;
  border: none;
  padding: 10px 18px;
  cursor: pointer;
  font-size: 15px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.04em;

  &:hover {
    background: #ff6870;
  }
`;

const SectionHeading = styled.h3`
  margin: 0 0 12px;
  font-size: 0.92rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 247, 251, 0.7);
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const StatCard = styled.div`
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);

  .label {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(245, 247, 251, 0.55);
  }

  .value {
    margin-top: 8px;
    font-size: 1.45rem;
    font-weight: 700;
  }
`;

const PreviewCard = styled.div`
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const PreviewBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${PREVIEW_SIZE}, 24px);
  grid-template-rows: repeat(${PREVIEW_SIZE}, 24px);
  gap: 4px;
  justify-content: center;
`;

const PreviewCell = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${(props) => (props.empty ? '#0a0c10' : '#2a3140')};
  border: 1px solid ${(props) => (props.empty ? 'rgba(255, 255, 255, 0.04)' : '#3a4355')};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 18px;
    height: 18px;
    object-fit: contain;
    pointer-events: none;
  }
`;

const StatusBadge = styled.div`
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 700;
  background: ${(props) => props.$background || 'rgba(255, 255, 255, 0.08)'};
  color: ${(props) => props.$color || '#f5f7fb'};
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LeaderboardRow = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-radius: 14px;
  background: ${(props) => (props.$highlight ? 'rgba(85, 168, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${(props) => (props.$highlight ? 'rgba(85, 168, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)')};

  .rank {
    font-weight: 800;
    color: rgba(245, 247, 251, 0.7);
  }

  .name {
    min-width: 0;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .score {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
`;

const EmptyState = styled.div`
  padding: 18px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(245, 247, 251, 0.65);
  line-height: 1.5;
`;

const ControlList = styled.div`
  display: grid;
  gap: 8px;
  font-size: 0.95rem;
  color: rgba(245, 247, 251, 0.74);
`;

const SmallText = styled.div`
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(245, 247, 251, 0.7);
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
      setLeaderboardLoading(true);
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

        if (!isActive) {
          return;
        }

        setLeaderboard(Array.isArray(leaderboardData?.leaderboard) ? leaderboardData.leaderboard : []);
        setPersonalBest(profileData?.highScore || 0);
        setLeaderboardError('');
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLeaderboardError(error.message || 'Failed to load leaderboard');
      } finally {
        if (isActive) {
          setLeaderboardLoading(false);
        }
      }
    };

    setLeaderboardLoading(true);
    loadInitialData();

    const refreshInterval = window.setInterval(() => {
      if (isActive) {
        void loadLeaderboard();
      }
    }, 30000);

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, [loadLeaderboard, user]);

  const persistScore = useCallback(async (finalScore, finalLines, finalLevel) => {
    if (finalScore <= 0) {
      return;
    }

    if (!user) {
      setSubmissionStatus('Sign in with an account to save leaderboard scores.');
      return;
    }

    try {
      const result = await submitTetrisScore({
        score: finalScore,
        lines: finalLines,
        level: finalLevel
      });

      setPersonalBest(result.highScore || finalScore);
      setSubmissionStatus(result.updated ? 'New personal best saved to the leaderboard.' : 'Score synced. Personal best unchanged.');
      await loadLeaderboard();
    } catch (error) {
      setSubmissionStatus(error.message || 'Failed to sync score');
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
    const nextScore = score + (linesCleared * 100 * level);

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
    if (!currentPiece || gameOver || isPaused) {
      return;
    }

    if (canMoveOnBoard(board, currentPiece, 0, 1)) {
      setCurrentPiece((previous) => ({ ...previous, y: previous.y + 1 }));
      return;
    }

    lockPiece(currentPiece);
  }, [board, currentPiece, gameOver, isPaused, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) {
      return;
    }

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
    if (!piece) {
      return null;
    }

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

    if (gameOver) {
      return;
    }

    if (event.key === 'p' || event.key === 'P') {
      event.preventDefault();
      setPaused((previous) => !previous);
      return;
    }

    if (isPaused) {
      return;
    }

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
    if (currentPiece || gameOver) {
      return;
    }

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
            if (!ghostShape[row][col]) {
              continue;
            }

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
          if (!shape[row][col]) {
            continue;
          }

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

        return (
          <GameCell
            key={`${rowIndex}-${colIndex}`}
            empty={!shapeKey}
            ghost={isGhost}
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

  return (
    <GameContainer>
      <ExitButton onClick={onExit}>
        ESC
      </ExitButton>

      <GameLayout>
        <LeaderboardPanel>
          <SectionHeading>Leaderboard</SectionHeading>

          {leaderboardLoading ? (
            <EmptyState>Loading account scores...</EmptyState>
          ) : leaderboardError ? (
            <EmptyState>{leaderboardError}</EmptyState>
          ) : leaderboard.length === 0 ? (
            <EmptyState>No scores yet. Finish a game to claim the first spot.</EmptyState>
          ) : (
            <LeaderboardList>
              {leaderboard.map((entry, index) => (
                <LeaderboardRow
                  key={`${entry.username}-${entry.score}-${index}`}
                  $highlight={entry.username === user?.username}
                >
                  <div className="rank">#{index + 1}</div>
                  <div className="name">{entry.username}</div>
                  <div className="score">{entry.score}</div>
                </LeaderboardRow>
              ))}
            </LeaderboardList>
          )}
        </LeaderboardPanel>

        <BoardColumn>
          <BoardTitle>
            <h2>SCULPTOR TETRIS</h2>
            <p>Account-linked scores, classic next-piece preview, same AI-logo blocks.</p>
          </BoardTitle>

          <GameBoard>
            {renderBoard()}
          </GameBoard>
        </BoardColumn>

        <RightSidebar>
          <div>
            <SectionHeading>Next Block</SectionHeading>
            <PreviewCard>
              <PreviewBoard>
                {previewMatrix.flatMap((row, rowIndex) => (
                  row.map((cell, colIndex) => (
                    <PreviewCell
                      key={`${rowIndex}-${colIndex}`}
                      empty={!cell}
                    >
                      {cell && (
                        <img
                          src={BLOCK_LOGOS[cell]}
                          alt={cell}
                          draggable={false}
                        />
                      )}
                    </PreviewCell>
                  ))
                ))}
              </PreviewBoard>
            </PreviewCard>
          </div>

          <div>
            <SectionHeading>Stats</SectionHeading>
            <StatGrid>
              <StatCard>
                <div className="label">Score</div>
                <div className="value">{score}</div>
              </StatCard>
              <StatCard>
                <div className="label">Level</div>
                <div className="value">{level}</div>
              </StatCard>
              <StatCard>
                <div className="label">Lines</div>
                <div className="value">{lines}</div>
              </StatCard>
              <StatCard>
                <div className="label">Best</div>
                <div className="value">{personalBest}</div>
              </StatCard>
            </StatGrid>
          </div>

          {submissionStatus && (
            <StatusBadge>
              {submissionStatus}
            </StatusBadge>
          )}

          {gameOver && (
            <StatusBadge $background="rgba(255, 75, 85, 0.18)" $color="#ff8a92">
              Game Over
            </StatusBadge>
          )}

          {isPaused && (
            <StatusBadge $background="rgba(255, 217, 90, 0.16)" $color="#ffe38b">
              Paused
            </StatusBadge>
          )}

          <div>
            <SectionHeading>Controls</SectionHeading>
            <ControlList>
              <div>Left / Right: move</div>
              <div>Up: rotate</div>
              <div>Down: soft drop</div>
              <div>Space: hard drop</div>
              <div>P: pause</div>
              <div>Esc: exit</div>
            </ControlList>
          </div>

          <SmallText>
            {user
              ? `Signed in as ${user.username}. Your best score is saved automatically when a run ends.`
              : 'You can still play, but scores only reach the leaderboard when you are signed in.'}
          </SmallText>
        </RightSidebar>
      </GameLayout>
    </GameContainer>
  );
};

export default TetrisGame;
