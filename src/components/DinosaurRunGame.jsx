import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

const gameLoop = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-100px); }
`;

const jumpAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-60px); }
  100% { transform: translateY(0); }
`;

const dropAnimation = keyframes`
  0% { transform: translateY(-50px); }
  100% { transform: translateY(0); }
`;

const GameContainer = styled.div`
  position: fixed;
  top: ${props => props.$toolbarOpen ? '12%' : '14%'};
  left: ${props => {
    const sidebarOffset = props.$sidebarCollapsed ? 0 : 160;
    let rightPanelOffset = 0;
    if (props.$whiteboardOpen) rightPanelOffset -= 225;
    if (props.$equationEditorOpen) rightPanelOffset -= 225;
    if (props.$graphingOpen) rightPanelOffset -= 300;
    if (props.$flowchartOpen) rightPanelOffset -= 225;
    if (props.$sandbox3DOpen) rightPanelOffset -= 225;
    return `calc(50% + ${sidebarOffset}px + ${rightPanelOffset}px)`;
  }};
  transform: translateX(-50%);
  width: 800px;
  height: 200px;
  max-width: 90%;
  background: transparent;
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
  
  @media (max-width: 768px) {
    left: 50% !important;
    top: ${props => props.$toolbarOpen ? '10%' : '12%'};
    width: 90%;
    height: 150px;
  }
  
  @media (max-width: 480px) {
    width: 95%;
    height: 120px;
  }
`;

const GameHeader = styled.div`
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 30px;
  z-index: 10000;
`;

const Score = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  color: #535353;
  letter-spacing: 1px;
`;

const HighScore = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #535353;
  letter-spacing: 1px;
`;

const ExitButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #535353;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  
  &:hover {
    background: #404040;
  }
`;

const GameArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const Ground = styled.div`
  position: absolute;
  bottom: 20px;
  width: 100%;
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    rgba(83, 83, 83, 0.3) 0px,
    rgba(83, 83, 83, 0.3) 2px,
    transparent 2px,
    transparent 16px
  );
`;

const Character = styled.div`
  position: absolute;
  bottom: 28px;
  left: 80px;
  width: 35px;
  height: 35px;
  z-index: 100;
  ${props => 
    props.$isJumping ? css`animation: ${jumpAnimation} 0.6s ease-in-out;` : 
    props.$isDropping ? css`animation: ${dropAnimation} 0.8s ease-out;` : css`animation: none;`
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0.9;
  }
`;

const ObstacleGroup = styled.div`
  position: absolute;
  bottom: 28px;
  right: ${props => props.$position}px;
  display: flex;
  gap: 12px;
`;

const Obstacle = styled.div`
  width: 18px;
  height: 25px;
  background: rgba(83, 83, 83, 0.7);
  border-radius: 3px;
`;

const GameOverScreen = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10000;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
`;

const GameOverTitle = styled.h2`
  font-family: 'Courier New', monospace;
  font-size: 24px;
  color: #535353;
  margin: 0 0 15px 0;
  letter-spacing: 1px;
`;

const GameOverText = styled.p`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #535353;
  margin: 0 0 20px 0;
`;

const RestartButton = styled.button`
  background: #535353;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  margin-right: 10px;
  
  &:hover {
    background: #404040;
  }
`;

const StartScreen = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10000;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
`;

const StartTitle = styled.h2`
  font-family: 'Courier New', monospace;
  font-size: 24px;
  color: #535353;
  margin: 0 0 15px 0;
  letter-spacing: 1px;
`;

const StartText = styled.p`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #535353;
  margin: 0 0 20px 0;
`;

const StartButton = styled.button`
  background: #535353;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  
  &:hover {
    background: #404040;
  }
`;

const DinosaurRunGame = ({ 
  onExit,
  $toolbarOpen,
  $sidebarCollapsed,
  $whiteboardOpen,
  $equationEditorOpen,
  $graphingOpen,
  $flowchartOpen,
  $sandbox3DOpen
}) => {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('sculptorRunHighScore') || '0');
  });
  const [isJumping, setIsJumping] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [gameSpeed, setGameSpeed] = useState(3);
  
  const gameLoopRef = useRef();
  const obstacleSpawnRef = useRef();
  const scoreRef = useRef();
  const jumpSoundRef = useRef();
  const gameOverSoundRef = useRef();

  // Initialize game
  const initGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setObstacles([]);
    setGameSpeed(3);
    setIsJumping(false);
    setIsDropping(true); // Character drops down at start
    
    // Stop dropping after animation
    setTimeout(() => setIsDropping(false), 800);
  }, []);

  // Jump function
  const jump = useCallback(() => {
    if (gameState !== 'playing' || isJumping) return;
    
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 600);
  }, [gameState, isJumping]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'start') {
          initGame();
        } else if (gameState === 'playing') {
          jump();
        } else if (gameState === 'gameOver') {
          initGame();
        }
      } else if (e.code === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, jump, initGame, onExit]);

  // Handle touch/click input
  useEffect(() => {
    const handleClick = (e) => {
      // Don't trigger on button clicks
      if (e.target.tagName === 'BUTTON') return;
      
      if (gameState === 'start') {
        initGame();
      } else if (gameState === 'playing') {
        jump();
      } else if (gameState === 'gameOver') {
        initGame();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [gameState, jump, initGame]);

  // Spawn obstacles
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnObstacle = () => {
      const obstacleCount = Math.floor(Math.random() * 2) + 1; // 1-2 obstacles (reduced from 1-3)
      const newObstacle = {
        id: Date.now(),
        position: -200, // Start further away
        count: obstacleCount,
        speed: 2 // Fixed slower speed
      };
      
      setObstacles(prev => [...prev, newObstacle]);
      
      // Schedule next obstacle - much longer intervals
      const nextInterval = Math.random() * 2000 + 3000; // 3-5 seconds (increased from 1.5-2.5)
      obstacleSpawnRef.current = setTimeout(spawnObstacle, nextInterval);
    };

    // Start spawning obstacles after a longer delay
    obstacleSpawnRef.current = setTimeout(spawnObstacle, 4000);

    return () => {
      if (obstacleSpawnRef.current) {
        clearTimeout(obstacleSpawnRef.current);
      }
    };
  }, [gameState]); // Only depend on gameState, not obstacles

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setObstacles(prev => {
        const updated = prev.map(obstacle => ({
          ...obstacle,
          position: obstacle.position + (obstacle.speed * 3) // Reduced from 10 to 3
        }));

        // Remove obstacles that are off screen
        return updated.filter(obstacle => obstacle.position < 1200); // Increased buffer
      });

      // Check collision
      const characterRect = {
        left: 80,
        right: 115,
        top: isJumping ? -32 : -7, // When jumping, character is much higher
        bottom: isJumping ? 3 : 28  // When jumping, character bottom is well above obstacles
      };

      const collision = obstacles.some(obstacle => {
        const containerWidth = 800; // Fixed container width
        const obstacleRect = {
          left: containerWidth - obstacle.position,
          right: containerWidth - obstacle.position + (obstacle.count * 30), // 18px width + 12px gap
          top: 3,  // Obstacle top
          bottom: 28 // Obstacle bottom (ground level)
        };

        return characterRect.left < obstacleRect.right &&
               characterRect.right > obstacleRect.left &&
               characterRect.top < obstacleRect.bottom &&
               characterRect.bottom > obstacleRect.top;
      });

      if (collision) {
        setGameState('gameOver');
      }
    }, 16); // 60 FPS

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, obstacles, isJumping]);

  // Score counter
  useEffect(() => {
    if (gameState !== 'playing') return;

    scoreRef.current = setInterval(() => {
      setScore(prev => prev + 1);
    }, 100);

    return () => clearInterval(scoreRef.current);
  }, [gameState]);

  // Increase game speed (disabled for now to keep it manageable)
  // useEffect(() => {
  //   if (gameState !== 'playing') return;

  //   const speedInterval = setInterval(() => {
  //     setGameSpeed(prev => Math.min(prev + 0.1, 8));
  //   }, 3000);

  //   return () => clearInterval(speedInterval);
  // }, [gameState]);

  // Update high score
  useEffect(() => {
    if (gameState === 'gameOver' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('sculptorRunHighScore', score.toString());
    }
  }, [gameState, score, highScore]);

  const formatScore = (score) => {
    return score.toString().padStart(5, '0');
  };

  return (
    <GameContainer
      $toolbarOpen={$toolbarOpen}
      $sidebarCollapsed={$sidebarCollapsed}
      $whiteboardOpen={$whiteboardOpen}
      $equationEditorOpen={$equationEditorOpen}
      $graphingOpen={$graphingOpen}
      $flowchartOpen={$flowchartOpen}
      $sandbox3DOpen={$sandbox3DOpen}
    >
      <ExitButton onClick={onExit}>
        ESC
      </ExitButton>
      
      <GameHeader>
        <Score>SCORE: {formatScore(score)}</Score>
        <HighScore>HI: {formatScore(highScore)}</HighScore>
      </GameHeader>

      <GameArea>
        <Ground />
        
        <Character $isJumping={isJumping} $isDropping={isDropping}>
          <img src="/images/sculptor.svg" alt="Sculptor Runner" />
        </Character>

        {obstacles.map(obstacle => (
          <ObstacleGroup 
            key={obstacle.id} 
            $position={obstacle.position}
            $speed={obstacle.speed}
          >
            {Array.from({ length: obstacle.count }).map((_, index) => (
              <Obstacle key={index} />
            ))}
          </ObstacleGroup>
        ))}
      </GameArea>

      {gameState === 'start' && (
        <StartScreen>
          <StartButton onClick={initGame}>START</StartButton>
        </StartScreen>
      )}

      {gameState === 'gameOver' && (
        <GameOverScreen>
          <GameOverTitle>GAME OVER</GameOverTitle>
          <GameOverText>
            Final Score: {formatScore(score)}<br />
            High Score: {formatScore(highScore)}
          </GameOverText>
          <RestartButton onClick={initGame}>RESTART</RestartButton>
          <RestartButton onClick={onExit}>EXIT</RestartButton>
        </GameOverScreen>
      )}
    </GameContainer>
  );
};

export default DinosaurRunGame; 