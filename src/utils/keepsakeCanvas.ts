function renderKeepsakeCanvas(message: string, numeral: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H / 2, H * 0.78);
  bg.addColorStop(0, '#131218');
  bg.addColorStop(0.55, '#09090d');
  bg.addColorStop(1, '#040406');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H * 0.3, 10, W / 2, H * 0.3, 420);
  glow.addColorStop(0, 'rgba(229, 202, 147, 0.1)');
  glow.addColorStop(1, 'rgba(229, 202, 147, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(223, 192, 136, 0.34)';
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 72, W - 144, H - 144);

  ctx.strokeStyle = 'rgba(223, 192, 136, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(92, 92, W - 184, H - 184);

  drawStar(ctx, W / 2, 210, 22, '#e5ca93');

  ctx.fillStyle = 'rgba(223, 192, 136, 0.55)';
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(numeral, W / 2, 268);

  ctx.fillStyle = '#f3ece0';
  ctx.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';

  const maxWidth = W - 280;
  const words = message.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const lineHeight = 68;
  const startY = H / 2 - ((lines.length - 1) * lineHeight) / 2 + 15;

  lines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, startY + idx * lineHeight);
  });

  ctx.strokeStyle = 'rgba(223, 192, 136, 0.28)';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 48, H - 205);
  ctx.lineTo(W / 2 + 48, H - 205);
  ctx.stroke();

  const d = new Date();
  const stamp = `${String(d.getDate()).padStart(2, '0')} · ${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )} · ${d.getFullYear()}`;
  ctx.fillStyle = 'rgba(223, 192, 136, 0.45)';
  ctx.font = '400 21px "JetBrains Mono", monospace';
  ctx.fillText(stamp, W / 2, H - 158);

  return canvas;
}

export function downloadKeepsakeCard(message: string, numeral: string): void {
  const canvas = renderKeepsakeCanvas(message, numeral);
  const link = document.createElement('a');
  link.download = `wish-${numeral}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function shareKeepsakeCardOrDownload(
  message: string,
  numeral: string
): Promise<void> {
  const canvas = renderKeepsakeCanvas(message, numeral);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

  if (blob && typeof navigator !== 'undefined' && navigator.share) {
    const file = new File([blob], `wish-${numeral}.png`, { type: 'image/png' });
    const canShareFile =
      typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : false;

    if (canShareFile) {
      try {
        await navigator.share({
          files: [file],
          text: `“${message}”`,
        });
        return;
      } catch {
        return;
      }
    }
  }

  downloadKeepsakeCard(message, numeral);
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
