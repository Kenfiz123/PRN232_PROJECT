import apiClient from './apiClient'

export const authApi = {
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (userData) => 
    apiClient.post('/auth/register', userData),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  refreshToken: () => 
    apiClient.post('/auth/refresh'),
  
  getProfile: () => 
    apiClient.get('/auth/profile'),
  
  updateProfile: (data) => 
    apiClient.put('/auth/profile', data),
  
  changePassword: (data) => 
    apiClient.post('/auth/change-password', data),
}
