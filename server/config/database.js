const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Khởi tạo một kết nối tạm thời để kiểm tra và tạo Database nếu chưa có
async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 3308,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
    });

    const dbName = process.env.DB_NAME || "aistore_core";
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`[DB Setup] Database '${dbName}' ready.`);
    await connection.end();
  } catch (error) {
    console.error("[DB Setup] Error checking/creating database:", error);
  }
}

// Khởi tạo Sequelize Instance kết nối vào Database
const sequelize = new Sequelize(
  process.env.DB_NAME || "aistore_core",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false, // Tắt log Query để đỡ rác console
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

module.exports = { sequelize, initializeDatabase };
