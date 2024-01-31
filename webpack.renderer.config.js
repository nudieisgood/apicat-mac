const rules = require('./webpack.rules');
const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const MonacoEditorPlugin = require("monaco-editor-webpack-plugin");
const webpack = require("webpack");


rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
},
{
  test: /\.vue$/,
  loader: "vue-loader",
},
{
  test: /\.scss$/,
  use: [
    // 将 JS 字符串生成为 style 节点
    "style-loader",
    // 将 CSS 转化成 CommonJS 模块
    "css-loader",
    // 将 Sass 编译成 CSS
    {
      loader: "sass-loader",
      options: {
        additionalData: `
          @import "@/scss/variable.scss";
          @import "@/scss/all.scss";
        `,
      },
    },
  ],
},
{
  test: /\.(png|jpg|gif|svg|jfif)$/,
  use: [
    {
      loader: "file-loader",
      options: {
        esModule: false, // esModule主要为了处理require图片报错的问题
      },
    },
  ],
  // 解決 BackgroundImage:url() 無法讀圖片問題
  type: 'javascript/auto'
},
);

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  mode:'development',
  target: "electron-renderer",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    //引入時可省略後綴
    extensions: [".js", ".jsx", ".json", ".vue"],

    //webpack 5 移除 polyfill，需在此引入
    fallback: {
      util: false,
      url: false,
      fs: false,
      path: require.resolve("path-browserify"),
      querystring: require.resolve("querystring-es3"),
      os: require.resolve("os-browserify/browser"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
    },
  },
  plugins: [
    // vue loader 所需插件
    new VueLoaderPlugin(),
    new MonacoEditorPlugin(),
    new webpack.DefinePlugin({
      // Drop Options API from bundle
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    }),
  ],
};
