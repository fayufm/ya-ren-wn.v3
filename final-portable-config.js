/**
 * 牙人应用便携版打包配置（最终版）
 */
module.exports = {
  appId: "com.fayufm.yaren",
  productName: "牙人",
  artifactName: "牙人便携版-${version}.${ext}",
  directories: {
    output: "portable-dist-final"
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
  // 简化打包过程的额外配置
  asar: true,
  // 显式指定不打包进asar的文件或目录
  asarUnpack: [
    "node_modules/uuid/**/*",
    "node_modules/axios/**/*",
  ],
  compression: "normal",
  removePackageScripts: true,
  // 禁用自动更新功能，便携版不需要
  publish: null
}; 