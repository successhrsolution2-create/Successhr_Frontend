import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { listAllAdminUsers, updateUser, deleteUser } from '../../api/usersApi'
import Skeleton from '../../components/Skeleton'
import EditUserModal from './EditUserModal'
import { ConfirmDialog } from '../../components/ActionDialogs'

const roleLabels = {
  superAdmin: 'Super Admin',
  businessAdvisor: 'Business Advisor',
  candidateAdmin: 'Candidate Admin',
  manager: 'Manager'
}

export default function UsersPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)

  const load = async () => {
    try {
      const data = await listAllAdminUsers()
      setUsers(data.users || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEditSave = async (payload) => {
    try {
      await updateUser(editingUser._id, payload, editingUser.role)
      toast.success('User updated successfully')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user')
      throw error
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(deletingUser._id, deletingUser.role)
      toast.success('User deleted successfully')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeletingUser(null)
    }
  }

  const filtered = useMemo(() => {
    let result = users.filter(u => u.role !== 'superAdmin')

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter)
    }

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((u) => {
        const fields = [u.name, u.email, u.employeeId, u.advisorCode]
        return fields.some((val) => String(val || '').toLowerCase().includes(query))
      })
    }

    return result
  }, [users, search, roleFilter])

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">View all system administrators and managers.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="businessAdvisor">Business Advisor</option>
          <option value="candidateAdmin">Candidate Admin</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length > 0 ? (
                filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.employeeId || user.advisorCode || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2 text-xs font-semibold leading-5 text-indigo-700">
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 hover:shadow-amber-500/40"
                          title="Edit User"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingUser(user)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 hover:shadow-rose-500/40"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        open={!!deletingUser}
        onCancel={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
        confirmText="Delete User"
        danger={true}
      />
    </div>
  )
}
