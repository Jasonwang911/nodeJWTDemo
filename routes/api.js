var express = require('express');
var apiRoutes = express.Router()

apiRoutes.use(function(req, res, next) {
    // 拿去token 数据
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(token) {
        // 解码 token ( 验证secret和检查有效期（exp）)
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if(err) {
                return res.json({success: false, message: '无效的token'});
            }else {
                // 如果验证通过，在req中写入解密结果
                req.decoded = decoded;
                next(); // 继续下一步路由
            }
        })
    }else {
        // 没有拿到token返回错误
        return res.status(401).send({
            success: false,
            message: '没有找到token'
        })
    }
})


module.exports = apiRoutes;