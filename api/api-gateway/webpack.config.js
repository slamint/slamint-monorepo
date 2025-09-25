const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, resolve } = require('node:path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const swaggerUiDistPath = require('swagger-ui-dist').getAbsoluteFSPath();
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  // Use resolve() for the output path to ensure consistency
  output: {
    path: resolve(__dirname, 'dist/apps/api-gateway'),
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs', '.cjs'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: join(__dirname, '../../tsconfig.base.json'),
      }),
    ],
    conditionNames: ['@slamint/source', 'import', 'require', 'default'],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: swaggerUiDistPath,
          to: 'swagger-ui',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};
