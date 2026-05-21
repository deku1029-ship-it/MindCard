const fs = require('fs');
const path = require('path');
const { 
    sequelize, User, Category, Brand, Product, Order, OrderItem, 
    Unit, Staff, Task, Evaluation, Setting, Cart, CartItem 
} = require('../models');

async function exportDatabase() {
    try {
        console.log('--- Bắt đầu Sao lưu Dữ liệu (Export) ---');
        
        const backupData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0.0'
            },
            data: {}
        };

        const models = {
            User: User,
            Category: Category,
            Brand: Brand,
            Product: Product,
            Order: Order,
            OrderItem: OrderItem,
            Unit: Unit,
            Staff: Staff,
            Task: Task,
            Evaluation: Evaluation,
            Setting: Setting,
            Cart: Cart,
            CartItem: CartItem
        };

        for (const [name, model] of Object.entries(models)) {
            console.log(`... Đang lấy dữ liệu từ bảng: ${name}`);
            const records = await model.findAll();
            backupData.data[name] = records;
        }

        const backupPath = path.join(__dirname, '../../database_backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');

        console.log(`✔ Sao lưu hoàn tất! File lưu tại: ${backupPath}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi Export:', error);
        process.exit(1);
    }
}

exportDatabase();
