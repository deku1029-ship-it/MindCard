const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middlewares/authMiddleware');
const { User, Product, Order } = require('../models');
const { sequelize } = require('../config/database');

// 1. Thống kê Dashboard
router.get('/stats', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalProducts = await Product.count();
        const totalOrders = await Order.count();
        
        // Tính tổng doanh thu từ các đơn đã giao
        const revenue = await Order.sum('total_price', {
            where: { status: 'delivered' }
        }) || 0;

        // Lấy 5 đơn mới nhất
        const recentOrders = await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                revenue
            },
            recentOrders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi lấy thống kê' });
    }
});

// 2. Quản lý Người dùng
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách người dùng' });
    }
});

// 3. Cập nhật quyền người dùng
router.put('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

        user.role = role;
        await user.save();
        res.json({ message: 'Cập nhật quyền thành công', user });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật quyền' });
    }
});

// 4. Xóa người dùng
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

        await user.destroy();
        res.json({ message: 'Đã xóa người dùng' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa người dùng' });
    }
});

module.exports = router;
