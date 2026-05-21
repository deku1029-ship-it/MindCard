const Product = require('./server/models/Product');
const Category = require('./server/models/Category');
const Brand = require('./server/models/Brand');

async function check() {
    try {
        const categories = await Category.findAll({ attributes: ['id', 'name', 'parent_id'], raw: true });
        console.log('--- Categories ---');
        console.table(categories);

        const products = await Product.findAll({ 
            attributes: ['id', 'name', 'category_id', 'brand_id'], 
            limit: 5,
            raw: true 
        });
        console.log('\n--- Products ---');
        console.table(products);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
