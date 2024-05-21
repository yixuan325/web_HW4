var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sqlite3 = require('sqlite3').verbose(); // 引入sqlite3模塊

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// 打開數據庫
var db = new sqlite3.Database(path.join(__dirname, 'db', 'sqlite.db'), (err) => {
    if (err) {
        console.error('Failed to open database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

//如果 Electricity_bill table 不存在就自動新增table
db.run(`
            CREATE TABLE IF NOT EXISTS Electricity_bill (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                average_price DECIMAL(10, 4) NOT NULL
            )
        `);

// 建立函式fetch_data 建構SQL查詢獲得輸入的年份的月份跟平均單價(元/度)
function fetch_data(year) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT year, month, average_price FROM Electricity_bill WHERE year = ?`,
            [year],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}


//收到GET請求時，回傳指定年份的電費資料
app.get('/electricity_bill/:year', async (req, res) => {
    try {
        const year = req.params.year;
        const data = await fetch_data(year);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
