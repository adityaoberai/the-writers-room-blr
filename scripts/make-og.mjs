/**
 * Generates brand assets into /static from the source logo (static/logo.jpg):
 *  - favicon.png          (48x48)
 *  - apple-touch-icon.png (180x180)
 *  - logo-mark.png        (128x128, used in the header/footer)
 *  - og.png               (1200x630 social image: a miniature newspaper
 *                          front page — nameplate, rules, columns, one ad)
 *
 * Run with: node scripts/make-og.mjs
 */
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const staticDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'static');
const logoPath = join(staticDir, 'logo.jpg');

// Newspaper palette (mirrors src/app.css)
const INK = '#1b1812';
const PAPER = '#f9f7f0';
const SHADE = '#efebdf';
const HAIRLINE = '#c9c2b0';
const MUTED = '#5b554a';
const BLUE = '#001f9c';
const SERIF = `'Times New Roman', Times, Georgia, serif`;

// Square icons straight from the logo.
await sharp(logoPath).resize(48, 48, { fit: 'cover' }).png().toFile(join(staticDir, 'favicon.png'));
await sharp(logoPath)
	.resize(180, 180, { fit: 'cover' })
	.png()
	.toFile(join(staticDir, 'apple-touch-icon.png'));
await sharp(logoPath)
	.resize(128, 128, { fit: 'cover' })
	.png()
	.toFile(join(staticDir, 'logo-mark.png'));

// A run of greeked body text: light rules standing in for justified lines.
function greek(x, y, width, lines, { gap = 22, h = 10, lastFrac = 0.62 } = {}) {
	const out = [];
	for (let i = 0; i < lines; i++) {
		const w = i === lines - 1 ? Math.round(width * lastFrac) : width;
		out.push(`<rect x="${x}" y="${y + i * gap}" width="${w}" height="${h}" fill="${HAIRLINE}"/>`);
	}
	return out.join('\n  ');
}

function ogSvg() {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="grain" x="0" y="0" width="1" height="1">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect width="1200" height="630" filter="url(#grain)" opacity="0.05"/>

  <!-- Dateline -->
  <text x="70" y="56" font-family="${SERIF}" font-size="19" letter-spacing="3" fill="${MUTED}">VOL. II</text>
  <text x="600" y="56" text-anchor="middle" font-family="${SERIF}" font-size="19" letter-spacing="3" fill="${MUTED}">BENGALURU, INDIA</text>
  <text x="1130" y="56" text-anchor="end" font-family="${SERIF}" font-size="19" letter-spacing="3" fill="${MUTED}">FREE FOR MEMBERS</text>
  <rect x="70" y="72" width="1060" height="1.5" fill="${INK}"/>

  <!-- Nameplate -->
  <text x="600" y="176" text-anchor="middle" font-family="${SERIF}" font-size="92" font-weight="700" letter-spacing="-1" fill="${INK}">The Writers&#8217; Room BLR</text>

  <!-- Double rule under the masthead -->
  <rect x="70" y="210" width="1060" height="3" fill="${INK}"/>
  <rect x="70" y="217" width="1060" height="1" fill="${INK}"/>

  <!-- Column rules -->
  <rect x="416" y="242" width="1" height="318" fill="${HAIRLINE}"/>
  <rect x="782" y="242" width="1" height="318" fill="${HAIRLINE}"/>

  <!-- Col 1: the full logo plate, square frame centered in the column -->
  <rect x="93" y="243" width="280" height="280" fill="${SHADE}" stroke="${INK}" stroke-width="2"/>
  <rect x="93" y="536" width="280" height="1" fill="${INK}"/>
  <text x="93" y="557" font-family="${SERIF}" font-size="16" font-style="italic" fill="${MUTED}">The room&#8217;s plate, hot off the press.</text>

  <!-- Col 2: lead story -->
  <text x="436" y="278" font-family="${SERIF}" font-size="34" font-weight="700" fill="${INK}">Where Bengaluru&#8217;s</text>
  <text x="436" y="314" font-family="${SERIF}" font-size="34" font-weight="700" fill="${INK}">writers gather.</text>
  ${greek(436, 338, 327, 10)}

  <!-- Col 3: display ad -->
  <rect x="803" y="242" width="327" height="316" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
  <rect x="809" y="248" width="315" height="304" fill="none" stroke="${INK}" stroke-width="1"/>
  <text x="966" y="318" text-anchor="middle" font-family="${SERIF}" font-size="18" letter-spacing="5" fill="${MUTED}">MEETUPS</text>
  <text x="966" y="372" text-anchor="middle" font-family="${SERIF}" font-size="42" font-weight="700" fill="${INK}">Weekends</text>
  <text x="966" y="406" text-anchor="middle" font-family="${SERIF}" font-size="19" font-style="italic" fill="${MUTED}">3 hrs of writing &#183; phones down</text>
  <rect x="856" y="440" width="220" height="48" fill="${BLUE}"/>
  <text x="966" y="471" text-anchor="middle" font-family="${SERIF}" font-size="18" font-weight="700" letter-spacing="3" fill="#ffffff">JOIN THE ROOM</text>

  <!-- Bottom: colophon line + press proof -->
  <rect x="70" y="582" width="1060" height="1" fill="${INK}"/>
  <text x="70" y="612" font-family="${SERIF}" font-size="16" letter-spacing="3" fill="${MUTED}">PRINTED MONTHLY IN BENGALURU</text>
  <circle cx="1014" cy="604" r="7" fill="#00aeef"/>
  <circle cx="1036" cy="604" r="7" fill="#ec008c"/>
  <circle cx="1058" cy="604" r="7" fill="#fff200" stroke="${HAIRLINE}" stroke-width="0.5"/>
  <circle cx="1080" cy="604" r="7" fill="${INK}"/>
  <g stroke="${INK}" stroke-width="1" fill="none">
    <circle cx="1112" cy="604" r="8"/>
    <line x1="1112" y1="592" x2="1112" y2="616"/>
    <line x1="1100" y1="604" x2="1124" y2="604"/>
  </g>
</svg>`;
}

const ogPng = new Resvg(ogSvg(), { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

// Print the logo into column 1's photo frame — in full color and complete:
// the frame is square like the logo, so nothing crops. The frame's 2px
// stroke is centered on the rect edge, so the plate sits at the stroke's
// inner edge (1px inside) to meet it exactly.
const plate = await sharp(logoPath).resize(278, 278, { fit: 'cover' }).png().toBuffer();
const og = await sharp(ogPng)
	.composite([{ input: plate, top: 244, left: 94 }])
	.png()
	.toBuffer();
writeFileSync(join(staticDir, 'og.png'), og);

console.log('Wrote static/favicon.png, apple-touch-icon.png, logo-mark.png, og.png');
