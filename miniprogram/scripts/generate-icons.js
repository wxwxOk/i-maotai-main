/**
 * 生成 tabBar 占位图标
 * 运行: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// 简单的 PNG 图标 (81x81, 灰色/蓝色圆形)
// 这些是 base64 编码的简单 PNG 图标

// 灰色圆形图标 (未选中状态)
const grayCirclePNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAYAAACqj0o2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF' +
  'HGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0w' +
  'TXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRh' +
  'LyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4MDIt' +
  'MTY6MDY6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcv' +
  'MTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIi' +
  'Lz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkDN3dIAAAGqSURB' +
  'VHja7dxBDoMgEEDRGu9/5ybuujAm6sBQP/S9pAtjMj+IGqfWWgUAAAAAAPwnl+Eb/bR/Q+w+vLxf' +
  '9z7E7sPL+3XvQ+w+vLxf9z7E7sPL+3XvQ+w+vLxf9z7E7sPL+3XvQ+w+vLxf9z7E7sPL+3XvQ+w+' +
  'vLxf9z7E7sPL+3XvQ+w+vLxf9z7E7sPL+3XvQ+w+vLxf9z7E7sPL+3XvQ+w+vLxf9z7E7sPL+3Xv' +
  'Q+w+vLxf9z7E7sPL+3Xve4+s3oeX9+veh9h9eHm/7n2I3YeX9+veh9h9eHm/7n2I3YeX9+veh9h9' +
  'eHm/7n2I3YeX9+veh9h9eHm/7n2I3YeX9+veh9h9eHm/7n2I3YeX9+veh9h9eHm/7n2I3YeX9+ve' +
  'h9h9eHm/7n2I3YeX9+ve9x5ZvQ8v79e9D7H78PJ+3fsQuw8v79e9D7H78PJ+3fsQuw8v79e9D7H7' +
  '8PJ+3fsQuw8v79e9D7H78PJ+3fsQuw8v79e9D7H78PJ+3fsQuw8v79e97z2yeh9e3q97H2L34eX9' +
  'uvchtjb/AHWvOjK4mNGOAAAAAElFTkSuQmCC',
  'base64'
);

// 蓝色圆形图标 (选中状态)
const blueCirclePNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAYAAACqj0o2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF' +
  'HGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0w' +
  'TXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRh' +
  'LyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4MDIt' +
  'MTY6MDY6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcv' +
  'MTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIi' +
  'Lz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PoHCXdIAAAHBSURB' +
  'VHja7dzBCYMwFIDhFO9/55au0ktBMY+YfvT/F3ooGPjIUxPTtm0DAAAAAAAAAL9yCZ7o0/wNYevh' +
  '8X3b+xDaD4/v296H0H54fN/2PoT2w+P7tvchtB8e37e9D6H98Pi+7X0I7YfH923vQ2g/PL5vex9C' +
  '++Hxfdv7ENoPj+/b3ofQfnh83/Y+hPbD4/u29yG0Hx7ft70Pof3w+L7tfQjth8f3be9DaD88vm97' +
  'H0L74fF92/sQ2g+P79ve9xpZvQ+P79veh9B+eHzf9j6E9sPj+7b3IbQfHt+3vQ+h/fD4vu19CO2H' +
  'x/dt70NoPzy+b3sfQvvh8X3b+xDaD4/v296H0H54fN/2PoT2w+P7tvchtB8e37e9D6H98Pi+7X0I' +
  '7YfH923vQ2g/PL5vex9C++Hxfdv7XiOr9+Hxfdv7ENoPj+/b3ofQfnh83/Y+hPbD4/u29yG0Hx7f' +
  't70Pof3w+L7tfQjth8f3be9DaD88vm97H0L74fF92/sQ2g+P79veh9B+eHzf9j6E9sPj+7b3vUZW' +
  '78Pj+7b3IbQfHt+3vQ+h/fD4vu19CK3NPwBdvDkzzZbZKAAAAABJRU5ErkJggg==',
  'base64'
);

const iconsDir = path.join(__dirname, '../assets/icons');

// 确保目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 生成图标文件
const icons = [
  { name: 'home.png', data: grayCirclePNG },
  { name: 'home-active.png', data: blueCirclePNG },
  { name: 'list.png', data: grayCirclePNG },
  { name: 'list-active.png', data: blueCirclePNG },
  { name: 'user.png', data: grayCirclePNG },
  { name: 'user-active.png', data: blueCirclePNG },
];

icons.forEach(icon => {
  const filePath = path.join(iconsDir, icon.name);
  fs.writeFileSync(filePath, icon.data);
  console.log(`Created: ${icon.name}`);
});

console.log('\n图标文件已生成！');
console.log('注意：这些是占位图标，建议替换为正式的设计图标。');
console.log('推荐图标资源：');
console.log('  - https://www.iconfont.cn/');
console.log('  - https://iconpark.oceanengine.com/');
