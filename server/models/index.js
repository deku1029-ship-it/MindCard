const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Brand = require('./Brand');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Unit = require('./Unit');
const Staff = require('./Staff');
const Task = require('./Task');
const Evaluation = require('./Evaluation');
const Setting = require('./Setting');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Review = require('./Review');
// --- THIẾT LẬP QUAN HỆ (ASSOCIATIONS) ---

// 1. Sản phẩm - Danh mục - Nhãn hàng
Product.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Product, { foreignKey: 'category_id' });

Product.belongsTo(Brand, { foreignKey: 'brand_id' });
Brand.hasMany(Product, { foreignKey: 'brand_id' });

Brand.hasMany(Brand, { as: 'children', foreignKey: 'parent_id' });
Brand.belongsTo(Brand, { as: 'parent', foreignKey: 'parent_id' });

Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

// 2. Đơn hàng - Người dùng - Sản phẩm
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// 3. Quản trị nội bộ (Đơn vị - Nhân sự - Công việc - Đánh giá)
Unit.hasMany(Unit, { as: 'Children', foreignKey: 'parent_id' });
Unit.belongsTo(Unit, { as: 'Parent', foreignKey: 'parent_id' });

Staff.belongsTo(Unit, { foreignKey: 'unit_id' });
Unit.hasMany(Staff, { foreignKey: 'unit_id' });

Task.belongsTo(Staff, { foreignKey: 'staff_id' });
Staff.hasMany(Task, { foreignKey: 'staff_id' });

Evaluation.belongsTo(Staff, { foreignKey: 'staff_id' });
Staff.hasMany(Evaluation, { foreignKey: 'staff_id' });

Staff.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Staff, { foreignKey: 'user_id' });

// 4. Giỏ hàng (Cart - CartItem - Product - User)
User.hasOne(Cart, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'user_id' });

Cart.hasMany(CartItem, { foreignKey: 'cart_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });

Product.hasMany(CartItem, { foreignKey: 'product_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

// 5. Đánh giá (Review - Product - User)
Product.hasMany(Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
    User,
    Category,
    Brand,
    Product,
    Order,
    OrderItem,
    Unit,
    Staff,
    Task,
    Evaluation,
    Setting,
    Cart,
    CartItem,
    Review,
    sequelize
};
