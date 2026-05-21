const express = require('express');
const router = express.Router();
const { Category, Product } = require('../models');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middlewares/authMiddleware');

// 1. Lấy tất cả danh mục (Dạng phẳng hoặc cấu trúc Cây đệ quy)
router.get('/', async (req, res) => {
    try {
        const { tree } = req.query;
        let allCategories = await Category.findAll({ order: [['name', 'ASC']] });

        if (tree === 'true') {
            // Chuyển danh sách phẳng thành cấu trúc cây đệ quy
            const categoryMap = {};
            const roots = [];

            allCategories.forEach(cat => {
                categoryMap[cat.id] = { ...cat.toJSON(), children: [] };
            });

            allCategories.forEach(cat => {
                if (cat.parent_id && categoryMap[cat.parent_id]) {
                    categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
                } else {
                    roots.push(categoryMap[cat.id]);
                }
            });

            return res.json(roots);
        }

        res.json(allCategories);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh mục' });
    }
});

// 2. Tạo danh mục mới
router.post('/', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const { name, parent_id, icon, show_on_home } = req.body;
        const category = await Category.create({ name, parent_id, icon, show_on_home });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo danh mục' });
    }
});

// 3. Cập nhật danh mục
router.put('/:id', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const { name, parent_id, icon, show_on_home } = req.body;
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ error: 'Không tìm thấy' });

        if (name !== undefined) category.name = name;
        if (parent_id !== undefined) category.parent_id = parent_id || null;
        if (icon !== undefined) category.icon = icon;
        if (show_on_home !== undefined) category.show_on_home = show_on_home;
        
        await category.save();
        res.json(category);
    } catch (error) {
        console.error("PUT /categories/:id error:", error);
        res.status(500).json({ error: 'Lỗi cập nhật' });
    }
});

// 4. Xóa danh mục (Theo thông lệ: Kiểm tra ràng buộc)
router.delete('/:id', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            include: [
                { model: Category, as: 'children' },
                { model: Product }
            ]
        });

        if (!category) return res.status(404).json({ error: 'Không tìm thấy' });

        if (category.children.length > 0) {
            return res.status(400).json({ error: 'Không thể xóa danh mục có danh mục con. Hãy xóa con trước.' });
        }

        if (category.Products.length > 0) {
            return res.status(400).json({ error: 'Không thể xóa danh mục đang có sản phẩm bên trong.' });
        }

        await category.destroy();
        res.json({ message: 'Đã xóa danh mục' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa danh mục' });
    }
});

module.exports = router;
