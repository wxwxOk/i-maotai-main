/**
 * 将 SVG 图标转换为 PNG
 *
 * 使用前请先安装依赖:
 * npm install sharp
 *
 * 运行: node scripts/svg-to-png.js
 */

const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  let sharp;

  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('未安装 sharp 库，请先运行: npm install sharp');
    console.log('\n或者手动转换 SVG 文件为 PNG:');
    console.log('  1. 访问 https://cloudconvert.com/svg-to-png');
    console.log('  2. 上传 assets/icons/svg/ 目录下的 SVG 文件');
    console.log('  3. 下载转换后的 PNG 文件到 assets/icons/ 目录');
    return;
  }

  const svgDir = path.join(__dirname, '../assets/icons/svg');
  const pngDir = path.join(__dirname, '../assets/icons');

  const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));

  for (const file of files) {
    const svgPath = path.join(svgDir, file);
    const pngName = file.replace('.svg', '.png');
    const pngPath = path.join(pngDir, pngName);

    try {
      await sharp(svgPath)
        .resize(81, 81)
        .png()
        .toFile(pngPath);

      console.log(`✓ ${file} -> ${pngName}`);
    } catch (err) {
      console.error(`✗ ${file} 转换失败:`, err.message);
    }
  }

  console.log('\n图标转换完成！');
}

convertSvgToPng();
