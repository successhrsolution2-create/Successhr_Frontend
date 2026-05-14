import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, Eye, Pencil, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api, { assetUrl } from '../../api/axios'
import Skeleton from '../../components/Skeleton'
import Pagination from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ActionDialogs'
import { copyToClipboard } from '../../utils/copyToClipboard'

const mask = (value) => (value ? `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}` : 'Not provided')

const blankForm = {
  userId: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  city: '',
  profilePhoto: '',
  isActive: true,
  documents: {
    aadharCard: { number: '', fileUrl: '' },
    panCard: { number: '', fileUrl: '' },
    cancelledCheque: { fileUrl: '' },
    agreementLetter: { fileUrl: '' }
  },
  bankDetails: {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'Savings'
  }
}

const blankFiles = {
  profilePhoto: null,
  aadharCard: null,
  panCard: null,
  cancelledCheque: null,
  agreementLetter: null
}

const docLabels = {
  profilePhoto: 'Profile Photo',
  aadharCard: 'Aadhar Card',
  panCard: 'PAN Card',
  cancelledCheque: 'Cancelled Cheque',
  agreementLetter: 'Agreement Letter'
}

const cloneBlankForm = () => JSON.parse(JSON.stringify(blankForm))

const profileToForm = (profile) => ({
  ...cloneBlankForm(),
  userId: profile.userId?._id || '',
  name: profile.userId?.name || profile.fullName || '',
  email: profile.userId?.email || profile.email || '',
  password: '',
  phone: profile.phone || '',
  address: profile.address || '',
  city: profile.city || '',
  profilePhoto: profile.profilePhoto || '',
  isActive: Boolean(profile.userId?.isActive),
  documents: {
    ...cloneBlankForm().documents,
    ...(profile.documents || {}),
    aadharCard: { ...cloneBlankForm().documents.aadharCard, ...(profile.documents?.aadharCard || {}) },
    panCard: { ...cloneBlankForm().documents.panCard, ...(profile.documents?.panCard || {}) },
    cancelledCheque: { ...cloneBlankForm().documents.cancelledCheque, ...(profile.documents?.cancelledCheque || {}) },
    agreementLetter: { ...cloneBlankForm().documents.agreementLetter, ...(profile.documents?.agreementLetter || {}) }
  },
  bankDetails: {
    ...cloneBlankForm().bankDetails,
    ...(profile.bankDetails || {})
  }
})

export default function BusinessAdvisors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [profiles, setProfiles] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const [form, setForm] = useState(cloneBlankForm())
  const [files, setFiles] = useState(blankFiles)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: '', profileId: '', name: '' })

  const load = async () => {
    const { data } = await api.get('/ba/all')
    setProfiles(data)
    setLoading(false)
  }

  useEffect(() => {
    load().catch((error) => {
      toast.error(
        error.response?.data?.message || 'Could not load Business Advisors'
      )
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    setPage(1)
  }, [profiles.length, pageSize, searchTerm])

  const filteredProfiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return profiles

    return profiles.filter((profile) => {
      const values = [
        profile.userId?.name,
        profile.fullName,
        profile.userId?.email,
        profile.email,
        profile.phone,
        profile.city,
        profile.userId?.advisorCode,
        profile.isProfileComplete ? 'complete' : 'incomplete',
        profile.userId?.isActive ? 'active' : 'inactive'
      ]

      return values.some((value) => String(value || '').toLowerCase().includes(term))
    })
  }, [profiles, searchTerm])

  const paginatedProfiles = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProfiles.slice(start, start + pageSize)
  }, [filteredProfiles, page, pageSize])

  useEffect(() => {
    if (searchParams.get('action') !== 'create') return
    setForm(cloneBlankForm())
    setFiles(blankFiles)
    setModalMode('create')
  }, [searchParams])

  const openCreate = () => {
    setForm(cloneBlankForm())
    setFiles(blankFiles)
    setModalMode('create')
    setSearchParams({ action: 'create' })
  }

  const openEdit = (profile) => {
    setForm(profileToForm(profile))
    setFiles(blankFiles)
    setModalMode('edit')
  }

  const openView = (profile) => {
    setForm(profileToForm(profile))
    setFiles(blankFiles)
    setModalMode('view')
  }

  const closeModal = () => {
    setModalMode(null)
    setFiles(blankFiles)
    if (searchParams.get('action') === 'create') {
      setSearchParams({}, { replace: true })
    }
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateDocument = (docType, field, value) => {
    setForm((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [docType]: {
          ...current.documents[docType],
          [field]: docType === 'panCard' && field === 'number' ? value.toUpperCase() : value
        }
      }
    }))
  }

  const updateBank = (field, value) => {
    setForm((current) => ({
      ...current,
      bankDetails: {
        ...current.bankDetails,
        [field]: field === 'ifscCode' ? value.toUpperCase() : value
      }
    }))
  }

  const uploadSelectedFiles = async (userId) => {
    const selectedFiles = Object.entries(files).filter(([, file]) => Boolean(file))
    const uploadedFiles = []

    for (const [docType, file] of selectedFiles) {
      const formData = new FormData()
      formData.append('docType', docType)
      formData.append('file', file)

      try {
        const { data } = await api.post(`/ba/profile/${userId}/upload`, formData)
        uploadedFiles.push({ docType, fileUrl: data?.fileUrl || '' })
      } catch (error) {
        const message = error.response?.data?.message || `Could not upload ${docLabels[docType] || 'document'}`
        const uploadError = new Error(message)
        uploadError.response = error.response
        throw uploadError
      }
    }

    return uploadedFiles
  }

  const saveBA = async (event) => {
    event.preventDefault()

    if (modalMode === 'view') return

    if (modalMode === 'edit' && form.password && form.password.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    setSaving(true)

    try {
      const profilePayload = {
        fullName: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        documents: form.documents,
        bankDetails: form.bankDetails
      }

      let userId = form.userId

      if (modalMode === 'create') {
        const { data } = await api.post('/users', {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
          city: form.city,
          isActive: form.isActive,
          documents: form.documents,
          bankDetails: form.bankDetails
        })
        userId = data.user._id
      } else {
        await api.put(`/users/${userId}`, {
          name: form.name,
          email: form.email,
          isActive: form.isActive
        })
        await api.put(`/ba/profile/${userId}`, profilePayload)
        if (form.password) {
          await api.put(`/users/${userId}/reset-password`, {
            newPassword: form.password
          })
        }
      }

      const uploadedFiles = await uploadSelectedFiles(userId)
      await load()
      closeModal()
      const uploadMessage = uploadedFiles.length
        ? ` and ${uploadedFiles.length} document${uploadedFiles.length === 1 ? '' : 's'} uploaded`
        : ''
      toast.success(modalMode === 'create' ? `Business Advisor registered${uploadMessage}` : `Business Advisor updated${uploadMessage}`)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not save Business Advisor')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (profile) => {
    const user = profile.userId

    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive })
      setProfiles((current) =>
        current.map((item) =>
          item._id === profile._id
            ? {
                ...item,
                userId: { ...item.userId, isActive: !user.isActive }
              }
            : item
        )
      )
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update BA')
    }
  }

  const removeBA = async (userId, profileId) => {
    try {
      await api.delete(`/users/${userId}`)
      setProfiles((current) => current.filter((item) => item._id !== profileId))
      toast.success('Business Advisor removed')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove BA')
    }
  }

  const copyCode = async (code) => {
    try {
      const copied = await copyToClipboard(code)
      toast[copied ? 'success' : 'error'](copied ? 'Code copied!' : 'Copy is not supported in this browser')
    } catch (_error) {
      toast.error('Could not copy code')
    }
  }

  if (loading) return <Skeleton rows={9} />

  const isViewMode = modalMode === 'view'
  const modalTitle =
    modalMode === 'create'
      ? 'Register Business Advisor'
      : isViewMode
        ? 'View Business Advisor'
        : 'Edit Business Advisor'
  const modalDescription = isViewMode
    ? 'Review account, profile, document, and bank details.'
    : 'Fill account, profile, documents, bank details, and upload files.'
  const selectedFileCount = Object.values(files).filter(Boolean).length
  const submitLabel =
    saving
      ? 'Saving...'
      : modalMode === 'create'
        ? selectedFileCount
          ? `Register & Upload ${selectedFileCount} File${selectedFileCount === 1 ? '' : 's'}`
          : 'Register Business Advisor'
        : selectedFileCount
          ? `Save & Upload ${selectedFileCount} File${selectedFileCount === 1 ? '' : 's'}`
          : 'Save Business Advisor'

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Business Advisors</h1>
          <p className="mt-1 text-sm text-slate-500">Register, approve, edit, upload documents, and remove BA accounts.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Register Business Advisor
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search advisors by name, email, phone, city, code..."
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Showing {filteredProfiles.length} of {profiles.length}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-[13px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">City</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Profile Status</th>
                <th className="px-4 py-2.5">Active</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProfiles.map((profile) => (
                <tr key={profile._id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-4 py-2 font-semibold leading-5 text-slate-900">{profile.userId?.name || profile.fullName}</td>
                  <td className="max-w-[220px] break-words px-4 py-2 leading-5 text-slate-600">{profile.userId?.email || profile.email}</td>
                  <td className="px-4 py-2 leading-5 text-slate-600">{profile.phone || 'Not provided'}</td>
                  <td className="px-4 py-2 leading-5 text-slate-600">{profile.city || 'Not provided'}</td>
                  <td className="px-4 py-2 leading-5 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">{profile.userId?.advisorCode || '-'}</span>
                      {profile.userId?.advisorCode ? (
                        <button type="button" onClick={() => copyCode(profile.userId.advisorCode)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${profile.isProfileComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {profile.isProfileComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <label className="inline-flex cursor-pointer items-center">
                      <input type="checkbox" checked={Boolean(profile.userId?.isActive)} onChange={() => toggleActive(profile)} className="sr-only" />
                      <span className={`h-5 w-9 rounded-full p-0.5 transition ${profile.userId?.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <span className={`block h-4 w-4 rounded-full bg-white transition ${profile.userId?.isActive ? 'translate-x-4' : ''}`} />
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <ActionButton label="View" onClick={() => openView(profile)} color="border-sky-200 text-sky-700 hover:bg-sky-50">
                        <Eye className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton label="Update" onClick={() => openEdit(profile)} color="border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Pencil className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Delete"
                        onClick={() =>
                          setDeleteConfirm({
                            open: true,
                            userId: profile.userId._id,
                            profileId: profile._id,
                            name: profile.userId?.name || profile.fullName
                          })
                        }
                        color="border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-500">
                    {profiles.length ? 'No advisors match your search.' : 'No Business Advisors created yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={filteredProfiles.length} itemLabel="advisors" onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close modal"
          />
          <form onSubmit={saveBA} className="relative flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in sm:h-[95vh] sm:rounded-3xl">
            <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                    {modalTitle}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">{modalDescription}</p>
                </div>
                <button type="button" onClick={closeModal} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-4 sm:space-y-6">
                <FormSection title="Account Details">
                  <ModalField label="Name" required={!isViewMode} readOnly={isViewMode} value={form.name} onChange={(value) => updateForm('name', value)} />
                  <ModalField label="Email" required={!isViewMode} readOnly={isViewMode} type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
                  {modalMode === 'create' && (
                    <ModalField label="Password" required type="password" value={form.password} onChange={(value) => updateForm('password', value)} />
                  )}
                  {modalMode === 'edit' && (
                    <ModalField label="New Password" type="password" value={form.password} onChange={(value) => updateForm('password', value)} />
                  )}
                  <label className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      disabled={isViewMode}
                      onChange={(event) => updateForm('isActive', event.target.checked)}
                      className="h-4 w-4 rounded text-sky-600"
                    />
                    Active / approved account
                  </label>
                </FormSection>

                <FormSection title="Personal Info">
                  <ModalField label="Phone" readOnly={isViewMode} value={form.phone} onChange={(value) => updateForm('phone', value)} />
                  <ModalField label="City" readOnly={isViewMode} value={form.city} onChange={(value) => updateForm('city', value)} />
                  <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                    Address
                    <textarea
                      value={form.address}
                      readOnly={isViewMode}
                      onChange={(event) => updateForm('address', event.target.value)}
                      rows={3}
                      className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100 ${isViewMode ? 'bg-slate-50 text-slate-700' : ''}`}
                    />
                  </label>
                </FormSection>

                <FormSection title="Document Numbers">
                  <ModalField
                    label="Aadhar Number"
                    readOnly={isViewMode}
                    value={form.documents.aadharCard.number || ''}
                    onChange={(value) => updateDocument('aadharCard', 'number', value.replace(/\D/g, '').slice(0, 12))}
                  />
                  <ModalField
                    label="PAN Number"
                    readOnly={isViewMode}
                    value={form.documents.panCard.number || ''}
                    onChange={(value) => updateDocument('panCard', 'number', value.slice(0, 10))}
                  />
                </FormSection>

                <FormSection title="Document Uploads">
                  {Object.entries(docLabels).map(([docType, label]) => (
                    <FileField
                      key={docType}
                      label={label}
                      file={files[docType]}
                      existingUrl={docType === 'profilePhoto' ? form.profilePhoto : form.documents[docType]?.fileUrl}
                      accept={docType === 'profilePhoto' ? 'image/*' : docType === 'agreementLetter' ? '.pdf,application/pdf' : 'image/*,.pdf'}
                      readOnly={isViewMode}
                      onChange={(file) => setFiles((current) => ({ ...current, [docType]: file }))}
                    />
                  ))}
                </FormSection>

                <FormSection title="Bank Details">
                  <ModalField label="Account Holder Name" readOnly={isViewMode} value={form.bankDetails.accountHolderName || ''} onChange={(value) => updateBank('accountHolderName', value)} />
                  <ModalField label="Bank Name" readOnly={isViewMode} value={form.bankDetails.bankName || ''} onChange={(value) => updateBank('bankName', value)} />
                  <ModalField label="Account Number" readOnly={isViewMode} value={form.bankDetails.accountNumber || ''} onChange={(value) => updateBank('accountNumber', value)} />
                  <ModalField label="IFSC Code" readOnly={isViewMode} value={form.bankDetails.ifscCode || ''} onChange={(value) => updateBank('ifscCode', value)} />
                  <ModalField label="Branch Name" readOnly={isViewMode} value={form.bankDetails.branchName || ''} onChange={(value) => updateBank('branchName', value)} />
                  <label className="block text-sm font-semibold text-slate-700">
                    Account Type
                    <select
                      value={form.bankDetails.accountType || 'Savings'}
                      disabled={isViewMode}
                      onChange={(event) => updateBank('accountType', event.target.value)}
                      className={`mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100 ${isViewMode ? 'bg-slate-50 text-slate-700' : ''}`}
                    >
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                    </select>
                  </label>
                </FormSection>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
              {isViewMode ? (
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {submitLabel}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Remove Business Advisor"
        message={`Remove ${deleteConfirm.name}? This removes BA login and profile. Existing submitted references remain for records.`}
        confirmText="Remove"
        danger
        onCancel={() => setDeleteConfirm({ open: false, userId: '', profileId: '', name: '' })}
        onConfirm={async () => {
          await removeBA(deleteConfirm.userId, deleteConfirm.profileId)
          setDeleteConfirm({ open: false, userId: '', profileId: '', name: '' })
        }}
      />
    </div>
  )
}

function ActionButton({ label, color, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-8 items-center justify-center gap-1 rounded-md border bg-white px-2.5 text-xs font-semibold ${color}`}
      aria-label={label}
      title={label}
    >
      {children}
      {label}
    </button>
  )
}

function FormSection({ title, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 p-4">
      <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">{title}</h3>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

function ModalField({ label, value, onChange, type = 'text', required = false, readOnly = false, disabled = false }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100 ${readOnly || disabled ? 'bg-slate-50 text-slate-700' : ''}`}
      />
    </label>
  )
}

function FileField({ label, file, existingUrl, accept, onChange, readOnly = false }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 p-3">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{label}</p>
        {existingUrl && (
          <a href={assetUrl(existingUrl)} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-bold text-sky-600 hover:text-sky-700">
            View
          </a>
        )}
      </div>
      {readOnly ? (
        <div className="flex min-h-10 min-w-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
          {existingUrl ? 'Uploaded file available' : 'No file uploaded'}
        </div>
      ) : (
        <label className="flex min-h-10 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600 hover:border-cyan-400 hover:bg-sky-50">
          <UploadCloud className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{file ? file.name : 'Choose file'}</span>
          <input type="file" className="sr-only" accept={accept} onChange={(event) => onChange(event.target.files?.[0] || null)} />
        </label>
      )}
      {file && !readOnly ? (
        <p className="mt-2 min-w-0 truncate text-xs font-medium text-slate-500" title={file.name}>
          Selected file will upload after save.
        </p>
      ) : null}
    </div>
  )
}

function ProfileDrawer({ profile, onClose }) {
  const [publicCount, setPublicCount] = useState(0)

  useEffect(() => {
    const loadCount = async () => {
      if (!profile?.userId?._id) return
      const { data } = await api.get(`/ba/${profile.userId._id}/public-form-count`)
      setPublicCount(data.count || 0)
    }
    loadCount().catch(() => setPublicCount(0))
  }, [profile])

  if (!profile) return null

  const docs = profile.documents || {}
  const bank = profile.bankDetails || {}
  const advisorCode = profile.userId?.advisorCode || ''
  const sharePath = advisorCode ? `/apply/${advisorCode}` : '-'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close profile"
      />
      <aside className="relative flex h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in sm:h-[95vh] sm:rounded-3xl">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{profile.userId?.name || profile.fullName}</h2>
              <p className="mt-2 text-sm text-slate-500">{profile.userId?.email || profile.email}</p>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-5">
          <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <InfoGrid
              items={[
                ['Advisor Code', advisorCode || 'Not assigned'],
                ['Share Link', sharePath],
                ['Via Public Form', `${publicCount} applications`]
              ]}
            />
          </section>

          <section>
            <div className="mb-4 h-28 w-28 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
              {profile.profilePhoto ? <img src={assetUrl(profile.profilePhoto)} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <InfoGrid
              items={[
                ['Full Name', profile.fullName],
                ['Phone', profile.phone],
                ['Email', profile.email],
                ['Address', profile.address],
                ['City', profile.city]
              ]}
            />
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Documents</h3>
            <div className="space-y-2">
              <DocLink label="Aadhar Card" url={docs.aadharCard?.fileUrl} detail={docs.aadharCard?.number} />
              <DocLink label="PAN Card" url={docs.panCard?.fileUrl} detail={docs.panCard?.number} />
              <DocLink label="Cancelled Cheque" url={docs.cancelledCheque?.fileUrl} />
              <DocLink label="Agreement Letter" url={docs.agreementLetter?.fileUrl} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Bank Details</h3>
            <InfoGrid
              items={[
                ['Account Holder', bank.accountHolderName],
                ['Bank Name', bank.bankName],
                ['Account Number', mask(bank.accountNumber)],
                ['IFSC Code', bank.ifscCode],
                ['Branch Name', bank.branchName],
                ['Account Type', bank.accountType]
              ]}
            />
          </section>
        </div>
      </aside>
    </div>
  )
}

function InfoGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-1 break-words text-sm text-slate-900">{value || 'Not provided'}</p>
        </div>
      ))}
    </div>
  )
}

function DocLink({ label, url, detail }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {detail && <p className="text-xs text-slate-500">{detail}</p>}
      </div>
      {url ? (
        <a href={assetUrl(url)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
          View
        </a>
      ) : (
        <span className="text-xs font-semibold text-amber-600">Missing</span>
      )}
    </div>
  )
}
