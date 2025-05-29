
const http = require('http');
const url = require('url');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 只处理POST请求
  if (req.method === 'POST') {
    // 获取URL路径
    const pathName = url.parse(req.url).pathname;
    
    // 只处理/verify路径
    if (pathName === '/verify') {
      // 接收请求数据
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        console.log('接收到的数据:', body);
        
        // 尝试解析JSON
        let userData;
        try {
          userData = JSON.parse(body);
        } catch (e) {
          console.error('JSON解析错误:', e.message);
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, message: '无效的JSON格式'}));
          return;
        }
        
        // 检查用户名和密码
        if (userData && userData.username === 'xieshuoxing' && userData.password === '410425200409186093') {
          console.log('验证成功:', userData.username);
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({
            success: true,
            message: '验证成功',
            admin: {
              username: 'xieshuoxing',
              permissions: ['admin']
            }
          }));
        } else {
          console.log('验证失败:', userData ? userData.username : 'unknown');
          res.writeHead(401, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, message: '用户名或密码错误'}));
        }
      });
    } else {
      // 不支持的路径
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({success: false, message: '路径不存在'}));
    }
  } else {
    // 不支持的HTTP方法
    res.writeHead(405, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({success: false, message: '方法不支持'}));
  }
});

// 启动服务器
const PORT = 3456;
server.listen(PORT, () => {
  console.log('简单验证服务启动在端口', PORT);
});
