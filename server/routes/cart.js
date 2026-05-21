const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { Cart, CartItem, Product, Category, Brand } = require('../models');

// Helper: lấy hoặc tạo giỏ hàng cho user
async function getOrCreateCart(userId) {
    let cart = await Cart.findOne({ where: { user_id: userId } });
    if (!cart) {
        cart = await Cart.create({ user_id: userId });
    }
    return cart;
}

// GET /api/cart — Lấy giỏ hàng hiện tại của user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.userId);

        const items = await CartItem.findAll({
            where: { cart_id: cart.id },
            include: [{
                model: Product,
                include: [
                    { model: Category, attributes: ['id', 'name'] },
                    { model: Brand, attributes: ['id', 'name'] }
                ],
                attributes: ['id', 'name', 'price', 'original_price', 'image_url', 'stock']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ cart_id: cart.id, items });
    } catch (error) {
        console.error('[Cart GET]', error);
        res.status(500).json({ error: 'Lỗi lấy giỏ hàng' });
    }
});

// POST /api/cart/add — Thêm sản phẩm vào giỏ (nếu đã có thì tăng qty)
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        if (!product_id) return res.status(400).json({ error: 'Thiếu product_id' });

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findByPk(product_id);
        if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

        const cart = await getOrCreateCart(req.user.userId);

        // Tìm item đã có trong giỏ chưa
        let item = await CartItem.findOne({
            where: { cart_id: cart.id, product_id }
        });

        if (item) {
            item.quantity += parseInt(quantity);
            await item.save();
        } else {
            item = await CartItem.create({
                cart_id: cart.id,
                product_id,
                quantity: parseInt(quantity)
            });
        }

        // Đếm tổng items để trả về cho badge
        const totalItems = await CartItem.count({ where: { cart_id: cart.id } });

        res.json({ message: 'Đã thêm vào giỏ hàng', item, totalItems });
    } catch (error) {
        console.error('[Cart ADD]', error);
        res.status(500).json({ error: 'Lỗi thêm vào giỏ hàng' });
    }
});

// PUT /api/cart/update/:itemId — Cập nhật số lượng sản phẩm
router.put('/update/:itemId', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || quantity < 1) return res.status(400).json({ error: 'Số lượng không hợp lệ' });

        const cart = await getOrCreateCart(req.user.userId);
        const item = await CartItem.findOne({
            where: { id: req.params.itemId, cart_id: cart.id }
        });

        if (!item) return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ' });

        item.quantity = parseInt(quantity);
        await item.save();

        res.json({ message: 'Đã cập nhật số lượng', item });
    } catch (error) {
        console.error('[Cart UPDATE]', error);
        res.status(500).json({ error: 'Lỗi cập nhật giỏ hàng' });
    }
});

// DELETE /api/cart/:itemId — Xóa sản phẩm khỏi giỏ
router.delete('/:itemId', authenticateToken, async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.userId);
        const item = await CartItem.findOne({
            where: { id: req.params.itemId, cart_id: cart.id }
        });

        if (!item) return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ' });

        await item.destroy();

        const totalItems = await CartItem.count({ where: { cart_id: cart.id } });
        res.json({ message: 'Đã xóa khỏi giỏ hàng', totalItems });
    } catch (error) {
        console.error('[Cart DELETE]', error);
        res.status(500).json({ error: 'Lỗi xóa khỏi giỏ hàng' });
    }
});

// DELETE /api/cart — Xóa toàn bộ giỏ hàng
router.delete('/', authenticateToken, async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.userId);
        await CartItem.destroy({ where: { cart_id: cart.id } });
        res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
    } catch (error) {
        console.error('[Cart CLEAR]', error);
        res.status(500).json({ error: 'Lỗi xóa giỏ hàng' });
    }
});

module.exports = router;
