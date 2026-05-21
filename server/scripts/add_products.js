const { Product, Category, Brand } = require('../models');
const { sequelize } = require('../config/database');

async function addProducts() {
    try {
        console.log('[Script] Connecting to database...');
        await sequelize.authenticate();

        const currentCount = await Product.count();
        const targetCount = 200;
        const toAdd = targetCount - currentCount;

        if (toAdd <= 0) {
            console.log(`[Script] Current product count is ${currentCount}. No need to add more.`);
            return;
        }

        console.log(`[Script] Current count: ${currentCount}. Adding ${toAdd} products to reach ${targetCount}...`);

        // Get all categories and brands to use for templates
        const categories = await Category.findAll();
        const brands = await Brand.findAll();

        if (categories.length === 0 || brands.length === 0) {
            console.error('[Script] No categories or brands found. Please run seeder first.');
            return;
        }

        // Templates based on seeder.js patterns
        const templates = [
            { name: 'MacBook Air M3', price: 27990000, catName: 'Laptop', brandName: 'Apple', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=500' },
            { name: 'iPhone 15 Pro Max', price: 29500000, catName: 'Điện thoại', brandName: 'Apple', img: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=500' },
            { name: 'Samsung Galaxy S24 Ultra', price: 28900000, catName: 'Điện thoại', brandName: 'Samsung', img: 'https://images.unsplash.com/photo-1707246473216-2401f81d4590?q=80&w=500' },
            { name: 'Sony WH-1000XM5', price: 7500000, catName: 'Âm thanh', brandName: 'Sony', img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=500' },
            { name: 'Dell XPS 13', price: 24500000, catName: 'Laptop', brandName: 'Dell', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=500' },
            { name: 'Nike Air Jordan 1', price: 4500000, catName: 'Giày dép', brandName: 'Nike', img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=500' },
            { name: 'Adidas Ultraboost', price: 4200000, catName: 'Giày dép', brandName: 'Adidas', img: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=500' },
            { name: 'Serum Estée Lauder', price: 3200000, catName: 'Chăm sóc da', brandName: 'L’Oréal', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=500' },
            { name: 'Smart TV Sony Bravia', price: 21900000, catName: 'Thiết bị gia dụng', brandName: 'Sony', img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=500' },
            { name: 'Xiaomi 14 Ultra', price: 26900000, catName: 'Điện thoại', brandName: 'Xiaomi', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=500' }
        ];

        const findId = (list, name) => {
            const item = list.find(i => i.name === name);
            return item ? item.id : list[0].id; // Fallback to first if not found
        };

        const productsToInsert = [];
        for (let i = 0; i < toAdd; i++) {
            const template = templates[i % templates.length];
            const version = Math.floor(i / templates.length) + 2; // Start from version 2
            
            productsToInsert.push({
                name: `${template.name} - Version ${version}`,
                description: `Phiên bản nâng cấp ${version} của ${template.name}. Sản phẩm chất lượng cao, thiết kế hiện đại, hiệu năng ổn định.`,
                price: template.price * (1 + (Math.random() * 0.2 - 0.1)), // Variance +/- 10%
                original_price: template.price * 1.25,
                category_id: findId(categories, template.catName),
                brand_id: findId(brands, template.brandName),
                image_url: template.img,
                ai_match_score: 70 + Math.floor(Math.random() * 25),
                rating: 4.0 + (Math.random() * 1.0),
                stock: 20 + Math.floor(Math.random() * 80),
                warranty: '12 Tháng chính hãng',
                condition: 'Mới 100% Nguyên seal',
                origin: 'Hàng nhập khẩu'
            });
        }

        console.log(`[Script] Inserting ${productsToInsert.length} products...`);
        await Product.bulkCreate(productsToInsert);
        
        const finalCount = await Product.count();
        console.log(`[Script] Done! Final product count: ${finalCount}`);

    } catch (error) {
        console.error('[Script] Error:', error);
    } finally {
        // await sequelize.close(); // Don't close if used in long running process
    }
}

addProducts();
