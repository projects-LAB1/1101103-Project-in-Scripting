const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// ปิดการใช้ symbolication เพื่อเพิ่มความเร็วในการ bundle
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// ลบส่วนที่ทำให้เกิดปัญหา
// config.cacheStores = [
//   config.cacheStores[0],
//   {
//     get: () => Promise.resolve(null),
//     set: () => Promise.resolve(),
//   },
// ];

// แก้ไขการตั้งค่า timeout
config.server = {
  port: 8081,
  enhanceMiddleware: (middleware) => middleware,
};

// ลดขนาดแพ็คเกจ bundle
config.resolver.blockList = [
  /\/\.git\/.*/,
  /android\/.*/,
  /ios\/.*/,
  /\.vscode\/.*/,
  /\.github\/.*/,
];

// ตั้งค่า maxWorkers เพื่อลดการใช้ทรัพยากร
config.maxWorkers = 2;

// เพิ่มประสิทธิภาพของ transformer
config.transformer.assetPlugins = [];

module.exports = config; 