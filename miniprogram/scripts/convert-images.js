/**
 * 将图片 SVG 转换为 PNG
 * 运行: node scripts/convert-images.js
 */

const fs = require('fs');
const path = require('path');

async function convertImages() {
  let sharp;

  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('请先安装 sharp: npm install sharp');
    return;
  }

  const svgDir = path.join(__dirname, '../assets/images/svg');
  const pngDir = path.join(__dirname, '../assets/images');

  if (!fs.existsSync(svgDir)) {
    console.log('SVG 目录不存在');
    return;
  }

  const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));

  for (const file of files) {
    const svgPath = path.join(svgDir, file);
    const pngName = file.replace('.svg', '.png');
    const pngPath = path.join(pngDir, pngName);

    try {
      await sharp(svgPath)
        .resize(200, 200)
        .png()
        .toFile(pngPath);

      console.log(`✓ ${file} -> ${pngName}`);
    } catch (err) {
      console.error(`✗ ${file} 转换失败:`, err.message);
    }
  }

  console.log('\n图片转换完成！');
}

convertImages();
