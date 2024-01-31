const path = require("path");
const MonacoEditorPlugin = require("monaco-editor-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  target: "electron-main",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
     //引入時可省略後綴
    extensions: [".js", ".jsx", ".json"], 
  },
  plugins: [
    new Dotenv({
      path: `./.env.${
        process.env.ENV_MODE === 'develop' ? "develop" 
          : process.env.ENV_MODE === 'prod' ? 'prod' 
            : process.env.ENV_MODE === 'runtime' ? 'runtime'
              : 'citest'
      }`,
      //允許加載所有系統變量，包含 cross-env 設置的變量，默認為 false
      systemvars: true
    }),
    new MonacoEditorPlugin(),
       ////用webpack插件將圖片複製到 .webpack/main 裡，並利用 dirname 變數來取得圖片路徑
    new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, 'src/assets/img/favicon.png'), to: path.resolve(__dirname, '.webpack/main/assets') },
        ],
      })
  ],
}
