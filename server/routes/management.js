const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const { Unit, Staff, Task, Evaluation, User, sequelize } = require('../models');
const bcrypt = require('bcrypt');

// --- QUẢN LÝ ĐƠN VỊ (UNIT) ---

router.get('/units', authenticateToken, isAdmin, async (req, res) => {
    try {
        const units = await Unit.findAll({
            include: [{ model: Unit, as: 'Parent', attributes: ['name'] }],
            order: [['id', 'DESC']]
        });
        res.json(units);
    } catch (error) {
        console.error('[GetUnits Error]', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách đơn vị', details: error.message });
    }
});

router.post('/units', authenticateToken, isAdmin, async (req, res) => {
    try {
        const unit = await Unit.create(req.body);
        res.status(201).json(unit);
    } catch (error) {
        console.error('[CreateUnit Error]', error);
        res.status(500).json({ error: 'Lỗi tạo đơn vị' });
    }
});

router.put('/units/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const unit = await Unit.findByPk(req.params.id);
        if (!unit) return res.status(404).json({ error: 'Không tìm thấy' });
        await unit.update(req.body);
        res.json(unit);
    } catch (error) {
        console.error('[UpdateUnit Error]', error);
        res.status(500).json({ error: 'Lỗi cập nhật đơn vị' });
    }
});

router.delete('/units/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const unit = await Unit.findByPk(req.params.id);
        if (!unit) return res.status(404).json({ error: 'Không tìm thấy' });
        await unit.destroy();
        res.json({ message: 'Đã xóa đơn vị' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa đơn vị (có thể đang có nhân sự thuộc đơn vị này)' });
    }
});

// --- QUẢN LÝ NHÂN SỰ (STAFF) ---

router.get('/staff', authenticateToken, isAdmin, async (req, res) => {
    try {
        const staff = await Staff.findAll({
            include: [
                { model: Unit, attributes: ['name'] },
                { model: User, attributes: ['username'] }
            ],
            order: [['id', 'DESC']]
        });
        res.json(staff);
    } catch (error) {
        console.error('[GetStaff Error]', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách nhân sự' });
    }
});

router.post('/staff', authenticateToken, isAdmin, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { full_name, email, phone, position, unit_id, status, create_account, username, password } = req.body;

        // 1. Tạo bản ghi Staff
        const member = await Staff.create({
            full_name, email, phone, position, unit_id, status
        }, { transaction });

        // 2. Nếu có yêu cầu tạo tài khoản login
        if (create_account && username && password) {
            // Kiểm tra email hoặc username đã tồn tại chưa
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Email này đã gắn với một tài khoản khác.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                username,
                email,
                password: hashedPassword,
                role: 'staff'
            }, { transaction });

            // Liên kết Staff với User
            await member.update({ user_id: user.id }, { transaction });
        }

        await transaction.commit();
        res.status(201).json(member);
    } catch (error) {
        await transaction.rollback();
        console.error('[CreateStaff Error]', error);
        res.status(500).json({ error: 'Lỗi thêm nhân sự: ' + error.message });
    }
});

router.put('/staff/:id', authenticateToken, isAdmin, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const member = await Staff.findByPk(req.params.id);
        if (!member) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Không tìm thấy' });
        }

        const { create_account, username, password, email, ...rest } = req.body;
        
        // Cập nhật thông tin staff
        await member.update({ email, ...rest }, { transaction });

        // Tạo hoặc cập nhật account nếu có yêu cầu
        if (create_account && username) {
            if (!member.user_id) {
                if (!password) {
                    await transaction.rollback();
                    return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu để tạo tài khoản' });
                }
                // Tạo mới User
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser) {
                    await transaction.rollback();
                    return res.status(400).json({ error: 'Email đã tồn tại ở tài khoản khác' });
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const user = await User.create({
                    username, email, password: hashedPassword, role: 'staff'
                }, { transaction });
                
                await member.update({ user_id: user.id }, { transaction });
            } else {
                // Cập nhật User hiện tại (đổi pass/username)
                const user = await User.findByPk(member.user_id);
                if (user) {
                    const updateData = { username, email };
                    if (password) {
                        updateData.password = await bcrypt.hash(password, 10);
                    }
                    await user.update(updateData, { transaction });
                }
            }
        } else if (email && member.user_id) {
            // Đồng bộ email nếu sửa ở staff nhưng không đổi pass
            const user = await User.findByPk(member.user_id);
            if (user && user.email !== email) {
                await user.update({ email }, { transaction });
            }
        }

        await transaction.commit();
        res.json(member);
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: 'Lỗi cập nhật nhân sự: ' + error.message });
    }
});

router.delete('/staff/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const member = await Staff.findByPk(req.params.id);
        if (!member) return res.status(404).json({ error: 'Không tìm thấy' });
        await member.destroy();
        res.json({ message: 'Đã xóa nhân sự' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa nhân sự' });
    }
});

// --- QUẢN LÝ CÔNG VIỆC (TASK) ---

router.get('/tasks', authenticateToken, isAdmin, async (req, res) => {
    try {
        const tasks = await Task.findAll({
            include: [{ model: Staff, attributes: ['full_name'] }],
            order: [['id', 'DESC']]
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách công việc' });
    }
});

router.post('/tasks', authenticateToken, isAdmin, async (req, res) => {
    try {
        const task = await Task.create(req.body);
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo công việc' });
    }
});

router.put('/tasks/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Không tìm thấy' });
        await task.update(req.body);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật công việc' });
    }
});

router.delete('/tasks/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Không tìm thấy' });
        await task.destroy();
        res.json({ message: 'Đã xóa công việc' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa công việc' });
    }
});

// --- QUẢN LÝ ĐÁNH GIÁ (EVALUATION) ---

router.get('/evaluations', authenticateToken, isAdmin, async (req, res) => {
    try {
        const evaluations = await Evaluation.findAll({
            include: [{ model: Staff, attributes: ['full_name'] }],
            order: [['id', 'DESC']]
        });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách đánh giá' });
    }
});

router.post('/evaluations', authenticateToken, isAdmin, async (req, res) => {
    try {
        const evaluation = await Evaluation.create(req.body);
        res.status(201).json(evaluation);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo đánh giá' });
    }
});

router.put('/evaluations/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const evaluation = await Evaluation.findByPk(req.params.id);
        if (!evaluation) return res.status(404).json({ error: 'Không tìm thấy' });
        await evaluation.update(req.body);
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật đánh giá' });
    }
});

router.delete('/evaluations/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const evaluation = await Evaluation.findByPk(req.params.id);
        if (!evaluation) return res.status(404).json({ error: 'Không tìm thấy' });
        await evaluation.destroy();
        res.json({ message: 'Đã xóa đánh giá' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa đánh giá' });
    }
});

module.exports = router;
