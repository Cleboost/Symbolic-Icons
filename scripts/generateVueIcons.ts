import * as fs from 'fs';
import * as path from 'path';
import { optimize } from 'svgo';

type ExportEntry = {
  basename: string;
  exportName: string;
  filePath: string;
}

const ICONS_DIR = path.resolve(__dirname, '..', 'icons');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'icons');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function pascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\-_/]/g, '')
    .replace(/(^[a-z])|([\-_/]+[a-z])/g, (match) => match.replace(/[^a-z]/g, '').toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

function buildVueSfc(svg: string): string {
  let optimized = svg;
  optimized = optimized.replace(/<\?xml[\s\S]*?\?>/g, '');
  optimized = optimized.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

  const svgoResult = optimize(optimized, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: { 
          overrides: { 
            removeViewBox: false,
          } 
        },
      },
      { name: 'removeDimensions' },
      { name: 'removeAttrs', params: { attrs: '(fill|stroke|style)' } },
      { name: 'removeXMLNS' },
      { name: 'removeMetadata' },
      { name: 'removeEditorsNSData' },
    ],
  });

  if ('data' in svgoResult) {
    optimized = svgoResult.data;
  }

  optimized = optimized.replace(/\s+(xmlns:[a-z]+|inkscape:[a-z-]+|sodipodi:[a-z-]+|rdf:[a-z-]+|cc:[a-z-]+|dc:[a-z-]+)="[^"]*"/gi, '');

  const viewBoxMatch = optimized.match(/viewBox=["']([^"']+)["']/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 16 16';

  optimized = optimized.replace(
    /<svg\b[^>]*>/i,
    `<svg :width="props.size ?? (($attrs as any).width ?? 16)" :height="props.size ?? (($attrs as any).height ?? 16)" :fill="props.color ?? (($attrs as any).fill ?? 'currentColor')" viewBox="${viewBox}" v-bind="$attrs" :style="[{ opacity: props.opacity ?? 1 }, ($attrs as any).style]">`
  );

  optimized = optimized
    .replace(/(<svg[^>]*>)/i, '$1\n  ')
    .replace(/(<path[^>]*\/>)/g, '$1\n  ')
    .replace(/(<\/svg>)/i, '\n$1');

  const sfc = `
<template>
  ${optimized.trim()}
</template>

<script setup lang="ts">
import type { SymbolicIconsProps } from '../types/SymbolicIconsProps';
const props = defineProps<SymbolicIconsProps>();
</script>
`;

  return sfc.trim() + '\n';
}

function generateIndex(entries: ExportEntry[]): string {
  const exportLines = entries.map((e) => `export { default as ${e.exportName} } from './${e.basename}.vue';`).join('\n');
  const enumLines = entries.map((e) => `${e.exportName} = "${e.exportName}"`).join(',\n  ');
  return `
${exportLines}

export enum IconNames {
  ${enumLines}
}
`.trim() + '\n';
}

function main() {
  ensureDir(OUT_DIR);
  const files = fs.readdirSync(ICONS_DIR).filter((f) => f.endsWith('.svg'));
  const entries: ExportEntry[] = [];

  for (const file of files) {
    const abs = path.join(ICONS_DIR, file);
    const svg = fs.readFileSync(abs, 'utf8');
    const base = path.basename(file, path.extname(file));
    const cleanBase = base.replace(/[^a-zA-Z0-9\-_]/g, '');
    const exportName = /^\d/.test(cleanBase) ? `Svg${pascalCase(cleanBase)}` : pascalCase(cleanBase);
    const outPath = path.join(OUT_DIR, `${cleanBase}.vue`);
    const sfc = buildVueSfc(svg);
    fs.writeFileSync(outPath, sfc, 'utf8');
    entries.push({ basename: cleanBase, exportName, filePath: outPath });
  }

  const indexContent = generateIndex(entries);
  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), indexContent, 'utf8');
}

main();


