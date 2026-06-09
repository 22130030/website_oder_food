import axios from "axios";

const API_URL = "http://localhost:8080/api/user/orders";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getMyOrders = async () => {
  const res = await axios.get(API_URL, getAuthHeader());
  return res.data;
};

export const getOrderDetail = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, getAuthHeader());
  return res.data;
};

export const cancelOrder = async (id, cancelReason) => {
  const res = await axios.patch(
    `${API_URL}/${id}/cancel`,
    {
      cancelReason,
    },
    getAuthHeader()
  );

  return res.data;
};

export const createReview = async (payload) => {
  const res = await axios.post(
    "http://localhost:8080/api/user/reviews",
    payload,
    getAuthHeader()
  );

  return res.data;
};