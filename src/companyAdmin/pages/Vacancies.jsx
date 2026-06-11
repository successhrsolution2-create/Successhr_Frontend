import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BriefcaseBusiness, Pencil, Plus, Save, X } from 'lucide-react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import companyAdminApi from '../api'

const facilities = ['Bus', 'Canteen', 'Room', 'PF', 'ESIC', 'Offer Letter', 'Appointment Letter', 'Experience Letter']
const weeklyOffs = ['Saturday', 'Sunday']

const emptyVacancyForm = (companyName = '') => ({
  companyName,
  jobProfile: '',
  department: '',
  numberOfVacancy: '',
  education: '',
  experience: '',
  salaryRange: '',
  jobTime: '',
  shift: '',
  jobLocation: '',
  requiredKeySkills: [],
  rolesAndResponsibility: '',
  facilities: [],
  weeklyOff: [],
  manpower: '',
  turnover: '',
  plant: ''
})

const valuesFromVacancy = (vacancy, companyName) => ({
  ...emptyVacancyForm(vacancy?.companyName || companyName),
  jobProfile: vacancy?.jobProfile || '',
  department: vacancy?.department || '',
  numberOfVacancy: vacancy?.numberOfVacancy ?? '',
  education: vacancy?.education || '',
  experience: vacancy?.experience || '',
  salaryRange: vacancy?.salaryRange || '',
  jobTime: vacancy?.jobTime || '',
  shift: vacancy?.shift || '',
  jobLocation: vacancy?.jobLocation || '',
  requiredKeySkills: vacancy?.requiredKeySkills || [],
  rolesAndResponsibility: vacancy?.rolesAndResponsibility || '',
  facilities: vacancy?.facilities || [],
  weeklyOff: vacancy?.weeklyOff || [],
  manpower: vacancy?.manpower || '',
  turnover: vacancy?.turnover || '',
  plant: vacancy?.plant || ''
})

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')

export default function Vacancies() {
  const { companyAdmin } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [vacancies, setVacancies] = useState([])
  const [form, setForm] = useState(() => emptyVacancyForm(companyAdmin.companyName))
  const [editing, setEditing] = useState(null)
  const [skillInput, setSkillInput] = useState('')
  const [showForm, setShowForm] = useState(() => searchParams.get('action') === 'create')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadVacancies = async () => {
    const { data } = await companyAdminApi.get('/vacancies')
    setVacancies(Array.isArray(data.vacancies) ? data.vacancies : [])
  }

  useEffect(() => {
    let active = true

    companyAdminApi
      .get('/vacancies')
      .then(({ data }) => {
        if (active) setVacancies(Array.isArray(data.vacancies) ? data.vacancies : [])
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Could not load vacancies')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const toggleList = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]
    }))
  }

  const addSkill = () => {
    const normalized = skillInput.trim()
    if (normalized && !form.requiredKeySkills.includes(normalized)) {
      update('requiredKeySkills', [...form.requiredKeySkills, normalized])
    }
    setSkillInput('')
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyVacancyForm(companyAdmin.companyName))
    setSkillInput('')
    setShowForm(true)
    setSearchParams({ action: 'create' })
  }

  const closeForm = () => {
    setEditing(null)
    setForm(emptyVacancyForm(companyAdmin.companyName))
    setSkillInput('')
    setShowForm(false)
    setSearchParams({})
  }

  const editVacancy = (vacancy) => {
    setEditing(vacancy)
    setForm(valuesFromVacancy(vacancy, companyAdmin.companyName))
    setSkillInput('')
    setShowForm(true)
    setSearchParams({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.jobProfile.trim()) {
      toast.error('Job profile is required')
      return
    }

    setSaving(true)
    try {
      if (editing?._id) {
        await companyAdminApi.put(`/vacancies/${editing._id}`, form)
      } else {
        await companyAdminApi.post('/vacancies', form)
      }
      await loadVacancies()
      closeForm()
      toast.success(editing?._id ? 'Vacancy information updated' : 'Vacancy information saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save vacancy information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm font-semibold text-slate-500">Loading vacancies...</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Manpower Vacancy Information</h2>
          <p className="mt-1 text-sm text-slate-500">Maintain job requirement and manpower details separately from candidate interviews.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Add Vacancy
        </button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950">{editing ? 'Update Vacancy' : 'Add Vacancy'}</h3>
              <p className="mt-1 text-sm text-slate-500">Share the open requirement details with Success HR.</p>
            </div>
            <button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close vacancy form">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" value={form.companyName} onChange={(event) => update('companyName', event.target.value)} />
            <Input label="Job Profile" required value={form.jobProfile} onChange={(event) => update('jobProfile', event.target.value)} />
            <Input label="Department" value={form.department} onChange={(event) => update('department', event.target.value)} />
            <Input label="Number Of Vacancy" type="number" min="0" value={form.numberOfVacancy} onChange={(event) => update('numberOfVacancy', event.target.value)} />
            <Input label="Education" value={form.education} onChange={(event) => update('education', event.target.value)} />
            <Input label="Experience" value={form.experience} onChange={(event) => update('experience', event.target.value)} />
            <Input label="Salary Range" value={form.salaryRange} onChange={(event) => update('salaryRange', event.target.value)} />
            <Input label="Job Time" value={form.jobTime} onChange={(event) => update('jobTime', event.target.value)} />
            <Input label="Shift" value={form.shift} onChange={(event) => update('shift', event.target.value)} />
            <Input label="Job Location" value={form.jobLocation} onChange={(event) => update('jobLocation', event.target.value)} />
            <Input label="Manpower" value={form.manpower} onChange={(event) => update('manpower', event.target.value)} />
            <Input label="Turnover" value={form.turnover} onChange={(event) => update('turnover', event.target.value)} />
            <Input label="Plant" value={form.plant} onChange={(event) => update('plant', event.target.value)} />
            <SkillInput
              skills={form.requiredKeySkills}
              value={skillInput}
              onChange={setSkillInput}
              onAdd={addSkill}
              onRemove={(skill) => update('requiredKeySkills', form.requiredKeySkills.filter((item) => item !== skill))}
            />
            <Textarea label="Roles And Responsibility" rows={4} value={form.rolesAndResponsibility} onChange={(event) => update('rolesAndResponsibility', event.target.value)} />
            <CheckboxGrid label="Facilities" values={facilities} selected={form.facilities} onToggle={(value) => toggleList('facilities', value)} />
            <CheckboxGrid label="Weekly Off" values={weeklyOffs} selected={form.weeklyOff} onToggle={(value) => toggleList('weeklyOff', value)} />
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : editing ? 'Update Vacancy' : 'Save Vacancy'}
            </button>
            <button type="button" onClick={closeForm} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-lg font-bold text-slate-950">Saved Vacancies</h3>
          <p className="mt-1 text-sm text-slate-500">Each vacancy is shared separately with the Success HR super admin.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {vacancies.map((vacancy) => (
            <article key={vacancy._id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4 shrink-0 text-sky-700" />
                  <p className="truncate text-sm font-bold text-slate-950">{vacancy.jobProfile || 'Untitled Vacancy'}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">{vacancy.department || '-'} | Vacancy: {vacancy.numberOfVacancy ?? '-'}</p>
              </div>
              <div className="min-w-0 text-sm text-slate-600">
                <p className="truncate font-semibold">{vacancy.jobLocation || 'Location not provided'}</p>
                <p className="truncate text-xs text-slate-500">Updated: {formatDate(vacancy.updatedAt)}</p>
              </div>
              <button type="button" onClick={() => editVacancy(vacancy)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </article>
          ))}
          {!vacancies.length ? (
            <p className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No vacancies submitted yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function Input({ label, required, ...props }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
      <input required={required} {...props} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100" />
    </label>
  )
}

function Textarea({ label, className = '', ...props }) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 sm:col-span-2 ${className}`}>
      {label}
      <textarea {...props} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100" />
    </label>
  )
}

function SkillInput({ skills, value, onChange, onAdd, onRemove }) {
  return (
    <div className="text-sm font-semibold text-slate-700 sm:col-span-2">
      Required Key Skills
      <div className="mt-1 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-sky-500 focus-within:ring-2 focus:ring-cyan-100">
        <div className="mb-2 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              {skill}
              <button type="button" onClick={() => onRemove(skill)} aria-label={`Remove ${skill}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onAdd()
            }
          }}
          className="w-full px-1 py-1 outline-none"
          placeholder="Type and press Enter"
        />
      </div>
    </div>
  )
}

function CheckboxGrid({ label, values, selected, onToggle }) {
  return (
    <div className="text-sm font-semibold text-slate-700 sm:col-span-2">
      {label}
      <div className="mt-2 grid gap-2 min-[380px]:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <label key={value} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} className="h-4 w-4 rounded text-sky-600" />
            {value}
          </label>
        ))}
      </div>
    </div>
  )
}
