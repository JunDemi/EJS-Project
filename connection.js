var mysql = require('mysql');

var db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    database: 'jungwook',
    port: '3306',
    dateStrings: "date",
});

db.connect(err =>{
    if(err) throw err;
    console.log('MySQL 접속중...');
});

module.exports = db;