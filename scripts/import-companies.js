const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Company = require('../models/Company');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/invitation_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Đã kết nối MongoDB thành công'))
.catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Đọc file JSON
const companies = JSON.parse(fs.readFileSync(path.join(__dirname, '../companies.json'), 'utf8'));

// Hàm import dữ liệu
async function importCompanies() {
  try {
    // Xóa tất cả công ty cũ
    await Company.deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ');

    // Loại bỏ các công ty trùng tên
    const uniqueCompanies = [...new Set(companies)];
    console.log(`Tổng số công ty sau khi loại bỏ trùng lặp: ${uniqueCompanies.length}`);

    // Thêm các công ty mới
    const companiesToInsert = uniqueCompanies.map(name => ({ name }));
    await Company.insertMany(companiesToInsert);
    console.log(`✅ Đã import ${uniqueCompanies.length} công ty thành công`);

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối MongoDB');
  } catch (err) {
    console.error('❌ Lỗi import:', err);
    process.exit(1);
  }
}

// Chạy import
importCompanies(); 