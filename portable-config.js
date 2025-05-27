/**
 * 牙人应用便携版打包配置（优化版）
 * 当前版本：1.1.1
 */
module.exports = {
  appId: "com.fayufm.yaren",
  productName: "牙人",
  artifactName: "牙人便携版-${version}.${ext}",
  directories: {
    output: "portable-dist-new"
  },
  files: [
    "**/*",
    "!.git{/**/*,}",
    "!**/*.{ts,tsx,scss,md,map}",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!.editorconfig",
    "!**/._*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,__pycache__,thumbs.db,.gitignore,.gitattributes}",
    "!**/{appveyor.yml,.travis.yml,circle.yml}",
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
    "!**/dist",
    "!**/portable-dist*",
    "!build",
    "!installer.nsh"
  ],
  // 不排除node_modules，确保所有依赖都被打包
  extraFiles: [
    {
      from: "node_modules",
      to: "node_modules",
      filter: ["**/*"]
    }
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
  asar: false, // 禁用asar提高兼容性
  compression: "normal",
  removePackageScripts: true,
  // 禁用自动更新功能，便携版不需要
  publish: null
}; 