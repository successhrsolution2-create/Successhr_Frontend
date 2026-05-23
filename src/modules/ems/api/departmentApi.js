import emsAxios from './emsAxios'

export const departmentApi = {
  list: (params) => emsAxios.get('/departments', { params }),
  create: (payload) => emsAxios.post('/departments', payload),
  update: (id, payload) => emsAxios.put(`/departments/${id}`, payload),
  remove: (id) => emsAxios.delete(`/departments/${id}`)
}
