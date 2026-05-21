const express = require('express');
const router = express.Router();
const { Brand, Product } = require('../models');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middlewares/authMiddleware');

// 1. Lấy tất cả nhãn hàng (Hỗ trợ tree=true đệ quy)
router.get('/', async (req, res) => {
    try {
        const { tree } = req.query;
        let allBrands = await Brand.findAll({ order: [['name', 'ASC']] });

        if (tree === 'true') {
            // Chuyển danh sách phẳng thành cấu trúc cây đệ quy
            const brandMap = {};
            const roots = [];

            allBrands.forEach(brand => {
                brandMap[brand.id] = { ...brand.toJSON(), children: [] };
            });

            allBrands.forEach(brand => {
                if (brand.parent_id && brandMap[brand.parent_id]) {
                    brandMap[brand.parent_id].children.push(brandMap[brand.id]);
                } else {
                    roots.push(brandMap[brand.id]);
                }
            });

            return res.json(roots);
        }

        res.json(allBrands);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy nhãn hàng' });
    }
});

// 2. Tạo nhãn hàng mới
router.post('/', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const { name, logo_url, description } = req.body;
        const brand = await Brand.create({ name, logo_url, description });
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo nhãn hàng' });
    }
});

// 3. Cập nhật nhãn hàng
router.put('/:id', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const { name, logo_url, description } = req.body;
        const brand = await Brand.findByPk(req.params.id);
        if (!brand) return res.status(404).json({ error: 'Không tìm thấy' });

        brand.name = name;
        brand.logo_url = logo_url;
        brand.description = description;
        await brand.save();
        res.json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật' });
    }
});

// 4. Xóa nhãn hàng
router.delete('/:id', authenticateToken, isAdminOrStaff, async (req, res) => {
    try {
        const brand = await Brand.findByPk(req.params.id, {
            include: [{ model: Product }]
        });

        if (!brand) return res.status(404).json({ error: 'Không tìm thấy' });

        if (brand.Products.length > 0) {
            return res.status(400).json({ error: 'Không thể xóa nhãn hàng đang có sản phẩm đính kèm.' });
        }

        await brand.destroy();
        res.json({ message: 'Đã xóa nhãn hàng' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa nhãn hàng' });
    }
});

module.exports = router;
