import apiClient from './apiClient'

export const reportsApi = {
  getAll: (params) => 
    apiClient.get('/reports', { params }),
  
  getById: (id) => 
    apiClient.get(`/reports/${id}`),
  
  create: (data) => 
    apiClient.post('/reports', data),
  
  update: (id, data) => 
    apiClient.put(`/reports/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`/reports/${id}`),
  
  submit: (id) => 
    apiClient.post(`/reports/${id}/submit`),
  
  approve: (id, feedback) => 
    apiClient.post(`/reports/${id}/approve`, { feedback }),
  
  reject: (id, feedback) => 
    apiClient.post(`/reports/${id}/reject`, { feedback }),
  
  getAttachments: (reportId) => 
    apiClient.get(`/reports/${reportId}/attachments`),
  
  uploadAttachment: (reportId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/reports/${reportId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  
  getComments: (reportId) => 
    apiClient.get(`/reports/${reportId}/comments`),
  
  addComment: (reportId, content) => 
    apiClient.post(`/reports/${reportId}/comments`, { content }),
}
