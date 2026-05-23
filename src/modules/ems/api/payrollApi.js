import emsAxios from './emsAxios'

export const payrollApi = {
  generate: (payload) => emsAxios.post('/payroll/generate', payload),
  list: (params) => emsAxios.get('/payroll', { params }),
  employee: (id) => emsAxios.get(`/payroll/employee/${id}`),
  release: (id) => emsAxios.put(`/payroll/${id}/release`),
  payslipUrl: (id) => `${emsAxios.defaults.baseURL}/payroll/${id}/payslip`
}
