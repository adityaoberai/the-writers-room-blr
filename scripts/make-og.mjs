/**
 * Generates brand assets into /static from the source logo (static/logo.jpg):
 *  - favicon.png          (48x48)
 *  - apple-touch-icon.png (180x180)
 *  - logo-mark.png        (128x128, used in the header/footer)
 *  - og.png               (1200x630 social image: logo badge + wordmark)
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

const NAVY = '#0F172A';
const STEEL = '#2F6FB0';
const STEEL_2 = '#9DBBD8';
const AMBER = '#F59E0B';

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

function wrap(text, max) {
	const words = text.split(' ');
	const lines = [];
	let line = '';
	for (const w of words) {
		if ((line + ' ' + w).trim().length > max) {
			lines.push(line.trim());
			line = w;
		} else {
			line = (line + ' ' + w).trim();
		}
	}
	if (line) lines.push(line);
	return lines;
}

function ogSvg() {
	const subtitle =
		'A focused writing community for Bengaluru writers to create, connect, and grow together.';
	const subTspans = wrap(subtitle, 52)
		.map((l, i) => `<tspan x="90" dy="${i === 0 ? 0 : 54}">${l}</tspan>`)
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1020"/>
      <stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="14" height="630" fill="${STEEL}"/>
  <circle cx="1050" cy="150" r="230" fill="${STEEL}" opacity="0.16"/>
  <circle cx="1120" cy="540" r="150" fill="${STEEL_2}" opacity="0.12"/>
  <text x="90" y="212" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="26"
    letter-spacing="6" fill="${STEEL_2}" font-weight="600">BENGALURU · WRITING COMMUNITY</text>
  <text x="86" y="332" font-family="Playfair Display, Georgia, serif" font-size="74"
    font-weight="700" fill="#F8FAFC">The Writers&#39; Room BLR</text>
  <text x="90" y="432" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="38"
    fill="#CBD5E1">${subTspans}</text>
  <rect x="90" y="550" width="170" height="6" rx="3" fill="${AMBER}"/>
</svg>`;
}

const bgPng = new Resvg(ogSvg(), { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

const badge = 120;
const roundMask = Buffer.from(
	`<svg width="${badge}" height="${badge}"><rect width="${badge}" height="${badge}" rx="26" fill="#fff"/></svg>`
);
const logoBadge = await sharp(logoPath)
	.resize(badge, badge, { fit: 'cover' })
	.composite([{ input: roundMask, blend: 'dest-in' }])
	.png()
	.toBuffer();

const og = await sharp(bgPng)
	.composite([{ input: logoBadge, top: 56, left: 90 }])
	.png()
	.toBuffer();
writeFileSync(join(staticDir, 'og.png'), og);

console.log('Wrote static/favicon.png, apple-touch-icon.png, logo-mark.png, og.png');
