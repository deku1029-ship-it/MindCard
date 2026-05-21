require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize, initializeDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Tĩnh folder để truy cập ảnh upload (vd: http://localhost:3000/uploads/...)
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Basic API route để test
app.get("/api/ping", (req, res) => {
  res.json({ message: "Backend is running!", status: "OK" });
});

// Load Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const chatbotRoutes = require("./routes/chatbotRoutes");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const categoryRoutes = require("./routes/categories");
const brandRoutes = require("./routes/brands");
const managementRoutes = require("./routes/management");
const settingRoutes = require("./routes/settings");
const uploadRoutes = require("./routes/upload");
const cartRoutes = require("./routes/cart");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatbotRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/cart", cartRoutes);

// Khởi chạy hệ thống
async function startServer() {
  try {
    // 1. Đảm bảo database đã được tạo trên XAMPP
    await initializeDatabase();

    // 2. Import các Models và thiết lập Associations tập trung
    const models = require("./models/index");
    const db = models.sequelize;

    // Test kết nối và đồng bộ vào Database
    await db.authenticate();
    // Chỉ seeding khi database trống (Đã check ở index.js)
    console.log("[Seeder] Preparing to seed sample data...");

    // Cú pháp sync({ alter: true }) tự động cập nhật cấu trúc bảng mà không xóa dữ liệu
    await db.sync();
    console.log("[Sequelize] All tables synced.");

    /* 
        // Tiến hành Seed dữ liệu nếu DB đang trống (Check số lượng sản phẩm)
        const { Product } = models;
        const productCount = await Product.count();
        if (productCount === 0) {
            const { seedData } = require('./config/seeder');
            await seedData();
        } else {
            console.log(`[Seeder] Data already exists (${productCount} products). Skipping auto-seed.`);
        }
        */

    // 3. Khởi động API server
    app.listen(PORT, () => {
      console.log(
        `[Express] Server is running deeply on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
