import { useParams } from 'react-router-dom'
import { payrollApi } from '../../api/payrollApi'

export default function PayslipView() {
  const { id } = useParams()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Payslip</h1>
        <p className="mt-1 text-sm text-slate-600">PDF preview for payroll record.</p>
      </div>
      <div className="h-[75vh] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <iframe title="Payslip" src={payrollApi.payslipUrl(id)} className="h-full w-full" />
      </div>
    </div>
  )
}
