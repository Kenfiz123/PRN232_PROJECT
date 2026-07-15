import apiClient from './apiClient'

export const financeApi = {
  getBudgets: (params) => 
    apiClient.get('/finance/budgets', { params }),
  
  getBudgetById: (id) => 
    apiClient.get(`/finance/budgets/${id}`),
  
  createBudget: (data) => 
    apiClient.post('/finance/budgets', data),
  
  updateBudget: (id, data) => 
    apiClient.put(`/finance/budgets/${id}`, data),
  
  approveBudget: (id) => 
    apiClient.post(`/finance/budgets/${id}/approve`),
  
  getTransactions: (params) => 
    apiClient.get('/finance/transactions', { params }),
  
  createTransaction: (data) => 
    apiClient.post('/finance/transactions', data),
  
  getSettlements: (params) => 
    apiClient.get('/finance/settlements', { params }),
  
  createSettlement: (data) => 
    apiClient.post('/finance/settlements', data),
  
  approveSettlement: (id) => 
    apiClient.post(`/finance/settlements/${id}/approve`),
  
  getSummary: () => 
    apiClient.get('/finance/summary'),
}
