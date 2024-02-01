const dayjs = require("dayjs");
const today = dayjs().format("YYYYMMDD");

module.exports = {
  packagerConfig: {
    appVersion:`${today}`,
    icon:"./public/favicon.ico",
    name:"ApiCat",
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: "./public/favicon.ico",
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: { 
        options: {
          icon: './public/favicon.png',
        }},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              // js: "./src/modules/main/renderer.js", //測試用
              html: "./public/main.html",
              js: "./src/modules/main/main.js",
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
  ],
};
