const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret';

const authenticateToken = (req, res, next) => {
    // Lấy token từ header "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối: Thiếu Token' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
        
        req.user = user; // Giữ thông tin user cho handler tiếp theo
        next();
    });
};

// Phiên bản không bắt buộc: Nếu có token thì giải mã, nếu không có thì vẫn cho qua
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(); // Không có token, tiếp tục như khách vãng lai
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (!err) {
            req.user = user; // Giải mã thành công, lưu thông tin user
        }
        next(); // Luôn tiếp tục dù token có lỗi (coi như khách)
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên' });
    }
    next();
};

const isAdminOrStaff = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
        return res.status(403).json({ error: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên hoặc nhân sự' });
    }
    next();
};

module.exports = { authenticateToken, optionalAuthenticateToken, isAdmin, isAdminOrStaff };
