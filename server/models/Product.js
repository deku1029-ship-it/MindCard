const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false
    },
    original_price: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true
    },
    // Trường cũ (String) - Giữ lại để migration nế cần, nhưng sẽ dùng category_id làm chính
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Categories',
            key: 'id'
        }
    },
    brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Brands',
            key: 'id'
        }
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ai_match_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    sales_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    warranty: {
        type: DataTypes.STRING,
        defaultValue: '12 Tháng chính hãng'
    },
    condition: {
        type: DataTypes.STRING,
        defaultValue: 'Mới 100% Nguyên seal'
    },
    origin: {
        type: DataTypes.STRING,
        defaultValue: 'Nhập khẩu / Chính hãng'
    }
}, {
    timestamps: true
});

module.exports = Product;
