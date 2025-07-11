import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const GameContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 30px);
  grid-template-rows: repeat(20, 30px);
  gap: 1px;
  background: #1a1a1a;
  border: 3px solid #333;
  padding: 10px;
`;

const GameCell = styled.div`
  width: 30px;
  height: 30px;
  background: ${props => props.empty ? '#000' : '#333'};
  border: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    opacity: ${props => props.ghost ? 0.3 : 1};
  }
  
  &.ghost {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
`;

const GameSidebar = styled.div`
  margin-left: 40px;
  color: white;
  font-family: monospace;
  font-size: 18px;
  
  h2 {
    margin-bottom: 20px;
  }
  
  .score {
    margin-bottom: 10px;
  }
  
  .level {
    margin-bottom: 10px;
  }
  
  .lines {
    margin-bottom: 20px;
  }
  
  .controls {
    font-size: 14px;
    line-height: 1.4;
    margin-top: 30px;
  }
`;

const ExitButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #ff4444;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
  
  &:hover {
    background: #ff6666;
  }
`;

// AI model logos for different block types
const BLOCK_LOGOS = {
  I: '/images/openai-logo.png',
  O: '/images/google.png',
  T: '/images/claude-logo.png',
  S: '/images/gemini-logo.png',
  Z: '/images/meta-logo.png',
  J: '/images/deepseek-logo.png',
  L: '/images/grok-logo.png'
};

// Tetris shapes and rotations
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

const TetrisGame = ({ onExit }) => {
  const [board, setBoard] = useState(() => 
    Array(20).fill().map(() => Array(10).fill(null))
  );
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setPaused] = useState(false);

  const getRandomPiece = () => {
    const shapes = Object.keys(TETRIS_SHAPES);
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    return {
      shape: randomShape,
      rotation: 0,
      x: 3,
      y: 0
    };
  };

  const canMove = (piece, dx, dy, rotation = piece.rotation) => {
    const shape = TETRIS_SHAPES[piece.shape][rotation];
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = piece.x + col + dx;
          const newY = piece.y + row + dy;
          
          if (newX < 0 || newX >= 10 || newY >= 20) {
            return false;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return false;
          }
        }
      }
    }
    
    return true;
  };

  const placePiece = (piece) => {
    const newBoard = [...board];
    const shape = TETRIS_SHAPES[piece.shape][piece.rotation];
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = piece.x + col;
          const y = piece.y + row;
          if (y >= 0) {
            newBoard[y][x] = piece.shape;
          }
        }
      }
    }
    
    return newBoard;
  };

  const clearLines = (board) => {
    const newBoard = board.filter(row => row.some(cell => cell === null));
    const linesCleared = 20 - newBoard.length;
    
    if (linesCleared > 0) {
      const emptyRows = Array(linesCleared).fill().map(() => Array(10).fill(null));
      return { board: [...emptyRows, ...newBoard], linesCleared };
    }
    
    return { board, linesCleared: 0 };
  };

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    if (canMove(currentPiece, 0, 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      const newBoard = placePiece(currentPiece);
      const { board: clearedBoard, linesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + linesCleared * 100 * level);
      
      const newPiece = getRandomPiece();
      if (canMove(newPiece, 0, 0)) {
        setCurrentPiece(newPiece);
      } else {
        setGameOver(true);
      }
    }
  }, [currentPiece, board, gameOver, isPaused, level]);

  const getGhostPosition = useCallback((piece) => {
    if (!piece) return null;
    
    let dropDistance = 0;
    while (canMove(piece, 0, dropDistance + 1)) {
      dropDistance++;
    }
    
    return { ...piece, y: piece.y + dropDistance };
  }, [canMove]);

  const hardDrop = useCallback(() => {
    if (!currentPiece) return;
    
    let dropDistance = 0;
    while (canMove(currentPiece, 0, dropDistance + 1)) {
      dropDistance++;
    }
    
    // Create the piece at its final position
    const finalPiece = { ...currentPiece, y: currentPiece.y + dropDistance };
    
    // Place the piece immediately
    const newBoard = placePiece(finalPiece);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);
    
    setBoard(clearedBoard);
    setLines(prev => prev + linesCleared);
    setScore(prev => prev + linesCleared * 100 * level);
    
    // Spawn new piece
    const newPiece = getRandomPiece();
    if (canMove(newPiece, 0, 0)) {
      setCurrentPiece(newPiece);
    } else {
      setGameOver(true);
    }
  }, [currentPiece, canMove, board, level]);

  const handleKeyPress = useCallback((e) => {
    if (gameOver) return;

    // Handle pause/unpause first - this should work even when paused
    if (e.key === 'p' || e.key === 'P') {
      setPaused(prev => !prev);
      return;
    }

    // Don't handle other keys when paused
    if (isPaused) return;

    switch (e.key) {
      case 'ArrowLeft':
        if (currentPiece && canMove(currentPiece, -1, 0)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }));
        }
        break;
      case 'ArrowRight':
        if (currentPiece && canMove(currentPiece, 1, 0)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
        }
        break;
      case 'ArrowDown':
        dropPiece();
        break;
      case 'ArrowUp':
        if (currentPiece) {
          const newRotation = (currentPiece.rotation + 1) % 4;
          if (canMove(currentPiece, 0, 0, newRotation)) {
            setCurrentPiece(prev => ({ ...prev, rotation: newRotation }));
          }
        }
        break;
      case ' ':
        hardDrop();
        break;
    }
  }, [currentPiece, canMove, dropPiece, hardDrop, gameOver, isPaused]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!currentPiece) {
      setCurrentPiece(getRandomPiece());
    }
  }, [currentPiece]);

  useEffect(() => {
    const interval = setInterval(() => {
      dropPiece();
    }, Math.max(100, 500 - (level - 1) * 30));

    return () => clearInterval(interval);
  }, [dropPiece, level]);

  useEffect(() => {
    setLevel(Math.floor(lines / 10) + 1);
  }, [lines]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    const ghostBoard = Array(20).fill().map(() => Array(10).fill(null));
    
    // Add ghost piece to display
    if (currentPiece) {
      const ghostPiece = getGhostPosition(currentPiece);
      if (ghostPiece && ghostPiece.y !== currentPiece.y) {
        const shape = TETRIS_SHAPES[ghostPiece.shape][ghostPiece.rotation];
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              const x = ghostPiece.x + col;
              const y = ghostPiece.y + row;
              if (y >= 0 && y < 20 && x >= 0 && x < 10) {
                ghostBoard[y][x] = ghostPiece.shape;
              }
            }
          }
        }
      }
    }
    
    // Add current piece to display
    if (currentPiece) {
      const shape = TETRIS_SHAPES[currentPiece.shape][currentPiece.rotation];
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = currentPiece.x + col;
            const y = currentPiece.y + row;
            if (y >= 0 && y < 20 && x >= 0 && x < 10) {
              displayBoard[y][x] = currentPiece.shape;
            }
          }
        }
      }
    }
    
    return displayBoard.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const isGhost = ghostBoard[rowIndex][colIndex] && !cell;
        return (
          <GameCell 
            key={`${rowIndex}-${colIndex}`} 
            empty={!cell && !isGhost}
            ghost={isGhost}
            className={isGhost ? 'ghost' : ''}
          >
            {cell && (
              <img 
                src={BLOCK_LOGOS[cell]} 
                alt={cell}
                draggable={false}
              />
            )}
            {isGhost && (
              <img 
                src={BLOCK_LOGOS[ghostBoard[rowIndex][colIndex]]} 
                alt={ghostBoard[rowIndex][colIndex]}
                draggable={false}
                ghost={true}
              />
            )}
          </GameCell>
        );
      })
    );
  };

  return (
    <GameContainer>
      <ExitButton onClick={onExit}>
        ESC
      </ExitButton>
      
      <GameBoard>
        {renderBoard()}
      </GameBoard>
      
      <GameSidebar>
        <h2>SCULPTOR TETRIS</h2>
        <div className="score">Score: {score}</div>
        <div className="level">Level: {level}</div>
        <div className="lines">Lines: {lines}</div>
        
        {gameOver && (
          <div style={{ color: '#ff4444', fontSize: '24px', marginTop: '20px' }}>
            GAME OVER
          </div>
        )}
        
        {isPaused && (
          <div style={{ color: '#ffff44', fontSize: '24px', marginTop: '20px' }}>
            PAUSED
          </div>
        )}
        
        <div className="controls">
          <div>← → Move</div>
          <div>↑ Rotate</div>
          <div>↓ Soft Drop</div>
          <div>SPACE Hard Drop</div>
          <div>P Pause</div>
          <div>ESC Exit</div>
        </div>
      </GameSidebar>
    </GameContainer>
  );
};

export default TetrisGame; 