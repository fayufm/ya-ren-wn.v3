const config = {
  appId: "com.yaren.app",
  productName: "牙人便携版",
  directories: {
    output: "portable-dist-final"
  },
  icon: "yaren.ico",
  win: {
    target: [
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    icon: "yaren.ico"
  },
  portable: {
    artifactName: "牙人便携版-${version}.exe"
  },
  forceCodeSigning: false,
  electronDownload: {
    strictSSL: false
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  },
  asar: true,
  files: [
    "**/*",
    "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!.editorconfig",
    "!**/._*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
    "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
    "!**/{appveyor.yml,.travis.yml,circle.yml}",
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
  ]
};

module.exports = config; 