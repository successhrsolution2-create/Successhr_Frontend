import emsAxios from './emsAxios'

export const leaveApi = {
  apply: (payload) => emsAxios.post('/leaves/apply', payload),
  list: (params) => emsAxios.get('/leaves', { params }),
  pending: () => emsAxios.get('/leaves/pending'),
  approve: (id, payload) => emsAxios.put(`/leaves/${id}/approve`, payload),
  reject: (id, payload) => emsAxios.put(`/leaves/${id}/reject`, payload),
  balance: (employeeId, params) => emsAxios.get(`/leaves/balance/${employeeId}`, { params })
}
