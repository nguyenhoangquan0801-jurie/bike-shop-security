import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 5000
});

export const signatureAPI = {
  verifySignature: async (payload) => {
    const response =await api.post( "/verify-signature",payload);
    return response.data;
  },

  createOrder: async (payload) => { const response = await api.post("/create-order",payload);
    return response.data;
  },

  verifyOrderFile: async (payload) => {
  const response = await api.post("/verify-order-file",payload);
  return response.data;
  },
  updateOrderStatus: async (payload) => {
  const response = await api.post("/update-order-status", payload);
  return response.data;
  },
};

