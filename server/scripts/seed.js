const { sequelize, User, Category, Brand, Product, Unit, Staff, Task, Evaluation } = require('../models');

async function seed() {
    try {
        console.log('--- Bắt đầu Seeding Dữ liệu ---');
        
        // Đồng bộ database
        await sequelize.sync({ alter: true });
        console.log('✔ Thuộc tính Database đã được đồng bộ.');

        // Xóa dữ liệu cũ để tránh lỗi Unique Constraint khi chạy lại
        console.log('... Đang làm sạch dữ liệu cũ ...');
        await Evaluation.destroy({ where: {}, truncate: false }); // Truncate might fail due to FKs, destroy is safer if truncate isn't forced
        await Task.destroy({ where: {}, truncate: false });
        await Staff.destroy({ where: {}, truncate: false });
        await Unit.destroy({ where: {}, truncate: false });

        // 1. Tạo Đơn vị (Units)
        const units = await Unit.bulkCreate([
            { name: 'Ban Giám Đốc', code: 'BGĐ' },
            { name: 'Phòng Kinh Doanh', code: 'PKD' },
            { name: 'Phòng Kỹ Thuật', code: 'PKT' },
            { name: 'Tổ Marketing', code: 'TMKT' }
        ]);
        console.log('✔ Đã tạo 4 Đơn vị mẫu.');

        // 2. Tạo Nhân sự (Staff)
        const staffList = await Staff.bulkCreate([
            { full_name: 'Nguyễn Văn A', email: 'vana@aistore.com', position: 'Giám đốc', unit_id: units[0].id },
            { full_name: 'Trần Thị B', email: 'thib@aistore.com', position: 'Trưởng phòng KD', unit_id: units[1].id },
            { full_name: 'Lê Văn C', email: 'vanc@aistore.com', position: 'Kỹ thuật viên', unit_id: units[2].id },
            { full_name: 'Phạm Minh D', email: 'minhd@aistore.com', position: 'Nhân viên Marketing', unit_id: units[3].id }
        ]);
        console.log('✔ Đã tạo 4 Nhân sự mẫu.');

        // 3. Tạo Công việc (Tasks)
        await Task.bulkCreate([
            { title: 'Duyệt kế hoạch quý 2', staff_id: staffList[0].id, status: 'ongoing', deadline: '2026-06-30' },
            { title: 'Tiếp cận 5 khách hàng mới', staff_id: staffList[1].id, status: 'pending', deadline: '2026-05-15' },
            { title: 'Fix bug trang Admin', staff_id: staffList[2].id, status: 'completed', deadline: '2026-04-10' },
            { title: 'Chạy campain Facebook', staff_id: staffList[3].id, status: 'ongoing', deadline: '2026-04-20' }
        ]);
        console.log('✔ Đã tạo 4 Công việc mẫu.');

        // 4. Tạo Đánh giá (Evaluations)
        await Evaluation.bulkCreate([
            { staff_id: staffList[0].id, score: 9, comment: 'Lãnh đạo xuất sắc.' },
            { staff_id: staffList[2].id, score: 10, comment: 'Hoàn thành công việc rất nhanh.' }
        ]);
        console.log('✔ Đã tạo 2 Đánh giá mẫu.');

        console.log('--- Seeding Hoàn tất! ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi Seeding:', error);
        process.exit(1);
    }
}

seed();
