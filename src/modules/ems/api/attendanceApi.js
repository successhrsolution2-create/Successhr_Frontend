import emsAxios from './emsAxios'

export const attendanceApi = {
  checkIn: (payload) => emsAxios.post('/attendance/check-in', payload),
  checkOut: (payload) => emsAxios.post('/attendance/check-out', payload),
  today: () => emsAxios.get('/attendance/today'),
  todayForEmployee: (employeeId) => emsAxios.get(`/attendance/today/${employeeId}`),
  status: (employeeId) => emsAxios.get(`/attendance/status/${employeeId}`),
  all: (params) => emsAxios.get('/attendance/all', { params }),
  employee: (id, params) => emsAxios.get(`/attendance/employee/${id}`, { params }),
  report: (params) => emsAxios.get('/attendance/report', { params }),
  override: (id, payload) => emsAxios.put(`/attendance/${id}/override`, payload)
}
