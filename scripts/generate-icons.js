import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function createIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const scale = size / 512;
  const padding = isMaskable ? 0.8 : 0.95; // 80% safe zone for maskable

  // Colors
  const bgTealDark = [4, 47, 46, 255]; // #042f2e
  const bgTeal = [17, 94, 89, 255]; // #115e59
  const gold = [245, 158, 11, 255]; // #f59e0b
  const lightGold = [254, 240, 138, 255]; // #fef08a
  const coffeeBrown = [69, 26, 3, 255]; // #451a03
  const saucerTeal = [19, 78, 74, 255]; // #134e4a
  const white = [255, 255, 255, 255];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Transform to normalized 512x512 coordinate space with safe-zone scaling
      const nx = ((x - size / 2) / (scale * padding)) + 256;
      const ny = ((y - size / 2) / (scale * padding)) + 256;

      // Base background: gradient from teal to dark teal
      const bgProgress = Math.min(1, Math.max(0, (y + x) / (size * 2)));
      let r = Math.round(bgTeal[0] * (1 - bgProgress) + bgTealDark[0] * bgProgress);
      let g = Math.round(bgTeal[1] * (1 - bgProgress) + bgTealDark[1] * bgProgress);
      let b = Math.round(bgTeal[2] * (1 - bgProgress) + bgTealDark[2] * bgProgress);
      let a = 255;

      // If not maskable, we can round the corners or keep full-bleed
      if (!isMaskable) {
        // Corner radius
        const cornerR = size * 0.2;
        const inLeft = x < cornerR;
        const inRight = x > size - cornerR;
        const inTop = y < cornerR;
        const inBottom = y > size - cornerR;

        if ((inLeft || inRight) && (inTop || inBottom)) {
          const cx = inLeft ? cornerR : size - cornerR;
          const cy = inTop ? cornerR : size - cornerR;
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > cornerR) {
            a = 0; // Transparent outside corner
          }
        }
      }

      if (a > 0) {
        // Golden circular frame
        const distFromCenter = Math.hypot(nx - 256, ny - 256);
        if (distFromCenter >= 204 && distFromCenter <= 212) {
          r = gold[0];
          g = gold[1];
          b = gold[2];
        }

        // Saucer plate: ellipse at cx=256, cy=400, rx=170, ry=26
        const saucerDx = (nx - 256) / 170;
        const saucerDy = (ny - 400) / 26;
        if (saucerDx * saucerDx + saucerDy * saucerDy <= 1) {
          r = saucerTeal[0];
          g = saucerTeal[1];
          b = saucerTeal[2];

          // Gold border around saucer rim
          if (saucerDx * saucerDx + saucerDy * saucerDy >= 0.8) {
            r = gold[0];
            g = gold[1];
            b = gold[2];
          }
        }

        // Handle: loop on right side
        const hDx = (nx - 365) / 45;
        const hDy = (ny - 275) / 48;
        const hDist = hDx * hDx + hDy * hDy;
        if (hDist <= 1.0 && hDist >= 0.45 && nx > 310) {
          r = gold[0];
          g = gold[1];
          b = gold[2];
        }

        // Cup body: between ny 210 and 375, curved
        if (ny >= 210 && ny <= 375) {
          const progress = (ny - 210) / (375 - 210);
          const halfWidth = 116 * (1 - progress * 0.38);
          if (Math.abs(nx - 256) <= halfWidth) {
            // Gold gradient
            r = gold[0];
            g = gold[1];
            b = gold[2];

            // Inner warm shading
            if (Math.abs(nx - 256) <= halfWidth * 0.85) {
              r = lightGold[0];
              g = lightGold[1];
              b = lightGold[2];
            }
          }
        }

        // Cup Rim (Outer ellipse at ny=210)
        const rimDx = (nx - 256) / 116;
        const rimDy = (ny - 210) / 24;
        if (rimDx * rimDx + rimDy * rimDy <= 1) {
          r = gold[0];
          g = gold[1];
          b = gold[2];

          // Coffee inside rim
          const coffeeDx = (nx - 256) / 100;
          const coffeeDy = (ny - 210) / 18;
          if (coffeeDx * coffeeDx + coffeeDy * coffeeDy <= 1) {
            r = coffeeBrown[0];
            g = coffeeBrown[1];
            b = coffeeBrown[2];
          }
        }

        // Steam trails
        // Left trail
        if (ny >= 70 && ny <= 180) {
          const steam1X = 210 + Math.sin((ny - 70) * 0.08) * 16;
          if (Math.abs(nx - steam1X) <= 5) {
            r = 254;
            g = 243;
            b = 199;
          }
          const steam2X = 256 + Math.cos((ny - 70) * 0.08) * 16;
          if (Math.abs(nx - steam2X) <= 6) {
            r = 254;
            g = 243;
            b = 199;
          }
          const steam3X = 302 + Math.sin((ny - 70) * 0.08) * 16;
          if (Math.abs(nx - steam3X) <= 5) {
            r = 254;
            g = 243;
            b = 199;
          }
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return png;
}

const targets = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

targets.forEach(({ name, size, maskable }) => {
  const icon = createIcon(size, maskable);
  const filePath = path.join(publicDir, name);
  const buffer = PNG.sync.write(icon);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${name} (${size}x${size})`);
});
