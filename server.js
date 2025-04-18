// server.js - Hoàn chỉnh cho hệ thống thư mời
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = 3000;

const TEMPLATE_PATH = path.join(__dirname, "templates.json");
const COMPANY_PATH = path.join(__dirname, "companies.json");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Tải danh sách mẫu
app.get("/api/templates", (req, res) => {
  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Lỗi đọc templates.");
    res.json(JSON.parse(data));
  });
});

// Toggle mẫu
app.post("/api/templates/:index/toggle", (req, res) => {
  const index = parseInt(req.params.index);
  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Lỗi đọc templates.");
    const templates = JSON.parse(data);
    if (!templates[index]) return res.status(404).send("Không tìm thấy mẫu.");
    templates[index].active = !templates[index].active;
    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), err => {
      if (err) return res.status(500).send("Lỗi ghi templates.");
      res.send("Đã cập nhật.");
    });
  });
});

// Thêm mẫu mới
app.post("/api/templates/add", (req, res) => {
  const { name, file } = req.body;
  if (!name || !file) return res.status(400).send("Thiếu thông tin.");
  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    const templates = err ? [] : JSON.parse(data);
    templates.push({ name, file, active: true, downloads: 0 });
    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), err => {
      if (err) return res.status(500).send("Lỗi ghi file.");
      res.send("Đã thêm mẫu mới.");
    });
  });
});

// Ghi nhận lượt tải
app.post("/api/templates/:index/download", (req, res) => {
  const index = parseInt(req.params.index);
  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    const templates = JSON.parse(data);
    if (!templates[index]) return res.status(404).send("Không tìm thấy mẫu.");
    templates[index].downloads = (templates[index].downloads || 0) + 1;
    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), err => {
      if (err) return res.status(500).send("Lỗi ghi file.");
      res.send("Đã cập nhật lượt tải.");
    });
  });
});

// Danh sách công ty
app.get("/api/companies", (req, res) => {
  const COMPANIES_PATH = "./companies.json";

  fs.readFile(COMPANIES_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send([]);
    try {
      const companies = JSON.parse(data);
      res.json(companies);
    } catch {
      res.status(500).send([]);
    }
  });
});

// Thêm công ty mới
app.post("/api/companies/add", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Thiếu tên công ty.");
  fs.readFile(COMPANY_PATH, "utf8", (err, data) => {
    let companies = err ? [] : JSON.parse(data);
    if (!companies.includes(name)) {
      companies.push(name);
      fs.writeFile(COMPANY_PATH, JSON.stringify(companies, null, 2), err => {
        if (err) return res.status(500).send("Lỗi ghi công ty.");
        res.send("Đã thêm công ty.");
      });
    } else {
      res.send("Công ty đã tồn tại.");
    }
  });
});

// Upload template image (nếu dùng)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/assets/templates"),
    filename: (req, file, cb) => cb(null, req.body.file)
  })
});

app.post("/api/templates/upload", upload.single("image"), (req, res) => {
  const { name, file } = req.body;
  if (!name || !file || !req.file) return res.status(400).send("Thiếu thông tin hoặc file.");
  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    const templates = err ? [] : JSON.parse(data);
    templates.push({ name, file, active: true, downloads: 0 });
    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), err => {
      if (err) return res.status(500).send("Lỗi ghi file.");
      res.redirect("/admin.html");
    });
  });
});
app.post("/api/templates/add", (req, res) => {
  const { name, file } = req.body;
  if (!name || !file) return res.status(400).send("Thiếu thông tin.");

  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Lỗi đọc file.");
    const templates = JSON.parse(data);
    templates.push({ name, file, active: true });

    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), (err) => {
      if (err) return res.status(500).send("Lỗi ghi file.");
      res.send("Đã thêm mẫu mới.");
    });
  });
});
// API xoá mẫu
app.delete("/api/templates/:index", (req, res) => {
  const index = parseInt(req.params.index);
  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Lỗi đọc file.");
    const templates = JSON.parse(data);
    if (!templates[index]) return res.status(404).send("Không tìm thấy mẫu.");
    templates.splice(index, 1);
    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), (err) => {
      if (err) return res.status(500).send("Lỗi ghi file.");
      res.send("Đã xoá.");
    });
  });
});

// API sửa mẫu
app.put("/api/templates/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const { field, value } = req.body;

  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Lỗi đọc file.");
    const templates = JSON.parse(data);
    if (!templates[index] || !['name', 'file'].includes(field)) return res.status(400).send("Không hợp lệ.");

    templates[index][field] = value;
    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), (err) => {
      if (err) return res.status(500).send("Lỗi ghi file.");
      res.send("Đã cập nhật.");
    });
  });
});
app.post("/api/templates/:index/download", (req, res) => {
  const index = parseInt(req.params.index);

  fs.readFile(TEMPLATE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Lỗi đọc file.");
    const templates = JSON.parse(data);
    if (!templates[index]) return res.status(404).send("Không tìm thấy mẫu.");

    templates[index].downloads = (templates[index].downloads || 0) + 1;

    fs.writeFile(TEMPLATE_PATH, JSON.stringify(templates, null, 2), (err) => {
      if (err) return res.status(500).send("Lỗi ghi file.");
      res.send("Đã cập nhật lượt tải.");
    });
  });
});
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
