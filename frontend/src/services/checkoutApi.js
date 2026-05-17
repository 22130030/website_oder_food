import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

export const checkout = async (payload, token) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await axios.post(`${API_URL}/user/checkout`, payload, {
    headers
  });

  return res.data;
};