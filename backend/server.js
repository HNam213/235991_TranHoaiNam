
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Schema món ăn
const foodSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      required: [true, "Mã món ăn là bắt buộc"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Tên món ăn là bắt buộc"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Loại món ăn là bắt buộc"],
      trim: true,
    },
    cuisine: {
      type: String,
      required: [true, "Vùng miền hoặc ẩm thực là bắt buộc"],
      trim: true,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Giá bán là bắt buộc"],
      min: [0, "Giá bán không được âm"],
    },
    quantity: {
      type: Number,
      required: [true, "Số lượng là bắt buộc"],
      min: [0, "Số lượng không được âm"],
      validate: {
        validator: Number.isInteger,
        message: "Số lượng phải là số nguyên",
      },
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const Food = mongoose.model("Food", foodSchema, "foods");

// Kiểm tra trạng thái backend
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Lấy danh sách và tìm kiếm món ăn
app.get("/api/foods", async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const keyword = search.trim();
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedKeyword, "i");

      filter.$or = [
        { name: regex },
        { category: regex },
        { cuisine: regex },
      ];
    }

    const foods = await Food.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    next(error);
  }
});

// Xem chi tiết món ăn theo MongoDB _id hoặc foodId
app.get("/api/foods/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let food;

    if (mongoose.isValidObjectId(id)) {
      food = await Food.findById(id);
    } else {
      food = await Food.findOne({ foodId: id });
    }

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    res.status(200).json({ success: true, data: food });
  } catch (error) {
    next(error);
  }
});

// Thêm món ăn
app.post("/api/foods", async (req, res, next) => {
  try {
    const food = await Food.create(req.body);

    res.status(201).json({
      success: true,
      message: "Thêm món ăn thành công",
      data: food,
    });
  } catch (error) {
    next(error);
  }
});

// Cập nhật món ăn
app.put("/api/foods/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Không cho phép cập nhật _id
    delete updateData._id;

    let food;

    if (mongoose.isValidObjectId(id)) {
      food = await Food.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      food = await Food.findOneAndUpdate({ foodId: id }, updateData, {
        new: true,
        runValidators: true,
      });
    }

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật món ăn thành công",
      data: food,
    });
  } catch (error) {
    next(error);
  }
});

// Xóa món ăn
app.delete("/api/foods/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let food;

    if (mongoose.isValidObjectId(id)) {
      food = await Food.findByIdAndDelete(id);
    } else {
      food = await Food.findOneAndDelete({ foodId: id });
    }

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa món ăn thành công",
      data: food,
    });
  } catch (error) {
    next(error);
  }
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Mã món ăn foodId đã tồn tại",
    });
  }

  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: err.message,
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "JSON đầu vào không hợp lệ",
    });
  }

  res.status(500).json({
    success: false,
    message: "Lỗi máy chủ hoặc kết nối cơ sở dữ liệu",
  });
});

// Kết nối MongoDB và khởi động server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Chưa cấu hình biến môi trường MONGODB_URI");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Không thể khởi động backend:", error.message);
    process.exit(1);
  }
}

startServer();
