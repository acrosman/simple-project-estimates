const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    entry: './src/index.js',
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    devServer: {
      static: './dist',
    },
    output: {
      filename: isProduction ? '[name].[contenthash].js' : 'main.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Project Simulator',
        template: './src/index.html',
      }),
    ],
    optimization: {
      minimize: isProduction,
      usedExports: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.csv$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/[hash][ext][query]',
          },
        },
      ],
    },
  };
};
