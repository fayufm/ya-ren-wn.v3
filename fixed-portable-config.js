/**
 * 牙人应用便携版打包配置
 */

module.exports = {
  appId: "com.fayufm.yaren",
  productName: "牙人",
  artifactName: "牙人便携版-${version}.${ext}",
  directories: {
    output: "portable-dist-fixed"
  },
  files: [
    "**/*",
    "!**/*.{ts,tsx,scss,md,map}",
    "!**/node_modules/*/{CHANGELOG.md,README.md,LICENSE,*.test.js}",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!.editorconfig",
    "!**/._*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,__pycache__,thumbs.db,.gitignore,.gitattributes}",
    "!**/{appveyor.yml,.travis.yml,circle.yml}",
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
    "node_modules/uuid/**/*",
    "node_modules/axios/**/*",
    "!**/node_modules",
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
    // 确保应用是便携式的，数据保存在应用文件夹内
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
  compression: "maximum",
  removePackageScripts: true,
  // 禁用自动更新功能，便携版不需要
  publish: null
}; 