import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data)

export const logout = () =>
  api.post('/auth/logout').then(r => r.data)

export const getMe = () =>
  api.get('/auth/me').then(r => r.data)

// Leads
export const getLeads = (params = {}) =>
  api.get('/leads', { params }).then(r => r.data)

export const createLead = (data) =>
  api.post('/leads', data).then(r => r.data)

export const updateLead = (id, data) =>
  api.put(`/leads/${id}`, data).then(r => r.data)

export const deleteLead = (id) =>
  api.delete(`/leads/${id}`).then(r => r.data)

export default api
