// backend/server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json()); 

console.log('=== BACKEND STARTUP ===');
console.log('PORT:', PORT);
console.log('GMAIL_USER exists?', !!process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD exists?', !!process.env.GMAIL_APP_PASSWORD);

// Thêm middleware debug để xem request
app.use((req, res, next) => {
  console.log(` ${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Headers:', req.headers['content-type']);
  console.log('Body:', req.body);
  next();
});

// Tạo transporter cho Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// API gửi email chào mừng
app.post('/send-welcome-email', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    // Kiểm tra body tồn tại
    if (!req.body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request body is missing' 
      });
    }
    
    const { email, name } = req.body;
    
    console.log('Extracted email:', email, 'name:', name);
    
    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin email hoặc tên' 
      });
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Bike Shop" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Chào mừng đến với Bike Shop!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2c3e50, #3498db); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;"> Bike Shop</h1>
            <p style="opacity: 0.9;">Chuyên xe đạp chất lượng cao</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #2c3e50;">Xin chào ${name}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #e74c3c;">Bike Shop</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db;">
              <p> <strong>Tài khoản của bạn đã được tạo thành công!</strong></p>
              <p>Bây giờ bạn có thể:</p>
              <ul>
                <li> Mua sắm các sản phẩm xe đạp chất lượng</li>
                <li> Lưu sản phẩm yêu thích</li>
                <li> Theo dõi đơn hàng của bạn</li>
                <li> Đánh giá sản phẩm đã mua</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/products" 
                style="background: linear-gradient(135deg, #3498db, #2c3e50); 
                        color: white; padding: 15px 40px; 
                        text-decoration: none; border-radius: 25px;
                        display: inline-block; font-weight: bold;">
                BẮT ĐẦU MUA SẮM NGAY
              </a>
            </div>
            
            <div style="border-top: 1px dashed #ddd; padding-top: 20px; color: #7f8c8d;">
              <p><small>Email này được gửi tự động, vui lòng không trả lời.</small></p>
              <p><small>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.</small></p>
            </div>
          </div>
          
          <div style="background: #2c3e50; color: white; padding: 20px; 
                    text-align: center; border-radius: 0 0 10px 10px; font-size: 14px;">
            <p> <strong>Bike Shop</strong></p>
            <p> 17 đường Linh Xuân, Thủ Đức, TP.HCM</p>
            <p> 0702972210 | ✉️ support@bikeshop.com</p>
            <p>© ${new Date().getFullYear()} Bike Shop. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      `
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(` Email đã gửi đến ${email}: ${info.messageId}`);
    
    res.json({ 
      success: true, 
      message: 'Email chào mừng đã được gửi thành công',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error(' Lỗi gửi email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể gửi email',
      error: error.message 
    });
  }
});

// API kiểm tra server
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Bike Shop Email Service',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      sendEmail: 'POST /send-welcome-email'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Bike Shop Email Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      sendEmail: 'POST /send-welcome-email'
    }
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`\n=== BIKE SHOP EMAIL SERVER ===`);
  console.log(` Server đang chạy trên http://localhost:${PORT}`);
  console.log(` API gửi email: POST http://localhost:${PORT}/send-welcome-email`);
  console.log(` Health check: GET http://localhost:${PORT}/health\n`);
});