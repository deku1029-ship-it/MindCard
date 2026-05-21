const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const bcrypt = require('bcrypt');
const Review = require('../models/Review');
const { sequelize } = require('./database');

async function seedData() {
    try {
        // Chỉ seeding mẫu khi được yêu cầu (Đã check tồn tại ở index.js)
        console.log('[Seeder] Preparing to seed sample data...');

        // 1. Seed Categories
        console.log('[Seeder] Creating categories...');
        const getCat = async (name, parentId = null) => {
            const [cat] = await Category.findOrCreate({ where: { name, parent_id: parentId } });
            return cat;
        };

        const tech = await getCat('Điện tử & Công nghệ');
        const phone = await getCat('Điện thoại', tech.id);
        const laptop = await getCat('Laptop', tech.id);
        const audio = await getCat('Âm thanh', tech.id);
        const accessory = await getCat('Phụ kiện', tech.id);

        const beauty = await getCat('Sắc đẹp & Sức khỏe');
        const skin_care = await getCat('Chăm sóc da', beauty.id);
        const makeup = await getCat('Trang điểm', beauty.id);
        const perfume = await getCat('Nước hoa', beauty.id);

        const fashion = await getCat('Thời trang & Lifestyle');
        const clothing = await getCat('Quần áo', fashion.id);
        const footwear = await getCat('Giày dép', fashion.id);
        const watches = await getCat('Đồng hồ', fashion.id);

        const home = await getCat('Nhà cửa & Đời sống');
        const appliances = await getCat('Thiết bị gia dụng', home.id);
        const kitchen = await getCat('Dụng cụ nhà bếp', home.id);

        // 2. Seed Brands
        console.log('[Seeder] Creating brands...');
        const getBrand = async (name, parentId = null, description = '') => {
            const [brand] = await Brand.findOrCreate({ 
                where: { name, parent_id: parentId }, 
                defaults: { description } 
            });
            return brand;
        };

        const apple = await getBrand('Apple', null, 'Designed in California');
        const samsung = await getBrand('Samsung', null, 'Imagine the possibilities');
        const sony = await getBrand('Sony', null, 'Be Moved');
        const dell = await getBrand('Dell', null, 'The power to do more');
        const asus = await getBrand('ASUS', null, 'In Search of Incredible');
        const nike = await getBrand('Nike', null, 'Just Do It');
        const adidas = await getBrand('Adidas', null, 'Impossible is nothing');
        const loreal = await getBrand('L’Oréal', null, 'Because you’re worth it');
        const dior = await getBrand('Dior', null, 'Luxury French Fashion');
        const xiaomi = await getBrand('Xiaomi', null, 'Smart technology for everyone');

        // 3. Define 100 Products data
        console.log('[Seeder] Preparing 100 products...');
        
        const productsRaw = [];

        // --- TECHNOLOGY (35 products) ---
        // Laptops (10)
        const laptopData = [
            { name: 'MacBook Air M3 13"', price: 27990000, brand: apple, cat: laptop, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=500' },
            { name: 'MacBook Pro M3 Pro 14"', price: 49990000, brand: apple, cat: laptop, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=500' },
            { name: 'Dell XPS 13 9315', price: 24500000, brand: dell, cat: laptop, img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=500' },
            { name: 'ASUS ROG Zephyrus G14', price: 38900000, brand: asus, cat: laptop, img: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=500' },
            { name: 'MacBook Air M2 13"', price: 22900000, brand: apple, cat: laptop, img: 'https://images.unsplash.com/photo-1611186871348-b1ec696e52c9?q=80&w=500' },
            { name: 'Dell Inspiron 16 5620', price: 18500000, brand: dell, cat: laptop, img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500' },
            { name: 'ASUS Vivobook 15 OLED', price: 15900000, brand: asus, cat: laptop, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=500' },
            { name: 'MacBook Pro M3 Max 16"', price: 79990000, brand: apple, cat: laptop, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=500' },
            { name: 'Dell Latitude 7440', price: 32000000, brand: dell, cat: laptop, img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=500' },
            { name: 'ASUS TUF Gaming F15', price: 21900000, brand: asus, cat: laptop, img: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=500' },
        ];

        // Phones (15)
        const phoneData = [
            { name: 'iPhone 15 Pro Max 256GB', price: 29500000, brand: apple, cat: phone, img: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=500' },
            { name: 'Samsung Galaxy S24 Ultra', price: 28900000, brand: samsung, cat: phone, img: 'https://images.unsplash.com/photo-1707246473216-2401f81d4590?q=80&w=500' },
            { name: 'iPhone 15 128GB', price: 19900000, brand: apple, cat: phone, img: 'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?q=80&w=500' },
            { name: 'Samsung Galaxy Z Fold 5', price: 34900000, brand: samsung, cat: phone, img: 'https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?q=80&w=500' },
            { name: 'Xiaomi 14 Ultra', price: 26900000, brand: xiaomi, cat: phone, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=500' },
            { name: 'iPhone 14 Pro 128GB', price: 22500000, brand: apple, cat: phone, img: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?q=80&w=500' },
            { name: 'Samsung Galaxy A55 5G', price: 9500000, brand: samsung, cat: phone, img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=500' },
            { name: 'Xiaomi Redmi Note 13 Pro', price: 7200000, brand: xiaomi, cat: phone, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500' },
            { name: 'iPhone 13 128GB', price: 14500000, brand: apple, cat: phone, img: 'https://images.unsplash.com/photo-1632733711679-5292d696366e?q=80&w=500' },
            { name: 'Samsung Galaxy S24 Plus', price: 21900000, brand: samsung, cat: phone, img: 'https://images.unsplash.com/photo-1610792516307-ea5acc9d3b43?q=80&w=500' },
            { name: 'iPhone 15 Plus 128GB', price: 22900000, brand: apple, cat: phone, img: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=500' },
            { name: 'Samsung Galaxy Z Flip 5', price: 17900000, brand: samsung, cat: phone, img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=500' },
            { name: 'Xiaomi Poco X6 Pro', price: 8900000, brand: xiaomi, cat: phone, img: 'https://images.unsplash.com/photo-1523206489230-c012c7449a2e?q=80&w=500' },
            { name: 'iPhone SE 2022 64GB', price: 10900000, brand: apple, cat: phone, img: 'https://images.unsplash.com/photo-1556656793-062ff98782ee?q=80&w=500' },
            { name: 'Samsung Galaxy S23 FE', price: 12500000, brand: samsung, cat: phone, img: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=500' },
        ];

        // Audio & Accessories (10)
        const audioData = [
            { name: 'Apple AirPods Pro 2 USB-C', price: 5900000, brand: apple, cat: audio, img: 'https://images.unsplash.com/photo-1588423770119-9457fa232843?q=80&w=500' },
            { name: 'Sony WH-1000XM5 ANC', price: 7500000, brand: sony, cat: audio, img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=500' },
            { name: 'Samsung Galaxy Buds 2 Pro', price: 3200000, brand: samsung, cat: audio, img: 'https://images.unsplash.com/photo-1644788102377-1721b0289f66?q=80&w=500' },
            { name: 'Sony WF-1000XM5', price: 5400000, brand: sony, cat: audio, img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=500' },
            { name: 'Apple AirPods 3', price: 4200000, brand: apple, cat: audio, img: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?q=80&w=500' },
            { name: 'Loa Bluetooth Marshall Emberton II', price: 3900000, brand: apple, cat: audio, img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=500' },
            { name: 'Sony HT-S20R Soundbar 5.1', price: 4900000, brand: sony, cat: audio, img: 'https://images.unsplash.com/photo-1545013149-ed99ec5bb3f0?q=80&w=500' },
            { name: 'Chuột Logitech MX Master 3S', price: 2300000, brand: apple, cat: accessory, img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=500' },
            { name: 'Bàn phím cơ ASUS ROG Azoth', price: 5500000, brand: asus, cat: accessory, img: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=500' },
            { name: 'Apple Watch Ultra 2 Titanium', price: 19900000, brand: apple, cat: accessory, img: 'https://images.unsplash.com/photo-1434493907317-a46b53b81882?q=80&w=500' },
        ];

        // --- BEAUTY (25 products) ---
        const beautyData = [
            { name: 'Serum Estée Lauder Advanced Night Repair 50ml', price: 3200000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=500' },
            { name: 'Son Dior Rouge 999 Velvet', price: 1100000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=500' },
            { name: 'Nước hoa Chanel No.5 Eau de Parfum 100ml', price: 4500000, brand: dior, cat: perfume, img: 'https://images.unsplash.com/photo-1541643600914-78b084681c01?q=80&w=500' },
            { name: 'Kem dưỡng La Mer Crème de la Mer 60ml', price: 9500000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=500' },
            { name: 'Nước hoa Dior Sauvage Elixir 60ml', price: 4200000, brand: dior, cat: perfume, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500' },
            { name: 'Serum SkinCeuticals CE Ferulic', price: 3800000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500' },
            { name: 'Phấn nước YSL Le Cushion Encre de Peau', price: 1600000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1596462502278-27bf2d316a3c?q=80&w=500' },
            { name: 'Mặt nạ ngủ Laneige Water Sleeping Mask', price: 750000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=500' },
            { name: 'Tẩy trang Bioderma Sensibio H2O 500ml', price: 450000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=500' },
            { name: 'Son MAC Matte Lipstick Ruby Woo', price: 550000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1591360236660-7dfbf384061a?q=80&w=500' },
            { name: 'Kem chống nắng La Roche-Posay Anthelios', price: 520000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1598440947619-2035fc8ba911?q=80&w=500' },
            { name: 'Nước thần SK-II Facial Treatment Essence', price: 3900000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1617897903246-7392ce7ea763?q=80&w=500' },
            { name: 'Phấn phủ Laura Mercier Loose Setting Powder', price: 1150000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1596462502278-27bf2d316a3c?q=80&w=500' },
            { name: 'Bảng mắt Tom Ford Eye Color Quad', price: 2400000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1596462502278-27bf2d316a3c?q=80&w=500' },
            { name: 'Dầu tẩy trang Shu Uemura Ultim8', price: 2800000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500' },
            { name: 'Kem nền Giorgio Armani Luminous Silk', price: 1750000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=500' },
            { name: 'Nước hoa Gucci Bloom Eau de Parfum', price: 3400000, brand: dior, cat: perfume, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500' },
            { name: 'Serum Kiehl’s Clearly Corrective Dark Spot', price: 1950000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=500' },
            { name: 'Son dưỡng Dior Addict Lip Glow', price: 950000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=500' },
            { name: 'Xịt khoáng Vichy Eau Thermale 300ml', price: 380000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=500' },
            { name: 'Mascara Maybelline Lash Sensational', price: 250000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=500' },
            { name: 'Kem dưỡng ẩm Neutrogena Hydro Boost', price: 420000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=500' },
            { name: 'Kẻ mắt nước Stila Stay All Day', price: 650000, brand: dior, cat: makeup, img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=500' },
            { name: 'Mặt nạ đất sét Kiehl’s Rare Earth Deep Pore', price: 890000, brand: loreal, cat: skin_care, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=500' },
            { name: 'Nước hoa Lancôme La Vie Est Belle', price: 3200000, brand: dior, cat: perfume, img: 'https://images.unsplash.com/photo-1541643600914-78b084681c01?q=80&w=500' },
        ];

        // --- FASHION (25 products) ---
        const fashionData = [
            { name: 'Giày Nike Air Jordan 1 Low "Panda"', price: 4500000, brand: nike, cat: footwear, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=500' },
            { name: 'Áo thun Adidas Adicolor Classics', price: 850000, brand: adidas, cat: clothing, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500' },
            { name: 'Giày Adidas Ultraboost Light', price: 4200000, brand: adidas, cat: footwear, img: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=500' },
            { name: 'Áo Polo Nike Dri-FIT Advantage', price: 1250000, brand: nike, cat: clothing, img: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=500' },
            { name: 'Đồng hồ Apple Watch Series 9 45mm', price: 10900000, brand: apple, cat: watches, img: 'https://images.unsplash.com/photo-1544117518-30df578096a4?q=80&w=500' },
            { name: 'Quần tập Gym Nike Pro Leggings', price: 950000, brand: nike, cat: clothing, img: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=500' },
            { name: 'Giày thể thao Adidas Stan Smith', price: 2400000, brand: adidas, cat: footwear, img: 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?q=80&w=500' },
            { name: 'Áo khoác Nike Windrunner Jacket', price: 2100000, brand: nike, cat: clothing, img: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=500' },
            { name: 'Túi xách Dior Caro Bag Medium', price: 95000000, brand: dior, cat: clothing, img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=500' },
            { name: 'Giày Nike Dunk Low Retro White Black', price: 3900000, brand: nike, cat: footwear, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=500' },
            { name: 'Mũ lưỡi trai Adidas Baseball Cap', price: 450000, brand: adidas, cat: clothing, img: 'https://images.unsplash.com/photo-1588850567049-de10f56d98d2?q=80&w=500' },
            { name: 'Giày chạy bộ Nike Pegasus 40', price: 2800000, brand: nike, cat: footwear, img: 'https://images.unsplash.com/photo-1542291026-7eec264c274d?q=80&w=500' },
            { name: 'Áo Hoodie Adidas Essentials', price: 1450000, brand: adidas, cat: clothing, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=500' },
            { name: 'Thắt lưng Dior Reversible Belt', price: 18500000, brand: dior, cat: clothing, img: 'https://images.unsplash.com/photo-1624222247344-550fb8ef5522?q=80&w=500' },
            { name: 'Giày Adidas Superstar White', price: 2100000, brand: adidas, cat: footwear, img: 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?q=80&w=500' },
            { name: 'Quần Short Nike Tempo Running', price: 750000, brand: nike, cat: clothing, img: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=500' },
            { name: 'Ba lô Adidas Classic Backpack', price: 950000, brand: adidas, cat: clothing, img: 'https://images.unsplash.com/photo-1553062407-98eebce4c0ca?q=80&w=500' },
            { name: 'Giày Nike Air Force 1 07', price: 3500000, brand: nike, cat: footwear, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=500' },
            { name: 'Áo thun Nike Sportswear Club', price: 850000, brand: nike, cat: clothing, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500' },
            { name: 'Túi chéo Adidas Adicolor Festival', price: 650000, brand: adidas, cat: clothing, img: 'https://images.unsplash.com/photo-1553062407-98eebce4c0ca?q=80&w=500' },
            { name: 'Giày Adidas Forum Low', price: 2800000, brand: adidas, cat: footwear, img: 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?q=80&w=500' },
            { name: 'Áo khoác Adidas Firebird Track Top', price: 1950000, brand: adidas, cat: clothing, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=500' },
            { name: 'Giày Nike Vaporfly 3 Next%', price: 6500000, brand: nike, cat: footwear, img: 'https://images.unsplash.com/photo-1542291026-7eec264c274d?q=80&w=500' },
            { name: 'Kính mát Dior Signature S7U', price: 14500000, brand: dior, cat: clothing, img: 'https://images.unsplash.com/photo-1511499767350-a1590fdb7ac5?q=80&w=500' },
            { name: 'Tất Adidas Mid-Cut Crew Socks', price: 350000, brand: adidas, cat: clothing, img: 'https://images.unsplash.com/photo-1586350977966-b7af0d937000?q=80&w=500' },
        ];

        // --- HOME & APPLIANCES (15 products) ---
        const homeData = [
            { name: 'Smart TV Sony Bravia 4K 65 inch', price: 21900000, brand: sony, cat: appliances, img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=500' },
            { name: 'Tủ lạnh Samsung Inverter 488L', price: 24500000, brand: samsung, cat: appliances, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=500' },
            { name: 'Máy lọc không khí Xiaomi Elite', price: 5490000, brand: xiaomi, cat: appliances, img: 'https://images.unsplash.com/photo-1585771724684-252702b64428?q=80&w=500' },
            { name: 'Máy pha cà phê Philips EP2220', price: 11500000, brand: sony, cat: kitchen, img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=500' },
            { name: 'Nồi chiên không dầu Philips XXL', price: 6900000, brand: sony, cat: kitchen, img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=500' },
            { name: 'Robot hút bụi Xiaomi Vacuum X10', price: 8900000, brand: xiaomi, cat: appliances, img: 'https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?q=80&w=500' },
            { name: 'Lò vi sóng Samsung có nướng 23L', price: 3200000, brand: samsung, cat: kitchen, img: 'https://images.unsplash.com/photo-1574265366533-3142279f9026?q=80&w=500' },
            { name: 'Máy giặt Samsung AddWash 10kg', price: 14900000, brand: samsung, cat: appliances, img: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=500' },
            { name: 'Bếp điện từ Mi Home Induction Cooker', price: 1150000, brand: xiaomi, cat: kitchen, img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=500' },
            { name: 'Tivi Xiaomi A Pro 55 inch 4K', price: 8500000, brand: xiaomi, cat: appliances, img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=500' },
            { name: 'Máy hút bụi cầm tay Xiaomi G10', price: 4200000, brand: xiaomi, cat: appliances, img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=500' },
            { name: 'Bình đun siêu tốc Xiaomi Smart Kettle', price: 850000, brand: xiaomi, cat: kitchen, img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=500' },
            { name: 'Loa Sony Bluetooth SRS-XG300', price: 6500000, brand: sony, cat: appliances, img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=500' },
            { name: 'Quạt đứng Samsung Inverter', price: 2900000, brand: samsung, cat: appliances, img: 'https://images.unsplash.com/photo-1563222384-0690cb253258?q=80&w=500' },
            { name: 'Máy sấy tóc Xiaomi H500', price: 1250000, brand: xiaomi, cat: appliances, img: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?q=80&w=500' },
        ];

        // Gộp tất cả dữ liệu
        const fullData = [
            ...laptopData, ...phoneData, ...audioData, 
            ...beautyData, ...fashionData, ...homeData
        ];

        // Lấy chính xác 100 sản phẩm (có thể lặp lại một vài mẫu với biến thể dung lượng/màu sắc nếu chưa đủ)
        const productsToInsert = [];
        for (let i = 0; i < 100; i++) {
            const base = fullData[i % fullData.length];
            const suffix = i >= fullData.length ? ` (V.${Math.floor(i/fullData.length)})` : '';
            
            productsToInsert.push({
                name: `${base.name}${suffix}`,
                description: `Sản phẩm ${base.name} chất lượng cao, chính hãng với hiệu năng vượt trội. Bảo hành lâu dài.`,
                price: base.price, 
                original_price: base.price * 1.15,
                category_id: base.cat.id, 
                brand_id: base.brand.id,
                image_url: base.img,
                ai_match_score: 85 + (i % 15), 
                rating: 4.0 + (Math.random() * 1.0), 
                stock: 10 + (i % 50),
                warranty: '12-24 Tháng chính hãng',
                condition: 'Mới 100% Nguyên seal',
                origin: 'Nhập khẩu / Chính hãng'
            });
        }

        // 4. Bulk Create Products
        console.log(`[Seeder] Inserting ${productsToInsert.length} products...`);
        await Product.bulkCreate(productsToInsert);
        
        console.log('[Seeder] Seeding users...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const [admin] = await User.findOrCreate({
            where: { email: 'admin@aistore.vn' },
            defaults: {
                username: 'Quản trị viên',
                password: hashedPassword,
                role: 'admin'
            }
        });

        console.log('[Seeder] Seeding dummy reviews...');
        const products = await Product.findAll({ limit: 20 }); // Seed reviews for first 20 products
        const reviewsToInsert = [];
        for (const p of products) {
            // 2-5 reviews per product
            const numReviews = Math.floor(Math.random() * 4) + 2; 
            let totalRating = 0;
            for (let i = 0; i < numReviews; i++) {
                const r = Math.floor(Math.random() * 2) + 4; // 4 or 5 star
                totalRating += r;
                reviewsToInsert.push({
                    user_id: admin.id,
                    product_id: p.id,
                    rating: r,
                    comment: `Sản phẩm ${p.name} rất tuyệt vời! Chất lượng đúng như mô tả.`
                });
            }
            const avgRating = totalRating / numReviews;
            await p.update({ rating: Math.round(avgRating * 10) / 10 });
        }
        await Review.bulkCreate(reviewsToInsert);

        console.log('[Seeder] All sample data has been seeded successfully.');
        console.log(`[Seeder] Total Products: ${await Product.count()}`);
        console.log(`[Seeder] Total Categories: ${await Category.count()}`);
        console.log(`[Seeder] Total Brands: ${await Brand.count()}`);
        console.log(`[Seeder] Total Reviews: ${await Review.count()}`);

    } catch (error) {
        console.error('[Seeder] Failed to run seeder:', error);
    }
}

module.exports = { seedData };
