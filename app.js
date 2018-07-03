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

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

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
