module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@store': './src/store',
          '@types': './src/types',
          '@utils': './src/utils',
          '@theme': './src/theme',
          '@services': './src/services',
        },
      },
    ],
  ],
}; 