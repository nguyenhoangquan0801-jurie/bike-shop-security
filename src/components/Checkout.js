import React, { useState } from 'react';
import './Checkout.css';
import { signatureAPI } from "../api/signatureApi";
import {signData, verifyData} from "../crypto/rsaService";

function Checkout({ cart, total, onClose, onConfirmOrder }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    paymentMethod: 'cod',
    note: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }
    
    if (!formData.email.trim()) { newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone.trim()) { newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!formData.address.trim()) { newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    if (!formData.city.trim()) { newErrors.city = 'Vui lòng nhập thành phố';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formErrors = validateForm();

  if (Object.keys(formErrors).length > 0) {
    setErrors(formErrors);
    return;
  }

  setIsSubmitting(true);

  try {

  const privateKey = localStorage.getItem("privateKey");
  const publicKey = localStorage.getItem("publicKey");

  if (!privateKey || !publicKey) { alert( "Bạn chưa tạo RSA Key" );
    setIsSubmitting(false);
    return;
  }

  const quantity = cart.reduce( (sum, item) => sum + item.quantity, 0);
  const price = total;
  const orderId = Date.now().toString();
  console.log(JSON.stringify(cart,null,2));
  const productIds = cart.map(item => item.id).join(",");
  const normalizedItems = cart.map(i => ({id: i.id,quantity: i.quantity, price: i.price}));

  const dataToSign = JSON.stringify({orderId, items: normalizedItems, quantity, price});
  console.log("FRONTEND DATA =", dataToSign);
  console.log("PRODUCT IDS =", productIds);

  const signature = signData( privateKey, dataToSign );
  console.log("Verify frontend:",verifyData( publicKey, dataToSign, signature));

  const signatureFile = { orderId, items: normalizedItems, quantity, price, publicKey, signature };
  console.log("SIGNATURE FILE =", signatureFile);
  const blob = new Blob( [JSON.stringify( signatureFile,null, 2 )],
      {
        type: "application/json"
      }
    );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signature_New_${orderId}.json`;
  a.click();
  URL.revokeObjectURL(url);
  const result = await signatureAPI.createOrder({ orderId, items: normalizedItems, quantity, price, publicKey, signature});

  console.log(result);
  setIsSubmitting(false);
  onConfirmOrder(formData);
  onClose();

}catch(error){
  console.error("FULL ERROR:", error);

  if(error.response){
    console.log("STATUS:", error.response.status);
    console.log("DATA:", error.response.data);
  }

  setIsSubmitting(false);
}
};

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-checkout-btn" onClick={onClose}>×</button>
        
        <h2>Thông tin thanh toán</h2>
        
        <div className="checkout-container">
          {/* Order Summary */}
          <div className="order-summary">
            <h3>Đơn hàng của bạn</h3>
            <div className="summary-items">
              {cart.map((item) => (
                <div key={item.cartId} className="summary-item">
                  <span className="summary-item-name">{item.name} × {item.quantity}</span>
                  <span className="summary-item-price">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <span>Tổng cộng:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? 'error' : ''}
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="example@email.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                  placeholder="0901234567"
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={errors.address ? 'error' : ''}
                placeholder="Số nhà, đường, phường/xã"
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="city">Thành phố/Tỉnh *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? 'error' : ''}
                placeholder="Hà Nội"
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Phương thức thanh toán</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                <option value="banking">Chuyển khoản ngân hàng</option>
                <option value="momo">Ví MoMo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="note">Ghi chú (tùy chọn)</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Ghi chú thêm về đơn hàng..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={onClose}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Checkout;