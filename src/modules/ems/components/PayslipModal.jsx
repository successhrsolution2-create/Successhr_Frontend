import { X } from 'lucide-react'

export default function PayslipModal({ open, url, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex h-[82vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-950">Payslip</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close payslip">
            <X className="h-4 w-4" />
          </button>
        </div>
        <iframe title="Payslip PDF" src={url} className="min-h-0 flex-1 rounded-b-lg" />
      </div>
    </div>
  )
}
