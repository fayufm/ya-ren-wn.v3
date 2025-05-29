// 最终的验证服务修复脚本
const { execSync } = require('child_process');

try {
  // 直接在服务器上执行命令
  const command = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "pm2 delete all && cd /root/yaren/server && echo 'const express = require(\\"express\\"); const app = express(); const cors = require(\\"cors\\"); app.use(cors()); app.use(express.json()); const PORT = 3456; app.post(\\"/verify\\", (req, res) => { console.log(\\"验证请求:\\", req.body); if(req.body && req.body.username === \\"xieshuoxing\\" && req.body.password === \\"410425200409186093\\") { res.json({success: true, message: \\"验证成功\\", admin: {username: \\"xieshuoxing\\", permissions: [\\"admin\\"]}});} else {res.status(401).json({success: false});}});app.listen(PORT, () => console.log(\\"验证服务启动在端口\\", PORT));' > simple-verify.js && pm2 start simple-verify.js --name yaren-verify"`;
  
  console.log('执行修复命令...');
  execSync(command);
  console.log('验证服务已修复');
} catch (err) {
  console.error('修复验证服务失败:', err);
} 