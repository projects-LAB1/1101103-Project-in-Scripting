module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // เพิ่มการทำ constant folding เพื่อเพิ่มความเร็ว
      ['transform-remove-console', { exclude: ['error', 'warn'] }]
    ]
  };
};