const fs = require('fs');
const path = require('path');
const { 
    sequelize, User, Category, Brand, Product, Order, OrderItem, 
    Unit, Staff, Task, Evaluation, Setting, Cart, CartItem 
} = require('../models');

async function importDatabase() {
    const backupPath = path.join(__dirname, '../../database_backup.json');
    
    if (!fs.existsSync(backupPath)) {
        console.error('❌ Không tìm thấy file sao lưu tại: ' + backupPath);
        process.exit(1);
    }

    try {
        console.log('--- Bắt đầu Khôi phục Dữ liệu (Import) ---');
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        // 1. Tắt kiểm tra khóa ngoại (Foreign Key Checks) để tránh lỗi khi xóa/chèn
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('... Đã tạm tắt Foreign Key Checks.');

        // 2. Đồng bộ các bảng (Xóa sạch dữ liệu cũ và tạo lại cấu trúc)
        // Lưu ý: force: true sẽ DROP TABLE và tạo lại. 
        // Nếu muốn giữ dữ liệu cũ thì làm kiểu khác, nhưng ở đây mục tiêu là "đồng nhất dữ liệu sang máy khác"
        await sequelize.sync({ force: true });
        console.log('✔ Cấu trúc Database đã được làm mới.');

        // 3. Thứ tự Import (Nên làm theo trình tự logic để an toàn nhất)
        const models = {
            Setting,
            User,
            Unit,
            Category,
            Brand,
            Staff,
            Product,
            Task,
            Evaluation,
            Order,
            OrderItem,
            Cart,
            CartItem
        };

        for (const [name, model] of Object.entries(models)) {
            const data = backupData.data[name];
            if (data && data.length > 0) {
                console.log(`... Đang nạp dữ liệu vào bảng: ${name} (${data.length} bản ghi)`);
                await model.bulkCreate(data);
            }
        }

        // 4. Bật lại kiểm tra khóa ngoại
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✔ Khôi phục hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi Import:', error);
        // Đảm bảo bật lại khóa ngoại kể cả khi lỗi
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        process.exit(1);
    }
}

importDatabase();
