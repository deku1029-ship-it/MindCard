const fs = require("fs");
const { sequelize } = require("./config/database");

async function backupDatabase() {
  try {
    const backupData = {};

    // Lấy tất cả tên bảng trong DB
    const [tables] = await sequelize.query(`
      SHOW TABLES
    `);

    // MySQL trả về key động
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];

      // Lấy data từng bảng
      const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\``);

      backupData[tableName] = rows;
    }

    // Ghi file JSON
    fs.writeFileSync(
      "database_backup.json",
      JSON.stringify({ data: backupData }, null, 2),
      "utf8",
    );

    console.log("✅ Backup toàn bộ database thành công!");
  } catch (error) {
    console.error("❌ Lỗi backup:", error);
  } finally {
    await sequelize.close();
  }
}

backupDatabase();
