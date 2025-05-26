/**
 * 牙人应用便携版打包配置（内联UUID版）
 */
module.exports = {
  appId: "com.fayufm.yaren",
  productName: "牙人",
  artifactName: "牙人便携版-内联UUID-${version}.${ext}",
  directories: {
    output: "portable-dist-inline"
  },
  files: [
    "**/*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,__pycache__,thumbs.db,.gitignore,.gitattributes}",
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
    "!**/dist",
    "!**/portable-dist*",
    "!build",
    "!installer.nsh"
  ],
  // 确保为便携式应用程序
  portable: {
    splashImage: "./yaren-1.png"
  },
  // Windows特定配置
  win: {
    target: ["portable"],
    icon: "./yaren.ico",
    requestedExecutionLevel: "asInvoker"
  },
  // 确保应用保持便携性
  extraResources: [
    {
      from: "./app-data",
      to: "app-data",
      filter: ["**/*"]
    }
  ],
  // 确保uuid-inline.js被打包
  extraFiles: [
    {
      from: "uuid-inline.js",
      to: "uuid-inline.js"
    },
    {
      // 创建初始数据目录结构
      from: "data-template",
      to: "data",
      filter: ["**/*"]
    }
  ],
  // 简化打包过程的额外配置
  asar: true,
  compression: "normal",
  removePackageScripts: true,
  // 禁用自动更新功能，便携版不需要
  publish: null
}; 