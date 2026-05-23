import emsAxios from './emsAxios'

export const employeeApi = {
  list: (params) => emsAxios.get('/employees', { params }),
  create: (payload) => emsAxios.post('/employees', payload),
  get: (id) => emsAxios.get(`/employees/${id}`),
  update: (id, payload) => emsAxios.put(`/employees/${id}`, payload),
  remove: (id) => emsAxios.delete(`/employees/${id}`),
  bulkImport: (formData) => emsAxios.post('/employees/bulk-import', formData),
  exportUrl: (params = {}) => `${emsAxios.defaults.baseURL}/employees/export?${new URLSearchParams(params).toString()}`
}
