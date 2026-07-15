import apiClient from './apiClient'

export const clubsApi = {
  getAll: (params) => 
    apiClient.get('/clubs', { params }),
  
  getById: (id) => 
    apiClient.get(`/clubs/${id}`),
  
  create: (data) => 
    apiClient.post('/clubs', data),
  
  update: (id, data) => 
    apiClient.put(`/clubs/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`/clubs/${id}`),
  
  getMembers: (clubId, params) => 
    apiClient.get(`/clubs/${clubId}/members`, { params }),
  
  addMember: (clubId, userId) => 
    apiClient.post(`/clubs/${clubId}/members`, { userId }),
  
  removeMember: (clubId, userId) => 
    apiClient.delete(`/clubs/${clubId}/members/${userId}`),
  
  getActivities: (clubId, params) => 
    apiClient.get(`/clubs/${clubId}/activities`, { params }),
  
  getReports: (clubId, params) => 
    apiClient.get(`/clubs/${clubId}/reports`, { params }),
}
