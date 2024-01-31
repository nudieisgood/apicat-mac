const path = require("path");

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
}
