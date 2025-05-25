const config = {
  appId: "com.yaren.app",
  productName: "牙人便携版",
  directories: {
    output: "portable-exe-dist",
    buildResources: "."
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
    artifactName: "牙人便携版.exe",
    requestExecutionLevel: "user"
  },
  extraResources: [
    {
      "from": ".",
      "to": ".",
      "filter": [
        "*.png",
        "*.ico",
        "*.html",
        "styles/**/*",
        "app-data/**/*"
      ]
    }
  ],
  forceCodeSigning: false,
  electronDownload: {
    strictSSL: false
  },
  asar: true,
  compression: "maximum",
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
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
    "!portable-dist-*/**/*",
    "!portable-app-solution/**/*",
    "!fixed-solution/**/*",
    "!*.zip",
    "!*.bat",
    "!cleanup*.bat"
  ]
};

module.exports = config; 