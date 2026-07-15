import apiClient from './apiClient'

export const activitiesApi = {
  getAll: (params) => 
    apiClient.get('/activities', { params }),
  
  getById: (id) => 
    apiClient.get(`/activities/${id}`),
  
  create: (data) => 
    apiClient.post('/activities', data),
  
  update: (id, data) => 
    apiClient.put(`/activities/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`/activities/${id}`),
  
  getParticipants: (activityId) => 
    apiClient.get(`/activities/${activityId}/participants`),
  
  addParticipant: (activityId, userId) => 
    apiClient.post(`/activities/${activityId}/participants`, { userId }),
  
  removeParticipant: (activityId, userId) => 
    apiClient.delete(`/activities/${activityId}/participants/${userId}`),
  
  updateAttendance: (activityId, participantId, status) => 
    apiClient.patch(`/activities/${activityId}/participants/${participantId}`, { status }),
}
