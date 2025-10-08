import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursive(src: string, dest: string) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    ensureDir(dest);
    const files = fs.readdirSync(src);
    
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  
  console.log('📦 Copying source files to dist...');
  ensureDir(DIST_DIR);
  copyRecursive(SRC_DIR, DIST_DIR);
  
  console.log('📝 Generating TypeScript declarations...');
  const result = spawnSync('vue-tsc', ['--project', 'tsconfig.build.json'], {
    stdio: 'inherit',
    shell: true
  });
  
  if (result.error) {
    console.error('❌ Error generating types:', result.error);
    process.exit(1);
  }
  
  if (result.status !== 0) {
    console.error('❌ Type generation failed');
    process.exit(1);
  }
  
  console.log('✅ Build completed successfully!');
  console.log(`📁 Output: ${DIST_DIR}`);
}

main();

