#!/usr/bin/env node
/**
 * Renders the four launcher assets from the mark in `AppLogo.tsx`.
 *
 *     npm run icons          # needs rsvg-convert (brew install librsvg)
 *
 * `AppLogo.tsx` claims the icon, the splash and the favicon are the same paths
 * as the on-screen mark and so cannot drift. This is the script that makes that
 * true rather than aspirational: the three path strings are read *out of* the
 * component at run time, not copied here, so editing the component and
 * forgetting this file is not a failure mode that exists. If the component is
 * refactored past what these patterns match, the script stops rather than
 * quietly emitting the old art.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SOURCE = join(ROOT, 'src/views/components/AppLogo.tsx');
const ASSETS = join(ROOT, 'assets');

const source = readFileSync(SOURCE, 'utf8');
const read = (name) => {
  // `\\s*` because a long path wraps onto its own line under the formatter.
  const found = source.match(new RegExp(`const ${name} =\\s*'([^']+)'`));
  if (!found) throw new Error(`${name} not found in AppLogo.tsx — the mark moved; fix this script.`);
  return found[1];
};
const num = (name) => {
  const found = source.match(new RegExp(`const ${name} =\\s*(\\d+(?:\\.\\d+)?);`));
  if (!found) throw new Error(`${name} not found in AppLogo.tsx — the mark moved; fix this script.`);
  return Number(found[1]);
};

const BODY = read('BODY');
const ECHO = read('ECHO');
const COMPACT = read('COMPACT');
const ECHO_WIDTH = num('ECHO_WIDTH');
const SPAN = { full: num('SPAN_FULL'), compact: num('SPAN_COMPACT') };

const mark = (variant, color) =>
  variant === 'compact'
    ? `    <path d="${COMPACT}" fill="${color}"/>`
    : [
        `    <path d="${BODY}" fill="${color}"/>`,
        `    <path d="${ECHO}" fill="none" stroke="${color}" stroke-width="${ECHO_WIDTH}" stroke-linecap="round"/>`,
      ].join('\n');

/**
 * `cover` is the fraction of the canvas the mark should occupy, and it is set
 * per target rather than once: a launcher icon wants generous margin because
 * the platform crops it into a squircle, an Android adaptive foreground must
 * stay inside the central 66% safe zone that survives every OEM mask shape,
 * and a splash drawn at 180pt over an empty screen wants none of that caution.
 *
 * Both forms are sized on the *implied circle* rather than on the ink's
 * bounding box, because the aperture is negative space that belongs to the
 * mark. Those two spans are read out of AppLogo.tsx rather than measured here,
 * so re-cutting the geometry cannot leave these assets cropped or floating.
 * Horizontal centring is not this script's business either: the arcs are
 * already struck right of the grid's centre to pay for the aperture, so
 * dropping the 120 grid squarely on the canvas lands the mark where it should
 * be. See the note on the endpoints in AppLogo.tsx.
 */
const doc = ({ px, ground, color, variant, cover }) => {
  const scale = (px * cover) / SPAN[variant];
  const offset = (px - 120 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
${ground ? `  <rect width="${px}" height="${px}" fill="${ground}"/>\n` : ''}  <g transform="translate(${offset} ${offset}) scale(${scale})">
${mark(variant, color)}
  </g>
</svg>
`;
};

const BLUE = '#2B4BF2';
// The ground app.json already paints behind the splash and the adaptive icon.
// Kept identical here so the icon does not show a seam against them.
const GROUND = '#F7F8FC';

const targets = [
  // Opaque: iOS rejects a launcher icon with an alpha channel, and it is the
  // one asset the platform never composites over anything of its own.
  //
  // Named `app-icon.png`, not `icon.png`, on purpose. Expo Go's loading screen
  // fetches this from a URL built from the filename, with no content hash, and
  // caches it on the phone; under the old name it kept showing the droplet mark
  // this replaced long after the file itself had changed. If the art changes
  // again and a phone shows the previous version, a new filename is the fix.
  { file: 'app-icon.png', px: 1024, ground: GROUND, color: BLUE, variant: 'full', cover: 0.62 },
  { file: 'adaptive-icon.png', px: 1024, ground: null, color: BLUE, variant: 'full', cover: 0.5 },
  // 1024 rather than the 512 this replaced: app.json draws the splash at
  // imageWidth 180, which is 540 physical pixels on a 3x phone, so a 512
  // source was being upscaled on every launch.
  { file: 'splash-icon.png', px: 1024, ground: null, color: BLUE, variant: 'full', cover: 0.8 },
  // Compact: a favicon is served at 64 and then thrown away at 16 by the
  // browser, and the hairline echo is gone long before that.
  { file: 'favicon.png', px: 64, ground: null, color: BLUE, variant: 'compact', cover: 0.74 },
];

const scratch = mkdtempSync(join(tmpdir(), 'clarity-icons-'));

for (const target of targets) {
  const svg = join(scratch, `${target.file}.svg`);
  const png = join(ASSETS, target.file);
  writeFileSync(svg, doc(target));
  execFileSync('rsvg-convert', ['-w', String(target.px), '-h', String(target.px), '-o', png, svg]);
  console.log(`${target.file.padEnd(18)} ${target.px}px  ${target.variant}`);
}
