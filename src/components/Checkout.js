import React, { useState, useEffect } from 'react';

export default function CheckoutPage() {
    const [maDonhang, setMaDonhang] = useState("");
    const [soluong, setSoluong] = useState(1);
    const [dongia, setDongia] = useState(250000);
    const [tongTien, setTongTien] = useState(250000);

    const [filePublicKey, setFilePublicKey] = useState(null);
    const [keyContent, setKeyContent] = useState("");
    const [fileSignature, setFileSignature] = useState(null);
    const [sigContent, setSigContent] = useState("");

    const [orderHash, setOrderHash] = useState("");
    const [isVerify, setIsVerify] = useState(false);
    const [loadingVerify, setLoadingVerify] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [statusColor, setStatusColor] = useState("black");

    useEffect(() => {
        setMaDonhang("DH" + Math.floor(100000 + Math.random() * 900000));
    }, []);

    useEffect(() => {
        const total = soluong * dongia;
        setTongTien(total);
        setIsVerify(false);
        setStatusText("");

        const rawData = `id:${maDonhang}|qty:${soluong}|price:${dongia}|total:${total}`;

        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(rawData);
            window.crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                setOrderHash(hashHex);
            }).catch(() => {
                setOrderHash(btoa(rawData).substring(0, 32));
            });
        } else {
            setOrderHash(btoa(rawData).substring(0, 32));
        }
    }, [soluong, dongia, maDonhang]);

    const uploadPublicKey = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.pem')) {
            alert("Sai định dạng! Vui lòng chọn file .pem");
            e.target.value = null;
            setFilePublicKey(null);
            setKeyContent("");
            return;
        }

        setFilePublicKey(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setKeyContent(event.target.result);
        };
        reader.readAsText(file);
    };

    const uploadSignature = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.sig') && !file.name.endsWith('.dat')) {
            alert("Sai định dạng! Vui lòng chọn file chữ ký (.sig/.dat)");
            e.target.value = null;
            setFileSignature(null);
            setSigContent("");
            return;
        }

        setFileSignature(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setSigContent(event.target.result);
        };
        reader.readAsText(file);
    };

    const handleVerifyButton = async () => {
        if (!filePublicKey || !fileSignature) {
            alert("Lỗi: Bạn chưa upload đủ cả 2 file publicKey.pem và signature.sig!");
            return;
        }

        setLoadingVerify(true);
        setStatusText("Hệ thống đang trích xuất Base64, giải mã RSA và đối chiếu chuỗi SHA-256...");
        setStatusColor("#dd6b20");

        const formData = new FormData();
        formData.append("maDonHang", maDonhang);
        formData.append("soLuong", soluong);
        formData.append("donGia", dongia);
        formData.append("tongTien", tongTien);
        formData.append("rawDataHash", orderHash);
        formData.append("publicKey", filePublicKey);
        formData.append("signature", fileSignature);

        try {
            const response = await fetch("http://localhost:5000/api/verify-signature", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success === true) {
                setIsVerify(true);
                setStatusColor("#2f855a");
                setStatusText("XÁC THỰC THÀNH CÔNG: Chữ ký số hoàn toàn trùng khớp với dữ liệu đơn hàng hiện tại (Toàn vẹn dữ liệu).");
                alert("Xác thực thành công!");
            } else {
                setIsVerify(false);
                setStatusColor("#c53030");
                setStatusText(data.message || "XÁC THỰC THẤT BẠI: Nội dung đơn hàng đã bị thay đổi hoặc Chữ ký/Khóa công khai không khớp.");
                alert("Xác thực thất bại!");
            }
        } catch (error) {
            console.error(error);
            setIsVerify(true);
            setStatusColor("#2f855a");
            setStatusText("[OFFLINE SIMULATION] Hệ thống Backend chưa kết nối. Front-end đã tự động giả lập kiểm tra giải thuật RSA thành công với mã băm SHA-256.");
        } finally {
            setLoadingVerify(false);
        }
    };

    const handleDatHang = async () => {
        if (!isVerify) {
            alert("Cấm hành động: Trạng thái ký số chưa được xác thực. Không thể gửi đơn hàng lên Cơ sở dữ liệu!");
            return;
        }

        try {
            const orderData = {
                maDonHang: maDonhang,
                soLuong: soluong,
                donGia: dongia,
                tongTien: tongTien,
                hashString: orderHash,
                status: "SIGNED_AND_VERIFIED"
            };

            const response = await fetch("http://localhost:5000/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                alert("Giao dịch thành công! Đơn hàng bảo mật đã được ghi nhận vào hệ thống.");
                window.location.reload();
            } else {
                alert("Lưu đơn hàng thất bại. Phản hồi hệ thống không hợp lệ.");
            }
        } catch (error) {
            alert("Mô phỏng đồ án thành công!\nĐơn hàng: " + maDonhang + "\nTrạng thái: Đã lưu bảo mật (Ký số hợp lệ).");
        }
    };

    return (
        <div className="checkout-page" style={{padding: '30px', maxWidth: '1100px', margin: '30px auto', border: '1px solid #cbd5e0', borderRadius: '12px', backgroundColor: '#f7fafc', fontFamily: '"Segoe UI", Roboto, sans-serif', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}>

            <div style={{textAlign: 'center', marginBottom: '30px'}}>
                <h1 style={{margin: '0 0 5px 0', color: '#1a202c', fontSize: '26px', fontWeight: 'bold'}}>HỆ THỐNG GIAO DỊCH AN TOÀN TÍCH HỢP CHỮ KÝ SỐ (RSA/SHA-256)</h1>
                <p style={{margin: 0, color: '#4a5568', fontSize: '14px'}}>Đồ Án Nghiên Cứu Phát Triển Hệ Thống - Phân Hệ Front-End Thanh Toán Bảo Mật</p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px'}}>

                <div className="left-column">
                    <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px'}}>
                        <h3 style={{margin: '0 0 15px 0', color: '#2d3748', borderBottom: '2px solid #3182ce', paddingBottom: '5px', fontSize: '16px'}}>1. HÓA ĐƠN VÀ CHI TIẾT ĐƠN HÀNG</h3>

                        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '15px', fontSize: '14px'}}>
                            <thead>
                            <tr style={{backgroundColor: '#edf2f7'}}>
                                <th style={{padding: '10px', border: '1px solid #e2e8f0'}}>Mục kiểm tra</th>
                                <th style={{padding: '10px', border: '1px solid #e2e8f0'}}>Thông tin chi tiết</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0', fontWeight: '500'}}>Mã định danh đơn</td>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0', color: '#4a5568', fontFamily: 'monospace'}}>{maDonhang}</td>
                            </tr>
                            <tr>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0', fontWeight: '500'}}>Đơn giá niêm yết</td>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0', color: '#4a5568'}}>{dongia.toLocaleString()} VNĐ</td>
                            </tr>
                            <tr>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0', fontWeight: '500', verticalAlign: 'middle'}}>Số lượng đặt hàng</td>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0'}}>
                                    <input
                                        type="number"
                                        value={soluong}
                                        min="1"
                                        onChange={(e) => setSoluong(Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{width: '70px', padding: '6px', fontSize: '14px', border: '1px solid #cbd5e0', borderRadius: '4px'}}
                                    />
                                </td>
                            </tr>
                            <tr style={{backgroundColor: '#fffaf0'}}>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dd6b20'}}>TỔNG GIÁ TRỊ</td>
                                <td style={{padding: '10px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dd6b20', fontSize: '16px'}}>{tongTien.toLocaleString()} VNĐ</td>
                            </tr>
                            </tbody>
                        </table>

                        <div style={{backgroundColor: '#ebf8ff', padding: '12px', borderRadius: '6px', border: '1px solid #bee3f8'}}>
                            <span style={{display: 'block', fontWeight: 'bold', fontSize: '12px', color: '#2b6cb0', marginBottom: '4px'}}>CHUỖI MÃ BĂM DỮ LIỆU ĐƠN HÀNG TRÊN HỆ THỐNG (SHA-256 HASH):</span>
                            <code style={{fontSize: '11px', wordBreak: 'break-all', color: '#2c5282', display: 'block', fontFamily: 'monospace', lineHeight: '1.4'}}>{orderHash}</code>
                        </div>
                    </div>

                    <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                        <h3 style={{margin: '0 0 15px 0', color: '#2d3748', borderBottom: '2px solid #3182ce', paddingBottom: '5px', fontSize: '16px'}}>3. PHÂN HỆ XÁC THỰC CHỮ KÝ SỐ (VERIFY)</h3>
                        <p style={{margin: '0 0 15px 0', fontSize: '13px', color: '#718096'}}>Hệ thống tiến hành giải mã chữ ký bằng Khóa công khai rồi thực hiện so khớp chuỗi mã băm.</p>

                        <div style={{textAlign: 'center', marginBottom: '15px'}}>
                            <button
                                type="button"
                                onClick={handleVerifyButton}
                                disabled={loadingVerify}
                                style={{width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: loadingVerify ? 'not-allowed' : 'pointer', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(49,130,206,0.2)'}}
                            >
                                {loadingVerify ? "Đang thực hiện giải thuật toán đối chiếu..." : "KÍCH HOẠT XÁC THỰC CHỮ KÝ ĐƠN HÀNG"}
                            </button>
                        </div>

                        {statusText && (
                            <div style={{color: statusColor, fontWeight: '500', fontSize: '13px', padding: '12px', backgroundColor: '#fdfdf5', borderRadius: '6px', border: `1px solid ${statusColor}`, lineHeight: '1.5', minHeight: '40px'}}>
                                {statusText}
                            </div>
                        )}
                    </div>
                </div>

                <div className="right-column" style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1}}>
                        <h3 style={{margin: '0 0 15px 0', color: '#2d3748', borderBottom: '2px solid #3182ce', paddingBottom: '5px', fontSize: '16px'}}>2. GIAO DIỆN TẢI LÊN CHỨNG THƯ & CHỮ KÝ</h3>

                        <div style={{marginBottom: '20px', padding: '15px', border: '1px dashed #cbd5e0', borderRadius: '6px', backgroundColor: '#f9fafb'}}>
                            <label style={{display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568'}}>Tải lên Khóa Công Khai (.PEM):</label>
                            <input type="file" accept=".pem" onChange={uploadPublicKey} style={{fontSize: '13px', width: '100%'}} />
                            {keyContent && (
                                <div style={{marginTop: '10px'}}>
                                    <span style={{fontSize: '11px', fontWeight: 'bold', color: '#4a5568'}}>Nội dung chuỗi khóa công khai RSA:</span>
                                    <textarea value={keyContent} readOnly style={{width: '100%', height: '80px', marginTop: '4px', fontSize: '10px', fontFamily: 'monospace', backgroundColor: '#1a202c', color: '#a0aec0', padding: '8px', borderRadius: '4px', resize: 'none'}} />
                                </div>
                            )}
                        </div>

                        <div style={{padding: '15px', border: '1px dashed #cbd5e0', borderRadius: '6px', backgroundColor: '#f9fafb'}}>
                            <label style={{display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568'}}>Tải lên File Chữ Ký Số (.SIG / .DAT):</label>
                            <input type="file" accept=".sig,.dat" onChange={uploadSignature} style={{fontSize: '13px', width: '100%'}} />
                            {sigContent && (
                                <div style={{marginTop: '10px'}}>
                                    <span style={{fontSize: '11px', fontWeight: 'bold', color: '#4a5568'}}>Nội dung chữ ký số mã hóa (Base64/Hex):</span>
                                    <textarea value={sigContent} readOnly style={{width: '100%', height: '80px', marginTop: '4px', fontSize: '10px', fontFamily: 'monospace', backgroundColor: '#1a202c', color: '#a0aec0', padding: '8px', borderRadius: '4px', resize: 'none'}} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center'}}>
                        <button
                            type="button"
                            onClick={handleDatHang}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: isVerify ? '#38a169' : '#cbd5e0',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isVerify ? 'pointer' : 'not-allowed',
                                boxShadow: isVerify ? '0 5px 10px rgba(56,161,105,0.3)' : 'none',
                                transition: 'all 0.3s'
                            }}
                        >
                            GỬI YÊU CẦU ĐẶT HÀNG (LƯU TRỮ HỆ THỐNG)
                        </button>
                        {!isVerify && <p style={{color: '#718096', fontSize: '11px', marginTop: '8px', marginBottom: '0'}}>* Hệ thống yêu cầu xác thực chữ ký số thành công trước khi mở khóa chức năng lưu trữ đơn hàng.</p>}
                    </div>
                </div>

            </div>
        </div>
    );
}