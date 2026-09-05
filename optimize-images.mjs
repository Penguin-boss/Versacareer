import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');
const assetsBrandDir = path.join(publicDir, 'assets', 'brand');

async function convertImagesInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.png')) {
      const filePath = path.join(dir, file);
      const webpPath = filePath.replace('.png', '.webp');
      console.log(`Converting ${file} to webp...`);
      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      // optionally delete the old png
      // fs.unlinkSync(filePath);
    }
  }
}

async function run() {
  await convertImagesInDir(publicDir);
  await convertImagesInDir(assetsBrandDir);
  console.log('Image conversion complete.');
}

run();
