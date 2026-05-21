const { Setting } = require('../models');

// Lấy tất cả cấu hình
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        console.error('[GetSettings Error]', error);
        res.status(500).json({ error: 'Lỗi tải cấu hình hệ thống' });
    }
};

// Cập nhật hoặc tạo mới một cấu hình
exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'Thiếu key cấu hình' });

        const [setting, created] = await Setting.findOrCreate({
            where: { key },
            defaults: { value }
        });

        if (!created) {
            setting.value = value;
            await setting.save();
        }

        res.json({ message: 'Cập nhật thành công', key, value });
    } catch (error) {
        console.error('[UpdateSetting Error]', error);
        res.status(500).json({ error: 'Lỗi cập nhật cấu hình' });
    }
};

// Cập nhật nhiều cấu hình cùng lúc
exports.updateMultipleSettings = async (req, res) => {
    try {
        const settings = req.body; // Expecting an object { key1: value1, key2: value2 }
        for (const [key, value] of Object.entries(settings)) {
            const [setting, created] = await Setting.findOrCreate({
                where: { key },
                defaults: { value }
            });
            if (!created) {
                setting.value = value;
                await setting.save();
            }
        }
        res.json({ message: 'Cập nhật tất cả thành công' });
    } catch (error) {
        console.error('[UpdateMultipleSettings Error]', error);
        res.status(500).json({ error: 'Lỗi cập nhật cấu hình' });
    }
};
