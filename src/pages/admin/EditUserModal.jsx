import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X } from 'lucide-react'

const MANAGER_ACCESS_MODULES = [
  { value: 'candidateManagement', label: 'Candidate Management' },
  { value: 'crmManagement', label: 'CRM Management' },
  { value: 'employeeManagement', label: 'Employee Management' }
]

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isActive: true,
    managerAccess: []
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        isActive: user.isActive ?? true,
        managerAccess: user.managerAccess || []
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleManagerAccessChange = (moduleValue) => {
    setFormData((prev) => {
      const current = prev.managerAccess || []
      if (current.includes(moduleValue)) {
        return { ...prev, managerAccess: current.filter((m) => m !== moduleValue) }
      }
      return { ...prev, managerAccess: [...current, moduleValue] }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Clean up payload based on role
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      isActive: formData.isActive
    }

    if (user.role === 'manager') {
      payload.managerAccess = formData.managerAccess
    }

    try {
      await onSave(payload)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={!loading ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-800">Edit User</h2>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {user?.role === 'manager' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Manager Access Modules</label>
                      <div className="space-y-2">
                        {MANAGER_ACCESS_MODULES.map((mod) => (
                          <label key={mod.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              disabled={loading}
                              checked={formData.managerAccess.includes(mod.value)}
                              onChange={() => handleManagerAccessChange(mod.value)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-sm text-slate-600">{mod.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      disabled={loading}
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Active Account</span>
                  </label>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
