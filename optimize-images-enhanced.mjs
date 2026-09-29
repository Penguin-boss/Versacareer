import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');
const assetsBrandDir = path.join(publicDir, 'assets', 'brand');
const distDir = path.join(process.cwd(), 'dist');

async function convertImagesInDir(dir, quality = 80) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip if it's a directory
    if (stat.isDirectory()) {
      await convertImagesInDir(filePath, quality);
      continue;
    }
    
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const avifPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.avif');
      
      console.log(`Processing ${file} (${(stat.size / 1024).toFixed(1)} KB)...`);
      
      try {
        // Convert to WebP
        await sharp(filePath)
          .webp({ quality, effort: 6 })
          .toFile(webpPath);
        
        // Convert to AVIF (better compression)
        await sharp(filePath)
          .avif({ quality: quality - 10, effort: 9 })
          .toFile(avifPath);
        
        // Also create optimized PNG if original is large (>100KB)
        if (stat.size > 100 * 1024 && file.endsWith('.png')) {
          const optimizedPngPath = filePath.replace('.png', '-optimized.png');
          await sharp(filePath)
            .png({ quality: 80, compressionLevel: 9, adaptiveFiltering: true })
            .toFile(optimizedPngPath);
          
          // Replace original if optimized is smaller
          const optimizedStat = fs.statSync(optimizedPngPath);
          if (optimizedStat.size < stat.size) {
            fs.unlinkSync(filePath);
            fs.renameSync(optimizedPngPath, filePath);
            console.log(`  Optimized PNG: ${(stat.size / 1024).toFixed(1)} KB -> ${(optimizedStat.size / 1024).toFixed(1)} KB`);
          } else {
            fs.unlinkSync(optimizedPngPath);
          }
        }
        
        const webpStat = fs.statSync(webpPath);
        const avifStat = fs.statSync(avifPath);
        console.log(`  WebP: ${(webpStat.size / 1024).toFixed(1)} KB, AVIF: ${(avifStat.size / 1024).toFixed(1)} KB`);
        
      } catch (err) {
        console.error(`  Error processing ${file}:`, err.message);
      }
    }
  }
}

async function generateResponsiveImages(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await generateResponsiveImages(filePath);
      continue;
    }
    
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp')) {
      // Generate responsive sizes for hero images and large images
      if (stat.size > 50 * 1024 && (file.includes('logo') || file.includes('hero') || file.includes('banner') || file.includes('og-card'))) {
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);
        
        const sizes = [320, 640, 768, 1024, 1280, 1920];
        
        for (const width of sizes) {
          const responsivePath = path.join(dir, `${baseName}-${width}w.webp`);
          try {
            await sharp(filePath)
              .resize({ width, withoutEnlargement: true })
              .webp({ quality: 75 })
              .toFile(responsivePath);
            console.log(`  Generated ${baseName}-${width}w.webp`);
          } catch (err) {
            // Ignore errors for responsive generation
          }
        }
      }
    }
  }
}

async function run() {
  console.log('Starting enhanced image optimization...');
  await convertImagesInDir(publicDir, 80);
  await convertImagesInDir(assetsBrandDir, 80);
  await convertImagesInDir(distDir, 80);
  
  console.log('\nGenerating responsive images...');
  await generateResponsiveImages(assetsBrandDir);
  
  console.log('\nImage optimization complete!');
}

run();