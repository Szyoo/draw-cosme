// electron-builder.config.js
module.exports = {
    // 应用的主入口文件 (打包后Electron会从这里启动)
    // 通常在 package.json 中 "main": "dist/main/main.js"
    // 这里也可以指定
    directories: {
      output: "release", // 打包产物输出目录
      buildResources: "build" // 资源文件夹（图标，installer背景等）
    },
  
    files: [
      // 要包含哪些文件到打包结果
      "dist/main/**/*",
      {
        "from": "dist/renderer",
        "to": "dist/renderer",
        "filter": ["**/*"]
      },
      // 如果有额外静态资源可以在这里声明
    ],
  
    // 应用ID，建议用反向域名风格
    appId: "com.drawcosme.app",
  
    productName: "Draw Cosme", // 生成的可执行程序名称
  
    // 平台/发布相关配置
    win: {
      icon: "build/icons/icon.ico", // Windows下应用图标
      artifactName: "${productName}-Setup-${version}.${ext}"
    },
    mac: {
      icon: "build/icons/icon.icns"
    },
    linux: {
      icon: "build/icons",
      category: "Utility"
    },
  
    // 可根据需求添加publish配置，如自动发布到某处
    // publish: [{
    //   provider: "generic",
    //   url: "https://your-download-server.com/"
    // }]
  };
  