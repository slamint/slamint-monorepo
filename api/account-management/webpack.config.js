const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const { join } = require('node:path');

module.exports = {
  devtool: 'source-map',
  module: {
    rules: [
      // keep your other rules...
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        // ⛔ don't parse sourcemaps from @redis/* (they reference .ts files not shipped)
        exclude: [/node_modules\/@redis\/client/, /node_modules\/@redis\//],
      },
    ],
  },
  ignoreWarnings: [
    (warning) =>
      warning.module &&
      /node_modules\/@redis\/client/.test(warning.module.resource || '') &&
      /Failed to parse source map/.test(warning.message || ''),
  ],
  output: {
    path: join(__dirname, 'dist'),
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
  ],
};
