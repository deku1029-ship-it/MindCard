const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, sequelize } = require('../models');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middlewares/authMiddleware');

// Khách hàng tạo đơn hàng
router.post('/', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { customer_name, customer_phone, shipping_address, items } = req.body;
        
        if (!items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Giỏ hàng trống!' });
        }

        let userId = null;
        if (req.headers['authorization']) {
            const jwt = require('jsonwebtoken');
            const token = req.headers['authorization'].split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                userId = decoded.userId;
            } catch (e) {}
        }

        let total_price = 0;
        const validItems = [];

        // Kiểm tra SP, tồn kho và tính tổng tiền
        for (let item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t });
            
            if (!product) {
                await t.rollback();
                return res.status(400).json({ error: `Sản phẩm ID ${item.product_id} không tồn tại` });
            }

            if (product.stock < item.quantity) {
                await t.rollback();
                return res.status(400).json({ 
                    error: `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho.` 
                });
            }

            total_price += product.price * item.quantity;
            validItems.push({
                product, // Lưu instance để update sau
                quantity: item.quantity,
                price: product.price
            });
        }

        // Tạo Order
        const newOrder = await Order.create({
            user_id: userId,
            customer_name,
            customer_phone,
            shipping_address,
            total_price
        }, { transaction: t });

        // Tạo OrderItem và cập nhật tồn kho
        for (let item of validItems) {
            // Tạo chi tiết đơn hàng
            await OrderItem.create({
                order_id: newOrder.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.price
            }, { transaction: t });

            // Trừ tồn kho và tăng lượt bán
            await item.product.decrement('stock', { by: item.quantity, transaction: t });
            await item.product.increment('sales_count', { by: item.quantity, transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: 'Đặt hàng thành công!', orderId: newOrder.id });
    } catch (error) {
        if (t) await t.rollback();
        console.error('Lỗi khi tạo đơn:', error);
        res.status(500).json({ error: 'Đã có lỗi xảy ra khi tạo đơn hàng' });
    }
});

// Khách hàng xem đơn hàng của MÌNH
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.userId },
            include: [{
                model: OrderItem,
                include: [{
                    model: Product,
                    attributes: ['id', 'name', 'image_url', 'price']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('[My Orders]', error);
        res.status(500).json({ error: 'Lỗi khi lấy đơn hàng của bạn' });
    }
});

// Khách hàng hủy đơn của MÌNH
router.put('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.userId
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng của bạn' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Bạn chỉ có thể hủy đơn hàng khi trạng thái là đang chờ duyệt' });
        }

        order.status = 'cancelled';
        await order.save();
        res.json({ message: 'Hủy đơn hàng thành công', order });
    } catch (error) {
        console.error('[Cancel Order]', error);
        res.status(500).json({ error: 'Lỗi khi hủy đơn hàng' });
    }
});

// Lấy chi tiết 1 đơn hàng của MÌNH
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.userId
            },
            include: [{
                model: OrderItem,
                include: [{
                    model: Product,
                    attributes: ['id', 'name', 'image_url', 'price']
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy chi tiết đơn hàng' });
    }
});

// Admin lấy danh sách đơn hàng
router.get('/', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{ model: OrderItem, include: [Product] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn' });
    }
});

// Admin duyệt/đổi trạng thái đơn
router.put('/:id/status', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }
        order.status = status;
        await order.save();
        res.json({ message: 'Cập nhật trạng thái thành công', order });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi duyệt đơn' });
    }
});

module.exports = router;
