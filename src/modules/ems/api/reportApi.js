import emsAxios from './emsAxios'

export const reportApi = {
  dashboard: () => emsAxios.get('/reports/dashboard'),
  headcount: (params) => emsAxios.get('/reports/headcount', { params }),
  attendanceSummary: (params) => emsAxios.get('/reports/attendance-summary', { params }),
  leaveSummary: (params) => emsAxios.get('/reports/leave-summary', { params }),
  payrollSummary: (params) => emsAxios.get('/reports/payroll-summary', { params })
}
