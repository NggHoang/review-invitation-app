// server.js - Hoàn chỉnh cho hệ thống thư mời
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");

// Import models
const Template = require('./models/Template');
const Company = require('./models/Company');
const Invite = require('./models/Invite');

const app = express();

// Cấu hình cho môi trường production
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/invitation_db';

// Kết nối MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Đã kết nối MongoDB thành công'))
.catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Cấu hình CORS cho production
const corsOptions = {
  origin: ['https://reviewbds.com.vn', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("public"));

// Tải danh sách mẫu
app.get("/api/templates", async (req, res) => {
  try {
    const templates = await Template.find();
    res.json(templates);
  } catch (err) {
    res.status(500).send("Lỗi đọc templates.");
  }
});

// Toggle mẫu
app.post("/api/templates/:index/toggle", async (req, res) => {
  try {
    const template = await Template.findById(req.params.index);
    if (!template) return res.status(404).send("Không tìm thấy mẫu.");
    
    template.active = !template.active;
    await template.save();
    res.send("Đã cập nhật.");
  } catch (err) {
    res.status(500).send("Lỗi cập nhật template.");
  }
});

// Ghi nhận lượt tải
app.post("/api/templates/:index/download", async (req, res) => {
  try {
    const template = await Template.findById(req.params.index);
    if (!template) return res.status(404).send("Không tìm thấy mẫu.");
    
    template.downloads = (template.downloads || 0) + 1;
    await template.save();
    res.send("Đã cập nhật lượt tải.");
  } catch (err) {
    res.status(500).send("Lỗi cập nhật lượt tải.");
  }
});

// Danh sách công ty
app.get("/api/companies", async (req, res) => {
  try {
    const companies = await Company.find().sort('name');
    res.json(companies.map(c => c.name));
  } catch (err) {
    res.status(500).send([]);
  }
});

// Thêm công ty mới
app.post("/api/companies/add", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Thiếu tên công ty.");
  
  try {
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.send("Công ty đã tồn tại.");
    }
    
    const company = new Company({ name });
    await company.save();
    res.send("Đã thêm công ty.");
  } catch (err) {
    res.status(500).send("Lỗi thêm công ty.");
  }
});

// Upload template image
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/assets/templates"),
    filename: (req, file, cb) => cb(null, req.body.file)
  })
});

app.post("/api/templates/upload", upload.single("image"), async (req, res) => {
  const { name, file } = req.body;
  if (!name || !file || !req.file) return res.status(400).send("Thiếu thông tin hoặc file.");
  
  try {
    const template = new Template({ name, file, active: true, downloads: 0 });
    await template.save();
    res.redirect("/admin.html");
  } catch (err) {
    res.status(500).send("Lỗi thêm template.");
  }
});

// API xoá mẫu
app.delete("/api/templates/:index", async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.index);
    if (!template) return res.status(404).send("Không tìm thấy mẫu.");
    res.send("Đã xoá.");
  } catch (err) {
    res.status(500).send("Lỗi xoá template.");
  }
});

// API sửa mẫu
app.put("/api/templates/:index", async (req, res) => {
  const { field, value } = req.body;
  if (!['name', 'file'].includes(field)) return res.status(400).send("Không hợp lệ.");

  try {
    const template = await Template.findById(req.params.index);
    if (!template) return res.status(404).send("Không tìm thấy mẫu.");
    
    template[field] = value;
    await template.save();
    res.send("Đã cập nhật.");
  } catch (err) {
    res.status(500).send("Lỗi cập nhật template.");
  }
});

// Lưu thông tin thư mời
app.post("/api/save-invite", async (req, res) => {
  try {
    const invite = new Invite(req.body);
    await invite.save();
    res.send("Đã lưu thông tin thư mời.");
  } catch (err) {
    res.status(500).send("Lỗi lưu thông tin thư mời.");
  }
});

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).send('Không tìm thấy trang');
});

// Xử lý lỗi server
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Có lỗi xảy ra!');
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại port ${PORT}`);
  console.log(`✅ Môi trường: ${process.env.NODE_ENV || 'development'}`);
});
