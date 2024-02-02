const dayjs = require("dayjs");
const today = dayjs().format("YYYYMMDD");

module.exports = {
  packagerConfig: {
    //安裝後應用入口文件的圖標,不用後綴會自動根據打包的作業系統加上對應的圖片後綴
    icon: "./public/favicon",
    //安裝後應用入口的檔名
    name: "ApiCat",
    executableName: "ApiCat",
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: `ApiCat_${today}`,
        //安裝exe檔檔名
        setupExe: `ApiCat_${today}.exe`,
        setupIcon: "./public/favicon.ico",
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        //安裝dmg檔檔名
        name: `ApiCat_${today}.dmg`,
        icon: "./public/favicon.icns",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "./public/favicon.png",
          name: `ApiCat_${today}`,
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          icon: "./public/favicon.png",
          name: `ApiCat_${today}`,
        },
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              // js: "./src/modules/main/renderer.js", //測試用
              html: "./public/main.html",
              js: "./src/modules/main/main.js",
              name: "main_window",
              preload: {
                js: "./src/preload.js",
              },
            },
          ],
        },
      },
    },
  ],
};
