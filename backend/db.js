const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Masukkan password MySQL
  database: "rawat_jalan",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL Database!");
});

module.exports = db;
