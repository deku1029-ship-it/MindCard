const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret';

// API Đăng ký
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Kiểm tra tồn tại
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }

        // Băm mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo User
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: 'Đăng ký thành công!', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};

// API Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm User bằng Email HOẶC Username
        const user = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { email: email },
                    { username: email }
                ]
            } 
        });
        if (!user) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        // Xác thực mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        // Tạo JWT Token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};
