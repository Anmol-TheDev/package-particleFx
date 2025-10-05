
export interface ParticleCanvasOptions {
  particleGap?: number;
  mouseForce?: number;
  gravity?: number;
  noise?: number;
  clickStrength?: number;
  width?: number | string;
  height?: number | string;
  imageSrc?: string;
  hueRotation?: number;
  filter?: 'none' | 'grayscale' | 'sepia' | 'invert';
  particleShape?: 
      'square' 
      | 'circle'
      | 'triangle'
      | 'hexagon'
      | 'star'
      | 'diamond'
      | ((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void);
  vortexMode?: boolean;
  preset?: 'fireworks' | 'snow' | 'galaxy' | 'rain';
  maxParticles?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  isDead: boolean;
}

export interface Origin {
  x: number;
  y: number;
  color: [number, number, number, number];
}
