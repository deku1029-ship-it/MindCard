const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Op } = require("sequelize");
const { Product, Category, Brand, User } = require("../models");

const routerInstance = express.Router();

/**
 * Intelligent RAG: Retrieve products based on keywords and intent
 * Uses product-line alias mapping and smart AND/OR query building
 */
async function retrieveRelevantProducts(userMessage) {
  try {
    const lowerMsg = userMessage.toLowerCase();

    // 1. Intent Detection
    const isAskingNewest =
      lowerMsg.includes("mới nhất") ||
      lowerMsg.includes("vừa về") ||
      lowerMsg.includes("mới về");
    const isAskingBestSelling =
      lowerMsg.includes("bán chạy") ||
      lowerMsg.includes("hot") ||
      lowerMsg.includes("phổ biến");
    const isAskingCheap =
      lowerMsg.includes("rẻ") ||
      lowerMsg.includes("giá thấp") ||
      lowerMsg.includes("tiết kiệm");
    const isAskingPremium =
      lowerMsg.includes("cao cấp") ||
      lowerMsg.includes("xịn") ||
      lowerMsg.includes("đắt");

    // 2. Product-line alias map → maps common product names to brand names
    const productAliases = {
      iphone: "Apple",
      ipad: "Apple",
      macbook: "Apple",
      airpod: "Apple",
      "apple watch": "Apple",
      samsung: "Samsung",
      galaxy: "Samsung",
      xiaomi: "Xiaomi",
      redmi: "Xiaomi",
      poco: "Xiaomi",
      oppo: "OPPO",
      realme: "Realme",
      vivo: "Vivo",
      sony: "Sony",
      lg: "LG",
      dell: "Dell",
      asus: "ASUS",
      acer: "Acer",
      lenovo: "Lenovo",
      thinkpad: "Lenovo",
      hp: "HP",
      logitech: "Logitech",
      razer: "Razer",
    };

    // 3. Keyword extraction (min length 3 to avoid noise from short Vietnamese words)
    const words = lowerMsg.split(/\s+/);
    const stopwords = [
      "tôi",
      "bạn",
      "của",
      "và",
      "là",
      "có",
      "không",
      "cho",
      "được",
      "với",
      "về",
      "tìm",
      "kho",
      "giá",
      "nhiêu",
      "bao",
      "xin",
      "chào",
      "mua",
      "bán",
      "sản",
      "phẩm",
      "muốn",
      "cần",
      "nào",
      "hỏi",
      "xem",
      "thử",
      "vấn",
      "giới",
      "thiệu",
      "gợi",
      "đắt",
      "rẻ",
      "nhất",
      "này",
      "kia",
      "đây",
      "đó",
      "thì",
      "mà",
      "nhé",
      "ạ",
      "anh",
      "chị",
      "em",
      "giúp",
      "hãy",
      "cho",
      "dùng",
      "nên",
      "hay",
      "hoặc",
      "đang",
      "tìm",
      "kiếm",
      "store",
      "shop",
      "cửa",
      "hàng",
      "thêm",
      "vài",
    ];
    const keywords = words.filter(
      (w) => (w.length >= 3 || /^\d+$/.test(w)) && !stopwords.includes(w),
    );

    // 4. Detect brands from DB + aliases
    const allCategories = await Category.findAll({
      attributes: ["id", "name"],
      raw: true,
    });
    const allBrands = await Brand.findAll({
      attributes: ["id", "name"],
      raw: true,
    });

    // Direct brand match from message
    let detectedBrandIds = allBrands
      .filter((b) => lowerMsg.includes(b.name.toLowerCase()))
      .map((b) => b.id);

    // Alias-based brand match (e.g. "iphone" → find "Apple" brand)
    for (const [alias, brandName] of Object.entries(productAliases)) {
      if (lowerMsg.includes(alias)) {
        const matchedBrand = allBrands.find(
          (b) => b.name.toLowerCase() === brandName.toLowerCase(),
        );
        if (matchedBrand && !detectedBrandIds.includes(matchedBrand.id)) {
          detectedBrandIds.push(matchedBrand.id);
        }
      }
    }

    // Category match
    const detectedCatIds = allCategories
      .filter((c) => lowerMsg.includes(c.name.toLowerCase()))
      .map((c) => c.id);

    // 5. Build Query — smarter AND/OR logic
    let queryOptions = {
      where: {},
      limit: 3,
      include: [
        { model: Category, attributes: ["name"] },
        { model: Brand, attributes: ["name"] },
      ],
    };

    // Build conditions
    const nameDescConditions = [];
    const filterConditions = [];

    // Add keyword LIKE conditions on name and description
    if (keywords.length > 0) {
      keywords.forEach((kw) => {
        nameDescConditions.push(
          { name: { [Op.like]: `%${kw}%` } },
          { description: { [Op.like]: `%${kw}%` } },
        );
      });
    }

    // If brand detected, add as a strong AND filter
    if (detectedBrandIds.length > 0) {
      filterConditions.push({ brand_id: { [Op.in]: detectedBrandIds } });
    }

    // If category detected, add as AND filter
    if (detectedCatIds.length > 0) {
      filterConditions.push({ category_id: { [Op.in]: detectedCatIds } });
    }

    // Combine: brand/cat AND keywords → precise results
    // Only keywords → OR search
    // Only brand/cat → filter by brand/cat
    if (filterConditions.length > 0 && nameDescConditions.length > 0) {
      queryOptions.where = {
        [Op.and]: [...filterConditions, { [Op.or]: nameDescConditions }],
      };
    } else if (filterConditions.length > 0) {
      queryOptions.where = { [Op.and]: filterConditions };
    } else if (nameDescConditions.length > 0) {
      queryOptions.where = { [Op.or]: nameDescConditions };
    } else {
      // No keywords, no brand, no category
      if (isAskingNewest || isAskingBestSelling) {
        queryOptions.where = {};
      } else {
        return "";
      }
    }

    // Sorting logic
    if (isAskingNewest) {
      queryOptions.order = [["createdAt", "DESC"]];
    } else if (isAskingBestSelling) {
      queryOptions.order = [["sales_count", "DESC"]];
    } else if (isAskingCheap) {
      queryOptions.order = [["price", "ASC"]];
    } else if (isAskingPremium) {
      queryOptions.order = [["price", "DESC"]];
    } else {
      queryOptions.order = [["rating", "DESC"]];
    }

    console.log(
      "[RAG] Keywords:",
      keywords,
      "| Brands:",
      detectedBrandIds,
      "| Categories:",
      detectedCatIds,
    );

    const products = await Product.findAll(queryOptions);

    console.log(
      `[RAG] Found ${products.length} products for: "${userMessage}"`,
    );

    if (products.length === 0) return "";

    let lines = [];
    for (const p of products) {
      const priceStr =
        new Intl.NumberFormat("vi-VN").format(Math.round(p.price)) + " ₫";
      const stockStr = p.stock > 0 ? `Còn hàng (${p.stock})` : "Hết hàng";
      const catName = p.Category ? p.Category.name : "Chưa phân loại";
      const brandName = p.Brand ? p.Brand.name : "Chưa rõ hãng";
      // p.id is always a real INTEGER from DB (e.g. 1, 2, 42) — NEVER a string like MKE004
      const productId = parseInt(p.id, 10);

      lines.push(
        `## Sản phẩm ID=${productId} (SỐ NGUYÊN THẬT TỪ DATABASE)\n` +
          `| Tên | Danh mục | Thương hiệu |\n` +
          `| --- | --- | --- |\n` +
          `| **${p.name}** | ${catName} | ${brandName} |\n` +
          `| **Giá**: ${priceStr} | **Tồn kho**: ${stockStr} | **Đánh giá**: ${p.rating}⭐ |\n` +
          `| [🛒 Thêm Vào Giỏ](/cart/add/${productId}) | [🔍 Xem Chi Tiết](/product/${productId}) | |\n` +
          `| **Mô tả**: ${p.description ? p.description.substring(0, 120) + "..." : "Đang cập nhật"} | | |`,
      );
    }

    return (
      "=== DỮ LIỆU SẢN PHẨM THẬT TỪ DATABASE (ID LÀ SỐ NGUYÊN) ===\n" +
      "⚠️ QUAN TRỌNG: Mỗi sản phẩm có ID là SỐ NGUYÊN (ví dụ: 1, 5, 42). " +
      "TUYỆT ĐỐI CHỈ dùng đúng ID số nguyên được ghi ở đầu mỗi sản phẩm (ID=XXX) cho các link. " +
      "KHÔNG ĐƯỢC tự tạo ID dạng chuỗi (MKE001, SP123, v.v.).\n\n" +
      lines.join("\n\n---\n\n") +
      "\n=== KẾT THÚC DỮ LIỆU SẢN PHẨM ==="
    );
  } catch (error) {
    console.error("[Chatbot RAG] Error:", error);
    return "";
  }
}

/**
 * Enhanced System Instruction
 */
async function buildSystemInstruction(userId, messageCount) {
  const categories = await Category.findAll({
    where: { parent_id: null },
    attributes: ["name"],
    raw: true,
  });
  const catNames = categories.map((c) => c.name).join(", ");

  let prompt = `Bạn là **Chuyên viên Tư vấn AI Cao cấp** của hệ thống **MindCard**.
Bạn chịu trách nhiệm hỗ trợ khách hàng mua sắm các sản phẩm: ${catNames} và các thiết bị công nghệ có sẵn trong hệ thống của chúng tôi.

**PHONG CÁCH GIAO TIẾP:**
- Tuyệt đối KHÔNG thừa nhận là AI hay Chatbot. Hãy trả lời như một người tư vấn thật thụ.
- Xưng "em", gọi khách là "anh/chị". 
- **TÍNH CÁCH:** Tự tin, nhiệt huyết, thân thiện và cực kỳ am hiểu công nghệ. Hãy thể hiện sự hào hứng khi nói về các sản phẩm đỉnh cao.
- Nếu khách khen ngợi hoặc chào hỏi, hãy phản hồi ấm áp và lái câu chuyện sang việc tư vấn sản phẩm.

**QUY TẮC CUNG CẤP THÔNG TIN — BẮT BUỘC TUÂN THỦ:**
- BẮT BUỘC sử dụng "DỮ LIỆU SẢN PHẨM THẬT TỪ DATABASE" (nếu được cung cấp) làm nguồn thông tin DUY NHẤT. TUYỆT ĐỐI KHÔNG được gợi ý, báo giá hay mô tả bất kỳ sản phẩm nào KHÔNG nằm trong danh sách này.
- Nếu không tìm thấy sản phẩm khách yêu cầu trong dữ liệu, hãy lịch sự thông báo rằng "Hiện tại em chưa tìm thấy sản phẩm này trong hệ thống" và gợi ý sản phẩm khác **có sẵn trong dữ liệu** (nếu có). KHÔNG được liệt kê sản phẩm hay link khi không có dữ liệu.
- **⛔ CẤM TUYỆT ĐỐI TỰ TẠO ID:** ID sản phẩm là SỐ NGUYÊN (ví dụ: 1, 5, 42, 100) được ghi rõ là "ID=XXX" trong dữ liệu. KHÔNG ĐƯỢC TỰ NGHĨ RA ID dạng MKE001, SP001, IPHONE15, hay bất kỳ chuỗi chữ-số nào. Làm vậy sẽ gây lỗi 404 nghiêm trọng cho hệ thống.
- **LINK HÀNH ĐỘNG:** Chỉ được đặt link khi có dữ liệu sản phẩm thật. Sao chép CHÍNH XÁC link đã được cung cấp trong dữ liệu (dạng /cart/add/SỐ và /product/SỐ). Không được sửa đổi hay tự tạo link mới.
  - Ví dụ ĐÚNG: [🛒 Thêm Vào Giỏ](/cart/add/42) — với 42 là ID thật từ database
  - Ví dụ SAI: [🛒 Thêm Vào Giỏ](/cart/add/MKE004) — ID bịa đặt, gây lỗi 404
- **ĐỊNH DẠNG SỐ:** Luôn hiển thị GIÁ dưới dạng số nguyên có dấu chấm phân cách (ví dụ: 10.000.000 ₫). Làm tròn số nếu cần.
- Nếu dữ liệu có nhiều sản phẩm, hãy tóm tắt và so sánh chúng trong một **bảng Markdown** để khách dễ nhìn.
- Nếu sản phẩm HẾT HÀNG, hãy khéo léo gợi ý sản phẩm khác cùng tầm giá hoặc cùng danh mục (chỉ lấy từ dữ liệu được cung cấp).

**CHIẾN LƯỢC BÁN HÀNG:**
- Đây là phản hồi thứ ${messageCount} trong cuộc hội thoại.
- Nếu cuộc hội thoại kéo dài (>5 tin nhắn), hãy chủ động đưa ra các ưu đãi (ví dụ: Miễn phí vận chuyển cho đơn trên 1 triệu) hoặc đề nghị khách chốt đơn.
- LUÔN khuyến khích khách hàng thêm sản phẩm vào giỏ hàng để nhận ưu đãi MindCard.

**ĐỊNH DẠNG PHẢN HỒI - CỰC KỲ QUAN TRỌNG:**
- **TUYỆT ĐỐI KHÔNG** viết một đoạn văn dài liên tục. Hãy LUÔN chia phản hồi thành các đoạn nhỏ, ngăn cách nhau bằng **DÒNG TRỐNG** (2 xuống dòng liên tiếp).
- Mỗi đoạn tối đa 3-4 câu, có chủ đề rõ ràng.
- **Cấu trúc gợi ý:**
  1. Lời chào/mở đầu ngắn (1 câu)
  2. Thông tin sản phẩm (dạng bảng markdown nếu nhiều sản phẩm - CHỈ KHI CÓ DỮ LIỆU)
  3. Nhận xét/tư vấn (1-2 câu)
  4. Kêu gọi hành động (1 câu)
- Phản hồi KHÔNG ĐƯỢC chứa code block hay JSON.
- **TUYỆT ĐỐI KHÔNG** được thêm các đoạn mã hay tag [SUGGESTION: ...] vào cuối phản hồi.
- Nếu không có dữ liệu sản phẩm đi kèm, TUYỆT ĐỐI KHÔNG được liệt kê sản phẩm hay báo giá. Hãy trả lời thân thiện và gợi ý khách thử tìm kiếm với từ khóa khác.`;

  if (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      prompt += `\n\n**THÔNG TIN KHÁCH HÀNG ĐANG TRÒ CHUYỆN:**\n`;
      prompt += `- Tên: ${user.username}\n`;

      // Kiểm tra phòng vệ: Đảm bảo ai_memory là Mảng trước khi join
      const memory = Array.isArray(user.ai_memory) ? user.ai_memory : [];
      if (memory.length > 0) {
        prompt += `- Ghi chú về sở thích: ${memory.join(", ")}. Hãy tinh tế nhắc lại các sở thích này để tăng thiện cảm.`;
      }
    }
  }

  return prompt;
}

/**
 * Update User Memory
 */
async function updateUserMemory(userId, message) {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const lowerMsg = message.toLowerCase();
    const stopwords = [
      "tôi",
      "bạn",
      "của",
      "và",
      "là",
      "có",
      "không",
      "cho",
      "được",
      "với",
      "về",
      "tìm",
      "giá",
      "mua",
      "bao nhiêu",
    ];
    const words = lowerMsg.split(/\s+/);
    const newKeywords = words.filter(
      (w) => (w.length >= 3 || /^\d+$/.test(w)) && !stopwords.includes(w),
    );

    if (newKeywords.length === 0) return;

    // Đảm bảo lấy được mảng hiện tại, tránh lỗi nếu DB trả về null hoặc chuỗi
    let currentMemory = Array.isArray(user.ai_memory) ? user.ai_memory : [];
    let combined = [...currentMemory, ...newKeywords];
    let uniqueMemory = [...new Set(combined)];
    user.ai_memory = uniqueMemory.slice(-20); // Lưu 20 keyword gần nhất
    await user.save();
  } catch (e) {
    console.error("[AI Memory Error]", e);
  }
}

routerInstance.post("/", async (req, res) => {
  try {
    const { message, history, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Nội dung tin nhắn rỗng" });
    }

    const apiKey = process.env.GEMINI_API_KEY_1;
    if (!apiKey) {
      return res.status(500).json({ error: "Lỗi cấu hình AI Key." });
    }

    // Tích hợp RAG Context
    const productContext = await retrieveRelevantProducts(message);
    const finalMessage = productContext
      ? `[DỮ LIỆU DATABASE]:\n${productContext}\n\nYêu cầu của khách: ${message}`
      : message;

    // Lịch sử & Thống kê
    const formattedHistory = Array.isArray(history) ? history : [];
    const messageCount =
      formattedHistory.filter((m) => m.role === "user").length + 1;

    // Xây dựng System Instruction & Cập nhật Memory
    const systemInstruction = await buildSystemInstruction(
      userId,
      messageCount,
    );
    if (userId) await updateUserMemory(userId, message);

    // Khởi tạo Gemini (Sử dụng model ổn định 3.5-flash)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.75,
      },
    });

    const result = await chat.sendMessage(finalMessage);
    const responseText = result.response.text();

    // Log finish reason to debug truncation
    const candidate = result.response.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.warn(
        `[Chatbot] ⚠️ Response stopped early. finishReason: ${finishReason}, tokens used: ${result.response.usageMetadata?.totalTokenCount}`,
      );
    }

    res.json({ reply: responseText });
  } catch (error) {
    console.error("[Gemini API ERROR DETAILS]:", {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || error,
    });

    // Xử lý các lỗi phổ biến từ Google API
    if (error.message && error.message.includes("404")) {
      return res.status(500).json({
        error:
          "Lỗi AI: Không tìm thấy Model (404). Có thể model gemini-1.5-flash chưa khả dụng với Key của bạn hoặc bạn cần đổi sang gemini-1.5-pro.",
      });
    }

    if (error.message && error.message.includes("API_KEY_INVALID")) {
      return res.status(500).json({
        error: "Lỗi hệ thống: AI Key không hợp lệ. Vui lòng kiểm tra file .env",
      });
    }

    res.status(500).json({
      error:
        "Kết nối AI đang quá tải, em sẽ quay lại tư vấn cho anh/chị ngay nhé!",
    });
  }
});

module.exports = routerInstance;
