import emsAxios from './emsAxios'

export const locationApi = {
  list: (params) => emsAxios.get('/locations', { params }),
  create: (payload) => emsAxios.post('/locations', payload),
  update: (id, payload) => emsAxios.put(`/locations/${id}`, payload),
  remove: (id) => emsAxios.delete(`/locations/${id}`),
  validate: (id, params) => emsAxios.get(`/locations/${id}/validate`, { params })
}
