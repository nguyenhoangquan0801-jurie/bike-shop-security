import React, { useState } from "react";
import { signatureAPI } from "../api/signatureApi";

function VerifyOrderFile() {

const [result, setResult] = useState(null);

const handleFile = async (e) => {

    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text);
    try {
    const response = await signatureAPI.verifyOrderFile(json);
    setResult(response);
    await signatureAPI.updateOrderStatus({ orderId: response.orderId, status: response.valid ? "verified" : "invalid"});
    } catch (err) {
    setResult({ success: false,  message: err.response?.data?.message});
    }
};

return (
<div style={{ padding: 20 }}>
    <h2>Kiểm tra chữ ký đơn hàng</h2>

    <input
    type="file"
    accept=".json"
    onChange={handleFile}
    />

    {result && (
    <div style={{ marginTop: 20 }}>

        {result.valid ? (
        <div
            style={{
            background: "#e8f5e9",
            color: "#2e7d32",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #4caf50"
            }}
        >
            <h3>✅ Chữ ký hợp lệ</h3>
            <p>Đơn hàng #{result.orderId} đã được xác thực.</p>
        </div>
        ) : (
        <div
            style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #f44336"
            }}
        >
            <h3>❌ Chữ ký không hợp lệ</h3>
            <p>Đơn hàng #{result.orderId}</p>
            <p>Vui lòng tạo lại chữ ký và tải lên file mới.</p>
        </div>
        )}

    </div>
    )}

</div>
);
}

export default VerifyOrderFile;