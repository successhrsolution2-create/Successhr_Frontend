import { FileText, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import PayslipModal from '../../components/PayslipModal'
import { payrollApi } from '../../api/payrollApi'
import { usePayroll } from '../../hooks/usePayroll'
import { useState } from 'react'

export default function PayrollList() {
  const { payroll, loading, error, reload } = usePayroll()
  const [payslipUrl, setPayslipUrl] = useState('')

  const release = async (id) => {
    await payrollApi.release(id)
    reload()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Payroll</h1>
          <p className="mt-1 text-sm text-slate-600">Monthly payroll runs and payslip release status.</p>
        </div>
        <Link to="/ems/payroll/generate" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
          <Play className="h-4 w-4" /> Generate
        </Link>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Deductions</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payroll.map((item) => (
              <tr key={item._id}>
                <td className="px-4 py-3 font-semibold text-slate-950">{item.employee?.firstName} {item.employee?.lastName}</td>
                <td className="px-4 py-3 text-slate-600">{item.month}/{item.year}</td>
                <td className="px-4 py-3 text-slate-600">{item.grossPay}</td>
                <td className="px-4 py-3 text-slate-600">{item.totalDeductions}</td>
                <td className="px-4 py-3 font-semibold text-slate-950">{item.netPay}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {item.status !== 'Released' ? <button type="button" onClick={() => release(item._id)} className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Release</button> : null}
                    <button type="button" onClick={() => setPayslipUrl(payrollApi.payslipUrl(item._id))} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="View payslip">
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!payroll.length && !loading ? <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">No payroll runs found.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <PayslipModal open={Boolean(payslipUrl)} url={payslipUrl} onClose={() => setPayslipUrl('')} />
    </div>
  )
}
