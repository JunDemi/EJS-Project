var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var dotenv = require('dotenv');

dotenv.config({path: './.env'});
var app = express();

var public_dir = path.join(__dirname, './public');
app.use(express.static(public_dir));
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());

app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(5000, ()=> {
    console.log('포트 5000번으로 서버 접속중...')
});
