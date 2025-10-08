import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as tar from 'tar';

const CACHE_URL = 'https://download.gnome.org/sources/gnome-icon-theme-symbolic/cache.json';
const BASE_URL = 'https://download.gnome.org/sources/gnome-icon-theme-symbolic';
const ICONS_DIR = path.resolve(__dirname, '..', 'icons');
const TEMP_DIR = path.resolve(__dirname, '..', 'temp');

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function cleanupDir(dir: string) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function fetchJSON(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}

async function extractTarXz(archivePath: string, destDir: string): Promise<void> {
    console.log(`📦 Extracting archive to ${destDir}...`);

    try {
        await tar.x({
            file: archivePath,
            cwd: destDir,
        });
    } catch (error) {
        throw new Error(`Extraction error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function copyIconsToDestination(tempDir: string, iconsDir: string): void {
    console.log(`📋 Copying icons to ${iconsDir}...`);

    const extractedDirs = fs.readdirSync(tempDir).filter(f =>
        fs.statSync(path.join(tempDir, f)).isDirectory()
    );

    if (extractedDirs.length === 0) {
        throw new Error('No extracted directory found');
    }

    const firstExtractedDir = extractedDirs[0];
    if (!firstExtractedDir) {
        throw new Error('No extracted directory found');
    }

    const extractedDir = path.join(tempDir, firstExtractedDir);
    console.log(`📂 Extracted directory: ${extractedDir}`);

    const possibleIconDirs = [
        path.join(extractedDir, 'src'),
        path.join(extractedDir, 'icons'),
        extractedDir
    ];

    let iconCount = 0;

    for (const dir of possibleIconDirs) {
        if (fs.existsSync(dir)) {
            console.log(`🔍 Searching for icons in ${dir}...`);

            const findSvgFiles = (currentDir: string): string[] => {
                const entries = fs.readdirSync(currentDir, { withFileTypes: true });
                let svgFiles: string[] = [];

                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);
                    if (entry.isDirectory()) {
                        svgFiles = svgFiles.concat(findSvgFiles(fullPath));
                    } else if (entry.name.endsWith('.svg') && entry.name.includes('symbolic')) {
                        svgFiles.push(fullPath);
                    }
                }

                return svgFiles;
            };

            const svgFiles = findSvgFiles(dir);

            for (const svgFile of svgFiles) {
                const fileName = path.basename(svgFile);
                const destPath = path.join(iconsDir, fileName);
                fs.copyFileSync(svgFile, destPath);
                iconCount++;
            }
        }
    }

    console.log(`✅ ${iconCount} icons copied successfully`);
}

async function main() {
    try {
        console.log('🚀 Downloading GNOME Symbolic icons...\n');

        console.log('📥 Fetching version information...');
        const cacheData: any[] = await fetchJSON(CACHE_URL);

        const versionData = cacheData[1]['gnome-icon-theme-symbolic'];
        const versionList = cacheData[2]['gnome-icon-theme-symbolic'];

        const latestVersion = versionList[versionList.length - 1];
        console.log(`📌 Latest version found: ${latestVersion}`);

        const downloadInfo = versionData[latestVersion];

        if (!downloadInfo || !downloadInfo['tar.xz']) {
            throw new Error(`No tar.xz file found for version ${latestVersion}`);
        }

        const tarXzPath = downloadInfo['tar.xz'];
        const downloadUrl = `${BASE_URL}/${tarXzPath}`;

        console.log(`🌐 Download URL: ${downloadUrl}\n`);

        ensureDir(TEMP_DIR);
        ensureDir(ICONS_DIR);

        console.log('🧹 Cleaning icons directory...');
        const existingIcons = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));
        for (const icon of existingIcons) {
            fs.unlinkSync(path.join(ICONS_DIR, icon));
        }

        const archivePath = path.join(TEMP_DIR, `gnome-icon-theme-symbolic-${latestVersion}.tar.xz`);
        console.log(`⬇️  Downloading archive...`);
        await downloadFile(downloadUrl, archivePath);
        console.log('✅ Download completed\n');

        await extractTarXz(archivePath, TEMP_DIR);
        console.log('✅ Extraction completed\n');

        copyIconsToDestination(TEMP_DIR, ICONS_DIR);

        console.log('\n🧹 Cleaning up temporary files...');
        cleanupDir(TEMP_DIR);

        console.log('\n🎉 Download and extraction completed successfully!');
        console.log(`📁 Icons are available in: ${ICONS_DIR}`);
        console.log('\n💡 Next step: run `bun run generate` to generate Vue components');

    } catch (error) {
        console.error('❌ Error:', error);

        if (fs.existsSync(TEMP_DIR)) {
            cleanupDir(TEMP_DIR);
        }

        process.exit(1);
    }
}

main();
