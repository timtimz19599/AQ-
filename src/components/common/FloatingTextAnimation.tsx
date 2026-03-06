import { useEffect, useRef } from 'react';

const WORDS = [
  'ALPHA 量化','财商教育','商业启蒙','金融素养','投资思维','财富管理','理性决策',
  '科创教育','AI 教育','智能教学','数字经济','数据驱动','科技赋能','商业竞赛',
  'BPA 竞赛','康莱德竞赛','商业案例','市场分析','行业研究','创业启蒙','商业模型',
  '企业认知','品牌思维','商业模式','价值投资','风险认知','复利思维','经济常识',
  '财经素养','商业视野','全球视野','未来商业','数字商业','智能商业','量化思维',
  '逻辑训练','思辨能力','创新能力','实战项目','研学课程','精英培养','能力提升',
  '商业素养','财经视野','科技金融','智能投教','商业实战','未来领袖','财智成长',
  'ALPHA Quants','Financial IQ','Business Literacy','Wealth Management','Investment Thinking',
  'FinTech Education','AI Education','Data Economy','Digital Business','Tech Empower',
  'Business Competition','Market Research','Startup Enlighten','Business Model','Value Investing',
  'Risk Management','Compound Interest','Economic Sense','Global Vision','Future Business',
  'Quant Finance','Logic Training','Innovation Ability','Case Study','Industry Analysis',
  'Corporate Insight','Brand Strategy','Decision Making','Financial Wisdom','Business Elite',
  'Smart Finance','Future Leader','Business Practice','Digital Literacy','Tech Finance',
  'Elite Training','Wealth Wisdom','Business Vision','Data Driven','AI Empower',
  'Business Talent','Financial Training','Future Economy','Investment IQ','Business Growth',
  'Quant Strategy','Business IQ','Financial Growth','Smart Education','Future Talent',
];

// Size tiers: 50% small, 33% medium, 17% large
function pickFontSize(): number {
  const r = Math.random();
  if (r < 0.50) return 11 + Math.random() * 5;   // small:  11–16
  if (r < 0.83) return 20 + Math.random() * 8;   // medium: 20–28
  return 32 + Math.random() * 12;                 // large:  32–44
}

interface Particle {
  x: number;
  y: number;
  text: string;
  baseFontSize: number;
  scale: number;    // lerps to 1.9 on hover, 1.0 otherwise
  opacity: number;
  speed: number;    // px/frame, horizontal only
  r: number; g: number; b: number;
}

function makeParticle(w: number, h: number, scatter = false): Particle {
  const baseFontSize = pickFontSize();
  const speed = 0.3 + Math.random() * 1.1;
  const opacity = 0.25 + Math.random() * 0.55;
  const roll = Math.random();
  const [r, g, b] = roll < 0.45 ? [230, 242, 255] : roll < 0.75 ? [147, 197, 253] : [200, 228, 255];

  // Use multiple vertical bands to ensure even spread, then add jitter
  const band = Math.floor(Math.random() * 8);
  const bandH = Math.max(1, h - baseFontSize * 2);
  const yBase = (band / 8) * bandH;
  const yJitter = (Math.random() - 0.5) * (bandH / 6);
  const y = Math.max(baseFontSize * 1.2, Math.min(h - baseFontSize * 0.5, yBase + yJitter + baseFontSize * 1.2));

  return {
    x: scatter ? Math.random() * (w + 600) - 200 : w + 20 + Math.random() * 800,
    y,
    text: WORDS[Math.floor(Math.random() * WORDS.length)],
    baseFontSize,
    scale: 1,
    opacity,
    speed,
    r, g, b,
  };
}

export function FloatingTextAnimation({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animId: number;
    let particles: Particle[] = [];
    let cssW = 0, cssH = 0;
    const mouse = { x: -9999, y: -9999 };

    // Mouse tracking
    function onMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() { mouse.x = -9999; mouse.y = -9999; }
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    function resize() {
      cssW = canvas.offsetWidth;
      cssH = canvas.offsetHeight;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      particles = Array.from({ length: 50 }, () => makeParticle(cssW, cssH, true));
    }

    function draw() {
      // Reset shadow before clear to avoid bleed
      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, cssW, cssH);

      // Subtle star dots
      ctx.fillStyle = 'rgba(160,200,255,0.12)';
      for (let i = 0; i < 80; i++) {
        // stable stars: use index as seed via modulo trick (pre-computed in init is better, but this is lightweight)
        const sx = (i * 137.5) % cssW;
        const sy = (i * 97.3) % cssH;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of particles) {
        const baseFont = `500 ${p.baseFontSize}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.font = baseFont;
        const baseTW = ctx.measureText(p.text).width;

        // Hit detection using base dimensions
        const hovered =
          mouse.x >= p.x &&
          mouse.x <= p.x + baseTW &&
          mouse.y >= p.y - p.baseFontSize &&
          mouse.y <= p.y + p.baseFontSize * 0.25;

        // Smooth scale lerp
        p.scale += ((hovered ? 1.9 : 1.0) - p.scale) * 0.14;

        // Render at scaled size, anchored at same baseline
        const scaledFS = p.baseFontSize * p.scale;
        ctx.font = `500 ${scaledFS}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = hovered ? Math.min(p.opacity * 1.4, 1) : p.opacity;
        ctx.fillStyle = hovered ? `rgb(255,255,255)` : `rgb(${p.r},${p.g},${p.b})`;
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;

        // Move left only (no vertical drift)
        p.x -= p.speed;

        // Recycle when off left edge
        if (p.x + baseTW < -10) {
          Object.assign(p, makeParticle(cssW, cssH, false));
        }
      }

      animId = requestAnimationFrame(draw);
    }

    init();
    animId = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} />;
}
