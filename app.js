const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const port = process.env.PORT;

dotenv.config({path: './.env'});
const app = express();

const public_dir = path.join(__dirname, './public');
app.use(express.static(public_dir));
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());

app.use('/', require('./routes/pages')); //routes/pages에서 ejs페이지 설정
app.use('/auth', require('./routes/auth'));

app.listen(5000, ()=> {
    console.log('서버 접속중...')
});
