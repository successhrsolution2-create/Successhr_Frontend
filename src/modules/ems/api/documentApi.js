import emsAxios from './emsAxios'

export const documentApi = {
  upload: (formData) => emsAxios.post('/documents/upload', formData),
  employee: (id) => emsAxios.get(`/documents/employee/${id}`),
  remove: (id) => emsAxios.delete(`/documents/${id}`)
}
