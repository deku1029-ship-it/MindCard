const { Product, Category, Brand, User } = require('../models');
const { Sequelize, Op } = require('sequelize');

// Helper: Lấy tất cả ID của danh mục/thương hiệu con (Đệ quy)
const getDescendantIds = async (Model, parentId) => {
    const pId = parseInt(parentId);
    if (!pId || isNaN(pId)) return [];
    
    let ids = [pId];
    const children = await Model.findAll({ 
        where: { parent_id: pId }, 
        attributes: ['id'],
        raw: true 
    });
    
    for (const child of children) {
        const childIds = await getDescendantIds(Model, child.id);
        ids = ids.concat(childIds);
    }
    return ids;
};

// Lấy danh sách sản phẩm (Hỗ trợ phân trang, Search, Filter & Sort)
exports.getProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        
        const { q, category_id, brand_id, min_price, max_price, sort, on_sale } = req.query;

        const queryOptions = {
            limit,
            offset,
            include: [
                { model: Category, attributes: ['id', 'name'] },
                { model: Brand, attributes: ['id', 'name'] }
            ],
            where: {},
            subQuery: false
        };

        // 1. Keyword Search
        if (q && q.trim() !== '') {
            queryOptions.where.name = { [Op.substring]: q }; 
        }

        // 2. Hierarchical Filters
        if (category_id && category_id !== 'null' && category_id !== '' && category_id !== 'undefined') {
            const catIds = await getDescendantIds(Category, category_id);
            console.log(`[Filter] Category ID: ${category_id} -> Descendants: ${catIds}`);
            if (catIds.length > 0) {
                queryOptions.where.category_id = { [Op.in]: catIds };
            }
        }
        
        if (brand_id && brand_id !== 'null' && brand_id !== '' && brand_id !== 'undefined') {
            const brandIds = await getDescendantIds(Brand, brand_id);
            console.log(`[Filter] Brand ID: ${brand_id} -> Descendants: ${brandIds}`);
            if (brandIds.length > 0) {
                queryOptions.where.brand_id = { [Op.in]: brandIds };
            }
        }

        // 3. Price Range Filter
        const minP = parseFloat(min_price);
        const maxP = parseFloat(max_price);
        if (!isNaN(minP) || !isNaN(maxP)) {
            queryOptions.where.price = {};
            if (!isNaN(minP)) queryOptions.where.price[Op.gte] = minP;
            if (!isNaN(maxP)) queryOptions.where.price[Op.lte] = maxP;
        }

        // 4. Flash Sale Filter (on_sale=true)
        if (on_sale === 'true') {
            queryOptions.where.original_price = { [Op.gt]: Sequelize.col('Product.price') };
        }

        // 4. Sorting
        queryOptions.order = [['createdAt', 'DESC']]; // Mặc định mới nhất
        if (sort) {
            switch(sort) {
                case 'price_asc': queryOptions.order = [['price', 'ASC']]; break;
                case 'price_desc': queryOptions.order = [['price', 'DESC']]; break;
                case 'rating': queryOptions.order = [['rating', 'DESC']]; break;
                case 'sales': queryOptions.order = [['sales_count', 'DESC']]; break;
            }
        }

        // Thực hiện truy vấn với Logging để Debug
        console.log('[Query] Executing findAndCountAll with options:', JSON.stringify(queryOptions.where));
        
        const { count, rows } = await Product.findAndCountAll(queryOptions);

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            products: rows
        });
    } catch (error) {
        console.error('[GetProducts Error]', error);
        res.status(500).json({ error: 'Lỗi khi tải danh sách sản phẩm' });
    }
};

// Xem chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Category, attributes: ['id', 'name'] },
                { model: Brand, attributes: ['id', 'name'] }
            ]
        });
        
        if (!product) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi truy xuất sản phẩm' });
    }
};

// Khuyến nghị sản phẩm dựa trên AI Score & Hành vi người dùng (Giai đoạn 4+)
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        console.log('[Personalization] getRecommendations called. userId:', userId);
        
        let preferredCategoryIds = [];
        let preferredBrandIds = [];
        let scoreLiteral = '(rating * 10 + (sales_count * 0.1) + (RAND() * 5))';
        let limit = parseInt(req.query.limit) || 12; // Mặc định 12 items để điền đầy 2 hàng (lưới 6 cột)

        // 1. Lấy sở thích nếu người dùng đã đăng nhập
        if (userId) {
            const user = await User.findByPk(userId, { attributes: ['ai_memory'] });
            let memory = user && user.ai_memory ? user.ai_memory : {};
            if (typeof memory === 'string') {
                try { memory = JSON.parse(memory); } catch(e) { memory = {}; }
            }

            if (memory && memory.view_history && Array.isArray(memory.view_history) && memory.view_history.length > 0) {
                const history = memory.view_history;
                
                // Lấy Category và Brand gần nhất (Last Interaction)
                const lastCategoryId = history[0].category_id;
                const lastBrandId = history[0].brand_id;

                // Lấy ra các category_id và brand_id được quan tâm nhất
                const catCounts = {};
                const brandCounts = {};
                
                history.forEach(h => {
                    const weight = h.action === 'add_to_cart' ? 3 : 1;
                    if (h.category_id) catCounts[h.category_id] = (catCounts[h.category_id] || 0) + weight;
                    if (h.brand_id) brandCounts[h.brand_id] = (brandCounts[h.brand_id] || 0) + weight;
                });
                
                preferredCategoryIds = Object.keys(catCounts)
                    .sort((a, b) => catCounts[b] - catCounts[a])
                    .slice(0, 3)
                    .map(Number);
                    
                preferredBrandIds = Object.keys(brandCounts)
                    .sort((a, b) => brandCounts[b] - brandCounts[a])
                    .slice(0, 3)
                    .map(Number);
                
                console.log(`[Personalization] User ${userId} | Last Cat: ${lastCategoryId} | Pref Cats:`, preferredCategoryIds, `| Pref Brands:`, preferredBrandIds);

                // 2. Xây dựng câu truy vấn chấm điểm (Scoring)
                // - Category: GẦN NHẤT (+5000), Đã xem (+1000)
                // - Brand: GẦN NHẤT (+3000), Đã xem (+500)
                const lastCatPart = lastCategoryId ? `(CASE WHEN category_id = ${lastCategoryId} THEN 5000 ELSE 0 END)` : '0';
                const prefCatsPart = preferredCategoryIds.length > 0 ? `(CASE WHEN category_id IN (${preferredCategoryIds.join(',')}) THEN 1000 ELSE 0 END)` : '0';
                
                const lastBrandPart = lastBrandId ? `(CASE WHEN brand_id = ${lastBrandId} THEN 3000 ELSE 0 END)` : '0';
                const prefBrandsPart = preferredBrandIds.length > 0 ? `(CASE WHEN brand_id IN (${preferredBrandIds.join(',')}) THEN 500 ELSE 0 END)` : '0';

                scoreLiteral = `(
                    ${lastCatPart} + 
                    ${prefCatsPart} + 
                    ${lastBrandPart} + 
                    ${prefBrandsPart} + 
                    (rating * 10) + 
                    (sales_count * 0.1) +
                    (RAND() * 5)
                )`;
            }
        }

        const products = await Product.findAll({
            order: [
                [Sequelize.literal(scoreLiteral), 'DESC'],
                ['sales_count', 'DESC'],
                ['rating', 'DESC']
            ],
            include: [
                { model: Category, attributes: ['id', 'name'] },
                { model: Brand, attributes: ['id', 'name'] }
            ],
            limit: limit
        });

        res.json({ products });
    } catch (error) {
        console.error('[Recommendation Error]', error);
        res.status(500).json({ error: 'Lỗi hệ thống Gợi ý.' });
    }
};

// Theo dõi hành vi (xem/thêm vào giỏ)
exports.trackProductView = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        const productId = req.params.id;
        const { actionType } = req.body; // 'view' hoặc 'add_to_cart'
        
        console.log(`[Personalization] trackBehavior: User ${userId} | Product ${productId} | Action: ${actionType || 'view'}`);

        if (!userId) return res.status(401).json({ error: 'Auth required' });

        const product = await Product.findByPk(productId, { attributes: ['id', 'category_id', 'brand_id'] });
        if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });

        // Cập nhật ai_memory
        let memory = user.ai_memory || {};
        
        // Đảm bảo memory là object, không phải array hay string
        if (typeof memory === 'string') {
            try { memory = JSON.parse(memory); } catch(e) { memory = {}; }
        } else if (Array.isArray(memory)) {
            memory = {}; 
        }
        
        if (!memory.view_history) memory.view_history = [];

        // Thêm vào lịch sử (tối đa 20 entry gần nhất)
        memory.view_history.unshift({
            product_id: product.id,
            category_id: product.category_id,
            brand_id: product.brand_id,
            action: actionType || 'view',
            timestamp: new Date().toISOString()
        });
        memory.view_history = memory.view_history.slice(0, 20);

        user.ai_memory = memory;
        user.changed('ai_memory', true); // Thông báo cho Sequelize là JSON đã thay đổi
        await user.save();

        res.json({ success: true });
    } catch (error) {
        console.error('[Track View Error]', error);
        res.status(500).json({ error: 'Lỗi tracking.' });
    }
};

// Sản phẩm bán chạy (Mới)
exports.getBestSellers = async (req, res) => {
    try {
        const products = await Product.findAll({
            order: [['sales_count', 'DESC']],
            include: [
                { model: Category, attributes: ['id', 'name'] },
                { model: Brand, attributes: ['id', 'name'] }
            ],
            limit: 8
        });
        res.json({ products });
    } catch (error) {
        console.error('[BestSellers Error]', error);
        res.status(500).json({ error: 'Lỗi tải sản phẩm bán chạy.' });
    }
};

// Gợi ý sản phẩm liên quan (Dựa trên Phân tầng Danh mục & Thương hiệu)
exports.getRelatedProducts = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findByPk(productId);
        if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

        // Tập hợp các sản phẩm liên quan
        let relatedProducts = [];
        const excludedIds = [product.id];

        // 1. Tầng 1: Ưu tiên cùng danh mục HOẶC cùng thương hiệu
        const priority1 = await Product.findAll({
            where: {
                id: { [Op.ne]: product.id },
                [Op.or]: [
                    { category_id: product.category_id || 0 },
                    { brand_id: product.brand_id || 0 }
                ]
            },
            include: [{ model: Category, attributes: ['id', 'name'] }, { model: Brand, attributes: ['id', 'name'] }],
            limit: 5,
            order: [[Sequelize.literal('RAND()')]]
        });
        
        relatedProducts = [...priority1];
        priority1.forEach(p => excludedIds.push(p.id));

        // 2. Tầng 2: Nếu chưa đủ 4 sản phẩm, tìm các sản phẩm "anh em" (cùng cha của category)
        if (relatedProducts.length < 4 && product.category_id) {
            const currentCat = await Category.findByPk(product.category_id);
            if (currentCat && currentCat.parent_id) {
                const siblingCatIds = await getDescendantIds(Category, currentCat.parent_id);
                const priority2 = await Product.findAll({
                    where: {
                        id: { [Op.notIn]: excludedIds },
                        category_id: { [Op.in]: siblingCatIds }
                    },
                    include: [{ model: Category, attributes: ['id', 'name'] }, { model: Brand, attributes: ['id', 'name'] }],
                    limit: 5 - relatedProducts.length,
                    order: [[Sequelize.literal('RAND()')]]
                });
                relatedProducts = [...relatedProducts, ...priority2];
                priority2.forEach(p => excludedIds.push(p.id));
            }
        }

        // 3. Tầng 3: Nếu vẫn chưa đủ, lấy các sản phẩm top seller toàn trang làm fallback
        if (relatedProducts.length < 4) {
             const fallback = await Product.findAll({
                where: { id: { [Op.notIn]: excludedIds } },
                include: [{ model: Category, attributes: ['id', 'name'] }, { model: Brand, attributes: ['id', 'name'] }],
                limit: 5 - relatedProducts.length,
                order: [['sales_count', 'DESC'], ['rating', 'DESC']]
            });
            relatedProducts = [...relatedProducts, ...fallback];
        }

        res.json({ products: relatedProducts.slice(0, 5) });
    } catch (error) {
        console.error('[RelatedProducts Error]', error);
        res.status(500).json({ error: 'Lỗi lấy sản phẩm liên quan' });
    }
};

// Admin: Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, original_price, category, category_id, brand_id, image_url, stock, warranty, condition, origin } = req.body;
        
        const newProduct = await Product.create({
            name, description, price, original_price, category, category_id, brand_id, image_url, stock, warranty, condition, origin
        });

        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi tạo sản phẩm' });
    }
};

// Admin: Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, original_price, category, category_id, brand_id, image_url, stock, warranty, condition, origin } = req.body;
        const product = await Product.findByPk(req.params.id);
        
        if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

        await product.update({ name, description, price, original_price, category, category_id, brand_id, image_url, stock, warranty, condition, origin });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật sản phẩm' });
    }
};

// Admin: Xoá sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

        await product.destroy();
        res.json({ message: 'Đã xoá sản phẩm thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xoá sản phẩm' });
    }
};
