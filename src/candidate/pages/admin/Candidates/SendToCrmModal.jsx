import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

// â”€â”€â”€ CRM API setup (mirrors crm/api/axiosInstance.js) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const trimSlash = (v = '') => v.replace(/\/+$/, '')
const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const DEFAULT_ROOT = import.meta.env.PROD ? '' : `http://${defaultHost}:5000`
const CRM_ROOT = trimSlash(import.meta.env.VITE_CRM_API_URL || import.meta.env.VITE_API_URL || DEFAULT_ROOT)
const CRM_BASE = CRM_ROOT ? `${CRM_ROOT}/crm` : '/crm'

const crmApi = axios.create({ baseURL: CRM_BASE, withCredentials: true })
crmApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('crm_access_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// â”€â”€â”€ Form config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sourceOptions = ['RC data', 'WRC data', 'College contacts']

const schema = yup.object({
  candidateName: yup.string().trim().min(2).required('Candidate name is required'),
  mobileNumber: yup.string().trim().matches(/^[0-9]{10}$/, 'Must be 10 digits').required('Mobile number is required'),
  education: yup.string().trim().required('Education is required'),
  jobNo: yup.string().trim().required('Job No is required'),
  jobProfile: yup.string().trim().required('Job Profile is required'),
  interested: yup.object({
    status: yup.string().oneOf(['yes', 'no']).required(),
    reason: yup.string().max(1000).test('reason-required', 'Reason is required when not interested', function (v) {
      return this.parent.status !== 'no' || Boolean(v?.trim())
    })
  }),
  availabilityForInterview: yup.string().trim().required('Availability is required'),
  interviewDate: yup.string().trim().required('Interview date is required'),
  interviewTime: yup.string().trim().required('Interview time is required'),
  enteredRecruiterId: yup.string().trim().max(50).nullable().default(''),
  overallCallingRemark: yup.string().trim().required('Overall remark is required'),
  candidateClass: yup.string().oneOf(['1st', '2nd', '3rd']).required(),
  registrationInfo: yup.string().oneOf(sourceOptions).required(),
  callStatus: yup.string().oneOf(['pending', 'called', 'followup', 'sure', 'rejected']).required()
})

const Err = ({ msg }) => msg ? <span className="mt-1 block text-xs text-rose-500">{msg}</span> : null

// â”€â”€â”€ Modal component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SendToCrmModal = ({ candidate, onClose }) => {
  const overlayRef = useRef(null)
  const [done, setDone] = useState(false)
  const [createdId, setCreatedId] = useState(null)

  const defaultValues = {
    candidateName: candidate?.fullName || '',
    mobileNumber: candidate?.mobileNumber || '',
    education: candidate?.education || '',
    jobNo: '',
    jobProfile: '',
    interested: { status: 'yes', reason: '' },
    availabilityForInterview: '',
    interviewDate: '',
    interviewTime: '',
    enteredRecruiterId: '',
    overallCallingRemark: '',
    candidateClass: '1st',
    registrationInfo: 'RC data',
    callStatus: 'pending'
  }

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues
  })

  const interestedStatus = useWatch({ control, name: 'interested.status' })

  // Close on overlay click
  const handleOverlay = (e) => { if (e.target === overlayRef.current) onClose() }

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      interested: values.interested.status === 'no' ? values.interested : { status: 'yes' }
    }
    try {
      const res = await crmApi.post('/candidates', payload)
      const id = res.data.data?.candidate?._id
      setCreatedId(id)
      setDone(true)
      toast.success('Candidate added to CRM successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add candidate to CRM'
      toast.error(msg)
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add to CRM â€” Telecalling</h2>
            {candidate?.fullName
              ? <p className="mt-0.5 text-sm text-slate-500">Pre-filled from CMS: <span className="font-semibold text-slate-700">{candidate.fullName}</span></p>
              : <p className="mt-0.5 text-sm text-slate-500">New CRM candidate record</p>
            }
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl">âœ…</div>
              <h3 className="text-xl font-bold text-slate-800">Candidate Added to CRM!</h3>
              <p className="text-sm text-slate-500">The candidate has been successfully added to the Telecalling CRM.</p>
              <div className="flex gap-3">
                {createdId && (
                  <a
                    href={`/admin/crm/candidates/${createdId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
                  >
                    View in CRM
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form id="send-to-crm-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                {/* Pre-filled fields */}
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Candidate Name</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('candidateName')} />
                  <Err msg={errors.candidateName?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mobile Number</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" inputMode="numeric" maxLength={10} {...register('mobileNumber')} />
                  <Err msg={errors.mobileNumber?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Education</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('education')} />
                  <Err msg={errors.education?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Job No</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('jobNo')} />
                  <Err msg={errors.jobNo?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Job Profile</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('jobProfile')} />
                  <Err msg={errors.jobProfile?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Interested</span>
                  <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('interested.status')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>

                {interestedStatus === 'no' && (
                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reason for Not Interested</span>
                    <textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" rows={3} {...register('interested.reason')} />
                    <Err msg={errors.interested?.reason?.message} />
                  </label>
                )}

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Availability for Interview</span>
                  <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('availabilityForInterview')}>
                    <option value="">Select availability</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <Err msg={errors.availabilityForInterview?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Interview Date</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" type="date" {...register('interviewDate')} />
                  <Err msg={errors.interviewDate?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Interview Time</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" type="time" {...register('interviewTime')} />
                  <Err msg={errors.interviewTime?.message} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recruiter ID</span>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" placeholder="Enter recruiter ID" {...register('enteredRecruiterId')} />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Candidate Class</span>
                  <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('candidateClass')}>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Source</span>
                  <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('registrationInfo')}>
                    {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Call Status</span>
                  <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" {...register('callStatus')}>
                    <option value="pending">Pending</option>
                    <option value="called">Called</option>
                    <option value="followup">Follow-up</option>
                    <option value="sure">Sure</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>

                <label className="block md:col-span-2 xl:col-span-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Overall Remark</span>
                  <textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" rows={3} {...register('overallCallingRemark')} />
                  <Err msg={errors.overallCallingRemark?.message} />
                </label>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              form="send-to-crm-form"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Add to CRM'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SendToCrmModal
