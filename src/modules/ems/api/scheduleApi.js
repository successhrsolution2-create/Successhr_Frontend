import emsAxios from './emsAxios'

export const scheduleApi = {
  list: (params) => emsAxios.get('/schedules', { params }),
  create: (payload) => emsAxios.post('/schedules', payload),
  update: (id, payload) => emsAxios.put(`/schedules/${id}`, payload),
  remove: (id) => emsAxios.delete(`/schedules/${id}`),
  employee: (id) => emsAxios.get(`/schedules/employee/${id}`)
}
