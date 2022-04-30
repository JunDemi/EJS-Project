var mysql = require('mysql');

var db = mysql.createConnection({
    host: 'jungwook.cbi9irfvzpac.ap-northeast-2.rds.amazonaws.com',
    user: 'admin',
    password: 'qkrwjddnr123',
    database: 'jungwook',
    port: '3306',
    dateStrings: "date",
});

db.connect(err =>{
    if(err) throw err;
    console.log('MySQL 접속중...');
});

module.exports = db;