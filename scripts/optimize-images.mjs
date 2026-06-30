/**
 * Recursively optimizes static image assets with sharp.
 *
 * Run:
 *   pnpm optimize:images
 *   pnpm optimize:images -- --dry-run
 *   pnpm optimize:images -- --max-width=1600 --quality=78
 */
import process from 'node:process';
import { readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaultRoot = join(repoRoot, 'static');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const defaults = {
	quality: 82,
	maxWidth: 2000,
	minSavings: 1024
};

function printHelp() {
	console.log(`Optimize images under static.

Usage:
  pnpm optimize:images
  pnpm optimize:images -- --dry-run

Options:
  --dry-run              Show what would change without writing files.
  --root=<path>          Directory to scan. Defaults to ./static.
  --quality=<1-100>      JPEG/WebP/AVIF quality. Defaults to ${defaults.quality}.
  --max-width=<px>       Resize wider images down to this width. Defaults to ${defaults.maxWidth}.
                         Use --max-width=0 to keep original dimensions.
  --min-savings=<bytes>  Skip rewrites below this byte saving. Defaults to ${defaults.minSavings}.
  --help                 Show this help text.
`);
}

function parseIntegerOption(name, value, { min, max }) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
		throw new Error(`Expected ${name} to be an integer between ${min} and ${max}.`);
	}
	return parsed;
}

function parseArgs(argv) {
	const options = {
		dryRun: false,
		root: defaultRoot,
		quality: defaults.quality,
		maxWidth: defaults.maxWidth,
		minSavings: defaults.minSavings
	};

	for (const arg of argv) {
		if (arg === '--dry-run') {
			options.dryRun = true;
		} else if (arg === '--help' || arg === '-h') {
			options.help = true;
		} else if (arg.startsWith('--root=')) {
			options.root = resolve(process.cwd(), arg.slice('--root='.length));
		} else if (arg.startsWith('--quality=')) {
			options.quality = parseIntegerOption('quality', arg.slice('--quality='.length), {
				min: 1,
				max: 100
			});
		} else if (arg.startsWith('--max-width=')) {
			options.maxWidth = parseIntegerOption('max-width', arg.slice('--max-width='.length), {
				min: 0,
				max: 20000
			});
		} else if (arg.startsWith('--min-savings=')) {
			options.minSavings = parseIntegerOption('min-savings', arg.slice('--min-savings='.length), {
				min: 0,
				max: Number.MAX_SAFE_INTEGER
			});
		} else {
			throw new Error(`Unknown option: ${arg}`);
		}
	}

	return options;
}

async function listImages(root) {
	const entries = await readdir(root, { withFileTypes: true });
	const files = [];

	entries.sort((a, b) => a.name.localeCompare(b.name));

	for (const entry of entries) {
		const fullPath = join(root, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listImages(fullPath)));
		} else if (entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())) {
			files.push(fullPath);
		}
	}

	return files;
}

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';

	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** exponent;

	return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function relativePath(filePath) {
	return relative(process.cwd(), filePath).replaceAll('\\', '/');
}

function pipelineFor(filePath, options) {
	const extension = extname(filePath).toLowerCase();
	let image = sharp(filePath, { failOn: 'none' }).rotate();

	if (options.maxWidth > 0) {
		image = image.resize({ width: options.maxWidth, withoutEnlargement: true });
	}

	if (extension === '.jpg' || extension === '.jpeg') {
		return image.jpeg({ quality: options.quality, mozjpeg: true, progressive: true });
	}

	if (extension === '.png') {
		return image.png({ adaptiveFiltering: true, compressionLevel: 9, effort: 10 });
	}

	if (extension === '.webp') {
		return image.webp({ quality: options.quality, effort: 6 });
	}

	return image.avif({ quality: options.quality, effort: 6 });
}

async function optimizeImage(filePath, options) {
	const before = (await stat(filePath)).size;
	const optimized = await pipelineFor(filePath, options).toBuffer();
	const saved = before - optimized.length;

	if (saved < options.minSavings) {
		return { status: 'skipped', before, after: before, saved };
	}

	if (!options.dryRun) {
		const tempPath = `${filePath}.${process.pid}.tmp`;
		try {
			await writeFile(tempPath, optimized);
			await rename(tempPath, filePath);
		} catch (error) {
			await unlink(tempPath).catch(() => {});
			throw error;
		}
	}

	return { status: 'optimized', before, after: optimized.length, saved };
}

async function main() {
	const options = parseArgs(process.argv.slice(2));

	if (options.help) {
		printHelp();
		return;
	}

	const rootStats = await stat(options.root).catch(() => null);
	if (!rootStats?.isDirectory()) {
		throw new Error(`Image root does not exist or is not a directory: ${options.root}`);
	}

	const images = await listImages(options.root);
	if (images.length === 0) {
		console.log(`No supported images found under ${relativePath(options.root)}.`);
		return;
	}

	let optimizedCount = 0;
	let skippedCount = 0;
	let beforeTotal = 0;
	let savedTotal = 0;

	console.log(
		`${options.dryRun ? 'Scanning' : 'Optimizing'} ${images.length} image(s) under ${relativePath(
			options.root
		)}`
	);

	for (const filePath of images) {
		const result = await optimizeImage(filePath, options);
		beforeTotal += result.before;

		if (result.status === 'optimized') {
			optimizedCount += 1;
			savedTotal += result.saved;
			console.log(
				`optimized ${relativePath(filePath)} - ${formatBytes(result.before)} -> ${formatBytes(
					result.after
				)} (${formatBytes(result.saved)} saved)`
			);
		} else {
			skippedCount += 1;
			const reason =
				result.saved > 0 ? `${formatBytes(result.saved)} below threshold` : 'not smaller';
			console.log(`skipped   ${relativePath(filePath)} - ${reason}`);
		}
	}

	const percent = beforeTotal > 0 ? ((savedTotal / beforeTotal) * 100).toFixed(1) : '0.0';
	console.log(
		`\nDone. ${optimizedCount} optimized, ${skippedCount} skipped, ${formatBytes(
			savedTotal
		)} saved (${percent}%).`
	);

	if (options.dryRun) {
		console.log('Dry run only. Run `pnpm optimize:images` to write the optimized files.');
	}
}

main().catch((error) => {
	console.error(error?.message || error);
	process.exit(1);
});
