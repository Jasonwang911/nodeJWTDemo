var createError = require('http-errors');
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var config = require('./config/index');
var User = require('./schema/user');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');



var app = express();

// 连接数据库 
mongoose.connect(config.database);

// 设置superSecret全局参数
app.set('superSecret', config.jwtsecret);

// 设置body-parse中间件，以便拿到post参数和url参数 req.body/req.query
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// 使用 morgan 讲请求日志输出到控制台
app.use(morgan('dev'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 根路径处理结果
app.get('/', function(req, res) {
  res.send('JWT 授权访问的API根路径是 http://localhost:' + config.network.port + '/api');
})

// steup 路径下简单写入用户数据，
app.post('/setup', function(req, res) {
  console.log(req.body)
  if(req.body.name && req.body.password) {
    var nick = new User({
      name: req.body.name,
      password: req.body.password,
      admin: req.body.admin || false
    })

    nick.save(function(err) {
      if(err) throw err;
      console.log('用户存储成功');
      res.json({success: true});
    })
  }else {
    res.json({success: false, msg: '参数错误'});
  }
})

// 用户授权路径，返回JWT 的 Token 验证用户名密码
app.post('/authenticate', function(req, res) {
  User.findOne({
      name: req.body.name
   }, function(err, user) {
     console.log(user)
      if (err) throw err;
      if (!user) {
        res.json({ success: false, message: '未找到授权用户' });
      } else if (user) {
         if (user.password != req.body.password) {
          res.json({ success: false, message: '用户密码错误' });
        } else {
      var token = jwt.sign({name: user.name, password: user.password}, app.get('superSecret'), {
        expiresIn: 60*60*24 // 授权时效24小时
      });
      res.json({
            success: true,
            message: '请使用您的授权码',
            token: token
      });
    }   
  }
  });
});

//  localhost:端口号/api 路径路由定义
var apiRoutes = express.Router();

apiRoutes.use(function(req, res, next) {

  // 拿取token 数据 按照自己传递方式写
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  
  if (token) {  	
    // 解码 token (验证 secret 和检查有效期（exp）)
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      

      if (err) {
        return res.json({ success: false, message: '无效的token.' });    
      } else {
        // 如果验证通过，在req中写入解密结果
        req.decoded = decoded;  
        //console.log(decoded)  ;
        next(); //继续下一步路由
      }
    });
  } else {
    // 没有拿到token 返回错误 
    return res.status(403).send({ 
        success: false, 
        message: '没有找到token.' 
    });

  }
});



apiRoutes.get('/', function(req, res) {
  res.json({ message: req.decoded._doc.name+'  欢迎使用API' });
});
//获取所有用户数据
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});   
// 注册API路由
app.use('/api', apiRoutes);

app.use('/index', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
