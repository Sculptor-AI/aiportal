import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const COLORS = [
  '#FF355E', '#FD5B78', '#FF6037', '#FF9966', '#FFCC33',
  '#00C9A7', '#00B8FF', '#3D5AFE', '#B967FF', '#FF6EC7',
  '#F9F871', '#7CFFCB', '#9BFFFA', '#FFD3B6', '#FFFFFF'
];

const SPARK_COLORS = ['#FFFFFF', '#FFF3B0', '#FFE082', '#D9F7FF', '#FFD6FA'];

const EFFECT_DURATION_MS = 6200;

const fadeOut = keyframes`
  0%, 86% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const flashPulse = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0.18);
    opacity: 0;
  }
  10% {
    opacity: 0.95;
  }
  35% {
    opacity: 0.4;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.8);
    opacity: 0;
  }
`;

const shockwave = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0.16);
    opacity: 0;
  }
  12% {
    opacity: 0.82;
  }
  100% {
    transform: translate(-50%, -50%) scale(4.5);
    opacity: 0;
  }
`;

const ConfettiContainer = styled.div`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 99999;
  overflow: hidden;
  animation: ${fadeOut} 0.6s ease-out 5.6s forwards;
`;

const ExplosionCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
`;

const CoreFlash = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(34vw, 420px);
  height: min(34vw, 420px);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(255, 243, 176, 0.92) 18%, rgba(255, 177, 66, 0.55) 42%, rgba(255, 53, 94, 0.18) 70%, transparent 100%);
  filter: blur(6px);
  mix-blend-mode: screen;
  animation: ${flashPulse} 1s cubic-bezier(0.18, 0.85, 0.3, 1) forwards;
`;

const ShockwaveRing = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${props => props.$size || 'clamp(150px, 18vw, 240px)'};
  height: ${props => props.$size || 'clamp(150px, 18vw, 240px)'};
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 0 32px rgba(255, 255, 255, 0.55),
    0 0 64px rgba(255, 177, 66, 0.28);
  mix-blend-mode: screen;
  opacity: 0;
  animation: ${shockwave} 1.35s ease-out forwards;
  animation-delay: ${props => props.$delay || 0}s;
`;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (items) => items[Math.floor(Math.random() * items.length)];

const createParticle = (origin, burst) => {
  const angle = rand(0, Math.PI * 2);
  const typeRoll = Math.random();
  const kind = typeRoll < 0.14 ? 'spark' : typeRoll < 0.3 ? 'streamer' : 'confetti';
  const shape = kind === 'streamer' ? 'streamer' : pick(['rect', 'diamond', 'circle']);
  const baseSize = kind === 'spark' ? rand(2.2, 4.8) : kind === 'streamer' ? rand(4.2, 8.4) : rand(5.2, 12.4);
  const speed = rand(burst.speed[0], burst.speed[1]);

  return {
    kind,
    shape,
    color: kind === 'spark' ? pick(SPARK_COLORS) : pick(COLORS),
    x: origin.x + rand(-18, 18),
    y: origin.y + rand(-18, 18),
    vx: Math.cos(angle) * speed * rand(0.82, 1.18),
    vy: Math.sin(angle) * speed * rand(0.78, 1.16) - rand(4, 11),
    gravity: kind === 'spark' ? rand(0.06, 0.12) : rand(0.18, 0.34),
    drag: kind === 'spark' ? rand(0.964, 0.976) : rand(0.982, 0.992),
    rotation: rand(0, Math.PI * 2),
    spin: rand(-0.18, 0.18),
    wobble: rand(0, Math.PI * 2),
    wobbleSpeed: kind === 'streamer' ? rand(0.14, 0.28) : rand(0.08, 0.18),
    wobbleAmplitude: kind === 'streamer' ? rand(5, 12) : rand(0.8, 4.5),
    width: shape === 'circle'
      ? baseSize
      : kind === 'streamer'
        ? baseSize * rand(4.6, 7.2)
        : baseSize * rand(1.1, 2.2),
    height: shape === 'circle'
      ? baseSize
      : kind === 'streamer'
        ? baseSize * rand(0.28, 0.55)
        : baseSize * rand(0.72, 1.2),
    ttl: rand(burst.ttl[0], burst.ttl[1]),
    delay: burst.delay + rand(0, burst.delayJitter),
    strokeAlpha: kind === 'spark' ? 0 : rand(0.12, 0.28),
  };
};

const drawParticle = (ctx, particle, alpha) => {
  const clampedAlpha = Math.max(0, Math.min(alpha, 1));
  if (clampedAlpha <= 0) {
    return;
  }

  ctx.save();
  ctx.translate(particle.x + Math.sin(particle.wobble) * particle.wobbleAmplitude, particle.y);
  ctx.rotate(particle.rotation);
  ctx.globalAlpha = clampedAlpha;

  if (particle.kind === 'spark') {
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 22 * clampedAlpha;
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-particle.width * 2.2, 0);
    ctx.lineTo(particle.width * 2.2, 0);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, particle.width * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.shadowColor = particle.color;
  ctx.shadowBlur = particle.kind === 'streamer' ? 12 * clampedAlpha : 8 * clampedAlpha;
  ctx.fillStyle = particle.color;

  if (particle.kind === 'streamer') {
    const streamerFlip = 0.45 + Math.abs(Math.sin(particle.wobble)) * 0.85;
    ctx.scale(1, streamerFlip);
    ctx.beginPath();
    ctx.moveTo(-particle.width / 2, -particle.height / 2);
    ctx.quadraticCurveTo(-particle.width * 0.18, particle.height * 2.8, particle.width / 2, particle.height / 2);
    ctx.quadraticCurveTo(particle.width * 0.16, -particle.height * 2.6, -particle.width / 2, -particle.height / 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const confettiFlip = particle.shape === 'circle'
    ? 1
    : 0.3 + Math.abs(Math.sin(particle.wobble)) * 0.95;

  ctx.scale(1, confettiFlip);

  if (particle.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, particle.width * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.shape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -particle.height / 2);
    ctx.lineTo(particle.width / 2, 0);
    ctx.lineTo(0, particle.height / 2);
    ctx.lineTo(-particle.width / 2, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
  }

  if (particle.strokeAlpha > 0) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${particle.strokeAlpha})`;
    ctx.lineWidth = 1;

    if (particle.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, particle.width * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (particle.shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -particle.height / 2);
      ctx.lineTo(particle.width / 2, 0);
      ctx.lineTo(0, particle.height / 2);
      ctx.lineTo(-particle.width / 2, 0);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
    }
  }

  ctx.restore();
};

const ConfettiExplosion = ({ onComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    let rafId = 0;
    let viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    };

    const resize = () => {
      viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      };

      canvas.width = Math.floor(viewport.width * viewport.dpr);
      canvas.height = Math.floor(viewport.height * viewport.dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
    };

    resize();

    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    const bursts = [
      {
        origin: { x: centerX, y: centerY },
        count: 130,
        speed: [10, 24],
        ttl: [2600, 4200],
        delay: 0,
        delayJitter: 90,
      },
      {
        origin: { x: centerX - 90, y: centerY + 16 },
        count: 95,
        speed: [12, 26],
        ttl: [2900, 4700],
        delay: 120,
        delayJitter: 120,
      },
      {
        origin: { x: centerX + 105, y: centerY - 10 },
        count: 95,
        speed: [14, 28],
        ttl: [3200, 5200],
        delay: 240,
        delayJitter: 130,
      },
    ];

    const particles = bursts.flatMap((burst) =>
      Array.from({ length: burst.count }, () => createParticle(burst.origin, burst))
    );

    const startTime = performance.now();
    let lastTime = startTime;

    const render = (now) => {
      const delta = Math.min(now - lastTime, 32) / 16.6667;
      lastTime = now;
      const elapsed = now - startTime;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);

      for (const particle of particles) {
        if (elapsed < particle.delay) {
          continue;
        }

        const life = elapsed - particle.delay;
        if (life > particle.ttl) {
          continue;
        }

        particle.vx *= particle.drag;
        particle.vy += particle.gravity * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;
        particle.wobble += particle.wobbleSpeed * delta;

        const progress = life / particle.ttl;
        const fadeIn = Math.min(1, life / 110);
        const fadeOut = Math.max(0, 1 - Math.pow(progress, 1.5));
        const alpha = Math.min(fadeIn, fadeOut);

        drawParticle(ctx, particle, alpha);
      }

      if (elapsed < EFFECT_DURATION_MS) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    rafId = window.requestAnimationFrame(render);

    const timeout = window.setTimeout(() => {
      onComplete?.();
    }, EFFECT_DURATION_MS);

    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeout);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return (
    <ConfettiContainer>
      <CoreFlash />
      <ShockwaveRing />
      <ShockwaveRing $delay={0.12} $size='clamp(190px, 22vw, 310px)' />
      <ExplosionCanvas ref={canvasRef} />
    </ConfettiContainer>
  );
};

export default ConfettiExplosion;
