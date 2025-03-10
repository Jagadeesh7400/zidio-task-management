import axios from "axios"

// Create an axios instance
const api = axios.create({
  baseURL: process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth services
export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  signup: (userData) => api.post("/auth/signup", userData),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  getCurrentUser: () => api.get("/auth/me"),
}

// User services
export const userService = {
  getProfile: (userId) => api.get(`/user/${userId}`),
  updateProfile: (userId, userData) => api.put(`/user/${userId}`, userData),
  uploadProfilePhoto: (formData) =>
    api.post("/user/profile-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
}

// Task services
export const taskService = {
  getUserTasks: (userId) => api.get(`/tasks/user/${userId}`),
  getTask: (taskId) => api.get(`/tasks/${taskId}`),
  createTask: (taskData) => api.post("/tasks", taskData),
  updateTask: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  completeTask: (taskId) => api.put(`/tasks/${taskId}/complete`),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  archiveTask: (taskId) => api.put(`/tasks/${taskId}/archive`),
  markImportant: (taskId) => api.put(`/tasks/${taskId}/important`),
}

// Admin services
export const adminService = {
  getDashboardStats: () => api.get("/admin/dashboard"),
  getAllUsers: () => api.get("/admin/users"),
  getAllTasks: () => api.get("/admin/tasks"),
  createUser: (userData) => api.post("/admin/users", userData),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
}

// Notification services
export const notificationService = {
  getUserNotifications: (userId) => api.get(`/notifications/${userId}`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/read-all/${userId}`),
}

// Stats services
export const statsService = {
  getTaskCompletionStats: (userId) => api.get(`/stats/task-completion/${userId}`),
  getTaskDistribution: (userId) => api.get(`/stats/task-distribution/${userId}`),
}

// Export services
export const exportService = {
  exportUsersCSV: () => api.get("/export/users/csv", { responseType: "blob" }),
  exportUsersPDF: () => api.get("/export/users/pdf", { responseType: "blob" }),
  exportTasksCSV: () => api.get("/export/tasks/csv", { responseType: "blob" }),
  exportTasksPDF: () => api.get("/export/tasks/pdf", { responseType: "blob" }),
}

export default api

