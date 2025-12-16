import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';

// Game container that matches MainGreeting positioning
const GameContainer = styled.div`
  position: fixed;
  top: ${props => props.$toolbarOpen ? '18%' : '20%'};
  left: ${props => {
        const sidebarOffset = props.$sidebarCollapsed ? 0 : 160;
        return `calc(50% + ${sidebarOffset}px)`;
    }};
  transform: translateX(-50%);
  max-width: 800px;
  width: 90%;
  z-index: 102;
  padding: 0 20px;
  box-sizing: border-box;
  transition: all 0.3s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    left: 50% !important;
    top: ${props => props.$toolbarOpen ? '15%' : '18%'};
    max-width: 90%;
    padding: 0 15px;
  }
  
  @media (max-width: 480px) {
    left: 50% !important;
    top: ${props => props.$toolbarOpen ? '15%' : '18%'};
    max-width: 95%;
    padding: 0 10px;
  }
`;

const GameCanvas = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 150px;
  background: ${props => props.theme.inputBackground || 'rgba(0,0,0,0.05)'};
  border-radius: 16px;
  border: 1px solid ${props => props.theme.border};
  overflow: hidden;
  cursor: pointer;
  user-select: none;
`;

const Ground = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background: ${props => props.theme.text};
  opacity: 0.3;
`;

const Player = styled.div`
  position: absolute;
  bottom: ${props => 22 + props.$y}px;
  left: 60px;
  width: 48px;
  height: 48px;
  transition: ${props => props.$isJumping ? 'none' : 'bottom 0.1s ease-out'};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Obstacle = styled.div`
  position: absolute;
  bottom: 22px;
  left: ${props => props.$x}px;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  background: ${props => props.theme.primary};
  border-radius: 4px;
  opacity: 0.8;
`;

const ScoreDisplay = styled.div`
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text};
  opacity: 0.8;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
`;

const GameOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.sidebar};
  opacity: 0.95;
  border-radius: 16px;
`;

const OverlayTitle = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin-bottom: 8px;
`;

const OverlayScore = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: ${props => props.theme.primary};
  margin-bottom: 4px;
`;

const OverlayHint = styled.div`
  font-size: 14px;
  color: ${props => props.theme.text};
  opacity: 0.6;
  margin-top: 8px;
`;

const HighScoreLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.text};
  opacity: 0.5;
`;

const ExitButton = styled.button`
  position: absolute;
  top: 12px;
  left: 16px;
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  opacity: 0.5;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

// Game constants
const GROUND_Y = 0;
const JUMP_VELOCITY = 12;
const GRAVITY = 0.6;
const INITIAL_SPEED = 5;
const MAX_SPEED = 12;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;

const DinosaurRunGame = ({
    onExit,
    $toolbarOpen,
    $sidebarCollapsed
}) => {
    const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover'
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('sculptorRunnerHighScore');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [playerY, setPlayerY] = useState(GROUND_Y);
    const [obstacles, setObstacles] = useState([]);

    const gameLoopRef = useRef(null);
    const playerVelocityRef = useRef(0);
    const isJumpingRef = useRef(false);
    const speedRef = useRef(INITIAL_SPEED);
    const frameCountRef = useRef(0);
    const obstaclesRef = useRef([]);
    const playerYRef = useRef(GROUND_Y);
    const scoreRef = useRef(0);

    const resetGame = useCallback(() => {
        playerVelocityRef.current = 0;
        isJumpingRef.current = false;
        speedRef.current = INITIAL_SPEED;
        frameCountRef.current = 0;
        obstaclesRef.current = [];
        playerYRef.current = GROUND_Y;
        scoreRef.current = 0;
        setPlayerY(GROUND_Y);
        setObstacles([]);
        setScore(0);
    }, []);

    const jump = useCallback(() => {
        if (!isJumpingRef.current && gameState === 'playing') {
            isJumpingRef.current = true;
            playerVelocityRef.current = JUMP_VELOCITY;
        }
    }, [gameState]);

    const startGame = useCallback(() => {
        resetGame();
        setGameState('playing');
    }, [resetGame]);

    const handleInteraction = useCallback(() => {
        if (gameState === 'start' || gameState === 'gameover') {
            startGame();
        } else if (gameState === 'playing') {
            jump();
        }
    }, [gameState, startGame, jump]);

    // Main game loop
    useEffect(() => {
        if (gameState !== 'playing') {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
            return;
        }

        const gameLoop = () => {
            frameCountRef.current++;

            // Update player position (physics)
            if (isJumpingRef.current) {
                playerVelocityRef.current -= GRAVITY;
                playerYRef.current += playerVelocityRef.current;

                if (playerYRef.current <= GROUND_Y) {
                    playerYRef.current = GROUND_Y;
                    isJumpingRef.current = false;
                    playerVelocityRef.current = 0;
                }

                setPlayerY(playerYRef.current);
            }

            // Spawn obstacles
            const spawnRate = Math.max(60, 120 - Math.floor(scoreRef.current / 50) * 10);
            if (frameCountRef.current % spawnRate === 0) {
                const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
                const minGap = 200;

                if (!lastObstacle || lastObstacle.x < 600 - minGap) {
                    const newObstacle = {
                        id: Date.now(),
                        x: 620,
                        width: 15 + Math.random() * 15,
                        height: 25 + Math.random() * 25,
                    };
                    obstaclesRef.current = [...obstaclesRef.current, newObstacle];
                }
            }

            // Update obstacles
            obstaclesRef.current = obstaclesRef.current
                .map(obs => ({ ...obs, x: obs.x - speedRef.current }))
                .filter(obs => obs.x > -50);

            setObstacles([...obstaclesRef.current]);

            // Collision detection
            const playerLeft = 60;
            const playerRight = 60 + PLAYER_WIDTH - 10;
            const playerBottom = 22 + playerYRef.current;
            const playerTop = playerBottom + PLAYER_HEIGHT - 10;

            for (const obs of obstaclesRef.current) {
                const obsLeft = obs.x;
                const obsRight = obs.x + obs.width;
                const obsBottom = 22;
                const obsTop = 22 + obs.height;

                if (
                    playerRight > obsLeft &&
                    playerLeft < obsRight &&
                    playerBottom < obsTop &&
                    playerTop > obsBottom
                ) {
                    // Collision!
                    if (scoreRef.current > highScore) {
                        setHighScore(scoreRef.current);
                        localStorage.setItem('sculptorRunnerHighScore', scoreRef.current.toString());
                    }
                    setGameState('gameover');
                    return;
                }
            }

            // Update score
            if (frameCountRef.current % 6 === 0) {
                scoreRef.current++;
                setScore(scoreRef.current);
            }

            // Gradually increase speed
            speedRef.current = Math.min(MAX_SPEED, INITIAL_SPEED + scoreRef.current * 0.01);

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameState, highScore]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                handleInteraction();
            }
            if (e.code === 'Escape' && onExit) {
                onExit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleInteraction, onExit]);

    return (
        <GameContainer
            $toolbarOpen={$toolbarOpen}
            $sidebarCollapsed={$sidebarCollapsed}
        >
            <GameCanvas onClick={handleInteraction}>
                <ExitButton onClick={(e) => { e.stopPropagation(); onExit?.(); }}>
                    ✕ Exit
                </ExitButton>

                <ScoreDisplay>{score}</ScoreDisplay>

                <Ground />

                <Player $y={playerY} $isJumping={isJumpingRef.current}>
                    <img src="/sculptor.svg" alt="Player" />
                </Player>

                {obstacles.map(obs => (
                    <Obstacle
                        key={obs.id}
                        $x={obs.x}
                        $width={obs.width}
                        $height={obs.height}
                    />
                ))}

                {gameState === 'start' && (
                    <GameOverlay>
                        <OverlayTitle>Sculptor Run</OverlayTitle>
                        <OverlayHint>Press SPACE or tap to play</OverlayHint>
                        {highScore > 0 && (
                            <HighScoreLabel>Best: {highScore}</HighScoreLabel>
                        )}
                    </GameOverlay>
                )}

                {gameState === 'gameover' && (
                    <GameOverlay>
                        <OverlayTitle>Game Over</OverlayTitle>
                        <OverlayScore>{score}</OverlayScore>
                        {score >= highScore && score > 0 && (
                            <HighScoreLabel>🎉 New Best!</HighScoreLabel>
                        )}
                        {score < highScore && (
                            <HighScoreLabel>Best: {highScore}</HighScoreLabel>
                        )}
                        <OverlayHint>Press SPACE or tap to retry</OverlayHint>
                    </GameOverlay>
                )}
            </GameCanvas>
        </GameContainer>
    );
};

export default DinosaurRunGame;
