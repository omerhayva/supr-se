import React, { useEffect, useRef } from 'react';

interface AmbientDustProps {
  intensity?: number;
}

export const AmbientDust: React.FC<AmbientDustProps> = ({ intensity = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const count = 42;
    const motes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.35 + 0.35,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -Math.random() * 0.22 - 0.05,
      alpha: Math.random() * 0.45 + 0.08,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const boost = Math.min(1, intensityRef.current);

      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy * (1 + boost * 0.8);
        if (m.y < -10) {
          m.y = height + 10;
          m.x = Math.random() * width;
        }
        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;

        const twinkle = 0.55 + 0.45 * Math.sin(time * 0.0014 + m.phase);
        const a = m.alpha * twinkle * (1 + boost * 0.45);

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 202, 147, ${a.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const auraOpacity = 0.11 + Math.min(0.14, intensity * 0.12);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(circle at 50% 44%, rgba(212, 175, 115, ${auraOpacity.toFixed(
            3
          )}) 0%, rgba(18, 16, 22, 0.55) 42%, #040406 82%)`,
          transition: 'background 0.6s ease',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div className="sanctuary-grain" />
    </>
  );
};
