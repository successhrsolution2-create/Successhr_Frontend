import { useEffect, useState } from 'react'
import { MapPin, RefreshCcw, Trash2 } from 'lucide-react'
import { locationApi } from '../../api/locationApi'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

const blankForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  radius: 100,
  isActive: true
}

export default function LocationList() {
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState(blankForm)
  const [editingId, setEditingId] = useState('')
  const [test, setTest] = useState({ locationId: '', lat: '', lng: '', result: null })
  const [error, setError] = useState('')

  const load = () => {
    locationApi.list({ limit: 100 }).then(({ data }) => {
      const items = data.items || []
      setLocations(items)
      setTest((current) => ({ ...current, locationId: current.locationId || items[0]?._id || '' }))
    }).catch((err) => setError(err.response?.data?.message || 'Unable to load locations'))
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (event) => {
    event.preventDefault()
    setError('')
    const payload = {
      name: form.name,
      address: form.address,
      coordinates: {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      },
      radius: Number(form.radius),
      isActive: form.isActive
    }

    try {
      if (editingId) await locationApi.update(editingId, payload)
      else await locationApi.create(payload)
      setForm(blankForm)
      setEditingId('')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save location')
    }
  }

  const edit = (location) => {
    setEditingId(location._id)
    setForm({
      name: location.name || '',
      address: location.address || '',
      latitude: location.coordinates?.latitude || '',
      longitude: location.coordinates?.longitude || '',
      radius: location.radius || 100,
      isActive: Boolean(location.isActive)
    })
  }

  const remove = async (id) => {
    setError('')
    try {
      await locationApi.remove(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete location')
    }
  }

  const validate = async (event) => {
    event.preventDefault()
    setError('')
    setTest((current) => ({ ...current, result: null }))
    try {
      const { data } = await locationApi.validate(test.locationId, { lat: test.lat, lng: test.lng })
      setTest((current) => ({ ...current, result: data }))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to validate coordinates')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Office Locations</h1>
        <p className="mt-1 text-sm text-slate-600">Create geofenced offices and test latitude/longitude points.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={save} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-950">{editingId ? 'Edit Location' : 'New Location'}</h2>
            {editingId ? (
              <button type="button" onClick={() => { setEditingId(''); setForm(blankForm) }} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
                Clear
              </button>
            ) : null}
          </div>
          <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Address
            <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Latitude" type="number" step="any" value={form.latitude} onChange={(value) => setForm({ ...form, latitude: value })} required />
            <Field label="Longitude" type="number" step="any" value={form.longitude} onChange={(value) => setForm({ ...form, longitude: value })} required />
          </div>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Radius: {form.radius}m
            <input type="range" min="50" max="500" step="10" value={form.radius} onChange={(event) => setForm({ ...form, radius: event.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            Active
          </label>
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
            <MapPin className="h-4 w-4" /> {editingId ? 'Update Location' : 'Create Location'}
          </button>
        </form>

        <div className="space-y-4">
          <form onSubmit={validate} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]">
            <select value={test.locationId} onChange={(event) => setTest({ ...test, locationId: event.target.value })} className={inputClass}>
              {locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}
            </select>
            <input type="number" step="any" value={test.lat} onChange={(event) => setTest({ ...test, lat: event.target.value })} placeholder="Latitude" className={inputClass} />
            <input type="number" step="any" value={test.lng} onChange={(event) => setTest({ ...test, lng: event.target.value })} placeholder="Longitude" className={inputClass} />
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCcw className="h-4 w-4" /> Test
            </button>
            {test.result ? (
              <div className={`rounded-md px-3 py-2 text-sm font-semibold md:col-span-4 ${test.result.inside ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {test.result.inside ? 'Inside geofence' : 'Outside geofence'} · {Math.round(test.result.distance)}m from office
              </div>
            ) : null}
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Coordinates</th>
                  <th className="px-4 py-3">Radius</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((location) => (
                  <tr key={location._id}>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => edit(location)} className="text-left font-semibold text-slate-950 hover:text-sky-700">{location.name}</button>
                      <p className="text-xs text-slate-500">{location.address || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{location.coordinates?.latitude}, {location.coordinates?.longitude}</td>
                    <td className="px-4 py-3 text-slate-600">{location.radius}m</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{location.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => remove(location._id)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Delete location">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!locations.length ? <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No office locations found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', step, required = false }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} required={required} className={inputClass} />
    </label>
  )
}
