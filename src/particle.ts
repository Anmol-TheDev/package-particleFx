import { Particle, Origin } from './types';
import { ParticleCanvasOptions } from './types';

export function updateParticle(
  particle: Particle,
  origin: Origin,
  config: ParticleCanvasOptions,
  mouse: { x: number; y: number; active: boolean },
  vortex: { x: number; y: number; active: boolean },
  speed: number,
  gravityFactor: number
) {
  const dx =
    origin.x - particle.x + (Math.random() - 0.5) * (config.noise as number);
  const dy =
    origin.y - particle.y + (Math.random() - 0.5) * (config.noise as number);
  const distance = Math.sqrt(dx * dx + dy * dy);

  let force;
  if (distance < 5) {
    force = 0.1 * (distance / 5);
  } else {
    force = 0.02 * distance;
  }

  if (distance > 0) {
    particle.vx += (dx / distance) * force * speed;
    particle.vy += (dy / distance) * force * speed;
  }

  if (mouse.active) {
    if (config.vortexMode) {
      const vdx = particle.x - vortex.x;
      const vdy = particle.y - vortex.y;
      const vdist = Math.sqrt(vdx * vdx + vdy * vdy);
      if (vdist > 0) {
        const angle = Math.atan2(vdy, vdx);
        const force = 1 / vdist;
        particle.vx += Math.cos(angle + Math.PI / 2) * force;
        particle.vy += Math.sin(angle + Math.PI / 2) * force;
        particle.vx -= (vdx / vdist) * force * 0.1;
        particle.vy -= (vdy / vdist) * force * 0.1;
      }
    } else {
      const mdx = particle.x - mouse.x;
      const mdy = particle.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mdist > 0) {
        const mforce = (config.mouseForce as number) / mdist;
        particle.vx += (mdx / mdist) * mforce * speed;
        particle.vy += (mdy / mdist) * mforce * speed;
      }
    }
  }

  let dampingFactor = gravityFactor;
  if (!mouse.active && distance < 10) {
    dampingFactor = Math.max(0.8, gravityFactor);
  }

  particle.vx *= dampingFactor;
  particle.vy *= dampingFactor;

  if (
    !mouse.active &&
    distance < 1 &&
    Math.abs(particle.vx) < 0.1 &&
    Math.abs(particle.vy) < 0.1
  ) {
    particle.x = origin.x;
    particle.y = origin.y;
    particle.vx = 0;
    particle.vy = 0;
  } else {
    particle.x += particle.vx;
    particle.y += particle.vy;
  }
}

/**
 * Calculate luminance of a color to determine if it's light or dark
 */
function getLuminance(r: number, g: number, b: number): number {
  // Convert RGB to relative luminance using sRGB formula
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Enhance color contrast for better visibility
 */
function enhanceContrast(color: [number, number, number, number]): [number, number, number, number] {
  const [r, g, b, a] = color;
  const luminance = getLuminance(r, g, b);
  
  // If the color is too light (luminance > 0.8), darken it
  if (luminance > 0.8) {
    const factor = 0.3; // Darken by 70%
    return [
      Math.round(r * factor),
      Math.round(g * factor),
      Math.round(b * factor),
      a
    ];
  }
  
  // If the color is too dark (luminance < 0.2), lighten it slightly
  if (luminance < 0.2) {
    const factor = 1.5; // Lighten by 50%
    return [
      Math.min(255, Math.round(r * factor)),
      Math.min(255, Math.round(g * factor)),
      Math.min(255, Math.round(b * factor)),
      a
    ];
  }
  
  // Color has good contrast, return as is
  return color;
}

export function drawParticle(
  particle: Particle,
  origin: Origin,
  ctx: CanvasRenderingContext2D,
  config: ParticleCanvasOptions
) {
  const filteredColor = applyFilter(
    origin.color,
    config.filter as 'none' | 'grayscale' | 'sepia' | 'invert',
    config.hueRotation as number,
    config.brightness as number // This is the new line you need to add
  );
  
  // Enhance contrast for better visibility in light mode
  const enhancedColor = enhanceContrast(filteredColor);
  
  ctx.fillStyle = `rgba(${enhancedColor[0]}, ${enhancedColor[1]}, ${enhancedColor[2]}, ${enhancedColor[3] / 255})`;

  const x = Math.floor(particle.x);
  const y = Math.floor(particle.y);
  const size = (config.particleGap as number) / 2;

  // Check if particleShape is a function
  // Then handle custom shapes
  if (typeof config.particleShape === 'function') {
    config.particleShape(ctx, x, y, size);
    return;
  }

  // Handle Built-in shapes
  switch (config.particleShape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x - size, y + size);
      ctx.closePath();
      ctx.fill();
      break;
    case 'hexagon':
      const sides = 6;
      const rotation = -Math.PI / 2; // point a vertex up
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = rotation + (i * 2 * Math.PI) / sides;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 'star':
      const points = 5;
      const rot = -Math.PI / 2; // tip up
      const outer = size;
      const inner = size * 0.38;
      ctx.beginPath();
      const step = Math.PI / points; // half-angle step (outer->inner)
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = rot + i * step;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 'diamond':
      const r = size; // radius convention as circle/hex/star
      const flatTopRatio = 0.45; // 0..1 (0 = pointed, 1 = fully flat at center)
      const h = r * flatTopRatio; // how much of the top is flattened

      ctx.beginPath();
      ctx.moveTo(x - h, y - r + h); // top-left of the flat edge
      ctx.lineTo(x + h, y - r + h); // top-right of the flat edge
      ctx.lineTo(x + r, y); // right point
      ctx.lineTo(x, y + r); // bottom point
      ctx.lineTo(x - r, y); // left point
      ctx.closePath();
      ctx.fill();
      break;
    case 'square':
    default:
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      break;
  }
}

export function applyFilter(
  color: [number, number, number, number],
  filter: 'none' | 'grayscale' | 'sepia' | 'invert',
  hueRotation: number,
  brightness: number // The new brightness parameter is added here
): [number, number, number, number] {
  let red = color[0];
  let green = color[1];
  let blue = color[2];
  const alpha = color[3];

  switch (filter) {
    case 'grayscale':
      const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
      red = green = blue = gray;
      break;
    case 'sepia':
      const tempRed = Math.min(255, 0.393 * red + 0.769 * green + 0.189 * blue);
      const tempGreen = Math.min(
        255,
        0.349 * red + 0.686 * green + 0.168 * blue
      );
      const tempBlue = Math.min(
        255,
        0.272 * red + 0.534 * green + 0.131 * blue
      );
      red = tempRed;
      green = tempGreen;
      blue = tempBlue;
      break;
    case 'invert':
      red = 255 - red;
      green = 255 - green;
      blue = 255 - blue;
      break;
    default:
      break;
  }

  if (hueRotation !== 0) {
    red /= 255;
    green /= 255;
    blue /= 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    let hue = 0;
    let saturation = 0;
    const lightness = (max + min) / 2;

    if (max !== min) {
      const colorDifference = max - min;
      saturation =
        lightness > 0.5
          ? colorDifference / (2 - max - min)
          : colorDifference / (max + min);
      switch (max) {
        case red:
          hue = (green - blue) / colorDifference + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / colorDifference + 2;
          break;
        case blue:
          hue = (red - green) / colorDifference + 4;
          break;
      }
      hue /= 6;
    }

    hue = (hue * 360 + hueRotation) % 360;
    if (hue < 0) hue += 360;
    hue /= 360;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q =
      lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    red = hue2rgb(p, q, hue + 1 / 3);
    green = hue2rgb(p, q, hue);
    blue = hue2rgb(p, q, hue - 1 / 3);

    red = Math.round(red * 255);
    green = Math.round(green * 255);
    blue = Math.round(blue * 255);
  }

  // This is the new block that applies the brightness correction
  if (brightness !== 1) {
    red = Math.min(255, red * brightness);
    green = Math.min(255, green * brightness);
    blue = Math.min(255, blue * brightness);
  }

  return [red, green, blue, alpha];
}

export function applyClickForce(
  particles: Particle[],
  clickX: number,
  clickY: number,
  config: ParticleCanvasOptions
) {
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const dx = particle.x - clickX;
    const dy = particle.y - clickY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const force = (config.clickStrength as number) / (distance + 1);
      particle.vx += (dx / distance) * force * 0.1;
      particle.vy += (dy / distance) * force * 0.1;
    }
  }
}