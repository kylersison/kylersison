// Run with: npm run photos
//
// Takes full-size photos from photos-raw/ and makes web-sized copies in
// public/pictures/ (which the carousel reads). Originals are never changed.
// Safe to run again and again: photos that are already converted are skipped.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAW = 'photos-raw';
const OUT = 'public/pictures';
const LONG_EDGE = 1600; // longest side in px: sharp on high-res screens, still small files
const QUALITY = 78; // WebP quality 0-100: ~75-80 looks the same as the original at this size

fs.mkdirSync(OUT, { recursive: true });

// "IMG 2041 Kyoto_Sunset.JPG" -> "img-2041-kyoto-sunset"
// (this name also becomes the photo's alt text in the carousel)
function cleanName(file) {
	return path
		.parse(file)
		.name.toLowerCase()
		.replace(/[\s_]+/g, '-') // spaces and underscores -> dashes
		.replace(/[^a-z0-9-]/g, '') // drop anything else odd
		.replace(/-+/g, '-') // no double dashes
		.replace(/^-|-$/g, ''); // no dashes at the ends
}

const files = fs.readdirSync(RAW).filter((f) => !f.startsWith('.'));
let made = 0;

for (const file of files) {
	const input = path.join(RAW, file);
	const ext = path.extname(file).toLowerCase();

	if (ext === '.heic' || ext === '.heif') {
		console.log(`skip  ${file}  (HEIC isn't supported: export it as JPEG first)`);
		continue;
	}
	if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff'].includes(ext)) continue;

	const output = path.join(OUT, `${cleanName(file)}.webp`);

	// Already converted, and the original hasn't changed since? Skip it.
	if (fs.existsSync(output) && fs.statSync(output).mtimeMs >= fs.statSync(input).mtimeMs) continue;

	await sharp(input)
		.rotate() // apply the phone's "which way is up" tag, or some photos come out sideways
		.resize({
			width: LONG_EDGE,
			height: LONG_EDGE,
			fit: 'inside', // shrink to fit inside a square, keeping the photo's shape
			withoutEnlargement: true, // never blow up small photos
		})
		.webp({ quality: QUALITY })
		.toFile(output);
	// sharp drops the photo's metadata by default, including GPS location. Good for a public site.

	const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
	console.log(`made  ${output}  (${kb(fs.statSync(input).size)} -> ${kb(fs.statSync(output).size)})`);
	made++;
}

console.log(made ? `\nDone: ${made} new photo(s).` : 'Nothing new to convert.');
