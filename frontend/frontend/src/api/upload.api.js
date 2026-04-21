import axios from "./axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


export const uploadPhoto = async (file) => {
  try {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await axios.post(`${API_URL}/upload/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};


export const uploadPhotos = async (files) => {
  try {
    const uploadPromises = Array.from(files).map((file) => uploadPhoto(file));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw error;
  }
};


export const deletePhoto = async (filename) => {
  try {
    const response = await axios.delete(`${API_URL}/upload/delete/${filename}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
