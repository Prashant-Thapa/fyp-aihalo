import api from "./axios";

// Get all stock alerts
export const getStockAlerts = async () => {
  const response = await api.get("/stock-alerts");
  return response.data;
};

// Mark single alert as read
export const markAlertRead = async (id) => {
  const response = await api.put(`/stock-alerts/${id}/read`);
  return response.data;
};

// Mark all alerts as read
export const markAllAlertsRead = async () => {
  const response = await api.put("/stock-alerts/read-all");
  return response.data;
};
