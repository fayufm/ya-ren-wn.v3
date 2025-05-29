const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const adminRouter = require('./admin-api');
const webhookHandler = require('./webhook-handler');
const { router: commentMentionRouter, processMessageMentions } = require('./comment-mention-api');

// 中间件配置
app.use(cors());

// 配置body-parser，确保JSON正确解析
app.use(bodyParser.json({
    limit: '50mb',
    strict: false
}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// 路由配置
app.use('/api', commentMentionRouter);

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = \
0.0.0.0\;
app.listen(PORT, HOST, () => {
  console.log(服务器已启动，监听 System.Management.Automation.Internal.Host.InternalHost:);
});
