import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import api from '../../api/axiosInstance.js'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import { formatDateTime, getErrorMessage } from '../../utils/helpers.js'

const schema = yup.object({
  name: yup.string().trim().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().transform((value) => value || '').test('password-length', 'Password must be at least 8 characters', (value) => !value || value.length >= 8),
  confirmPassword: yup
    .string()
    .transform((value) => value || '')
    .oneOf([yup.ref('password')], 'Passwords do not match')
})

const blankForm = { name: '', email: '', password: '', confirmPassword: '' }

const ManageEmployees = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const createActionRequested = searchParams.get('action') === 'create'
  const [employees, setEmployees] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [deletingEmployee, setDeletingEmployee] = useState(null)
  const [page, setPage] = useState(1)
  const {
    register,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: blankForm
  })

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/employees?page=${page}&limit=20`)
      setEmployees(response.data.data?.employees || [])
      setPagination(response.data.data?.pagination || null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load employees'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [page])

  const openCreateModal = () => {
    setEditingEmployee(null)
    reset(blankForm)
    setModalOpen(true)
    if (!createActionRequested) {
      setSearchParams({ action: 'create' })
    }
  }

  useEffect(() => {
    if (!createActionRequested) return
    setEditingEmployee(null)
    reset(blankForm)
    setModalOpen(true)
  }, [createActionRequested, reset])

  const openEditModal = (employee) => {
    setEditingEmployee(employee)
    reset({ name: employee.name || '', email: employee.email || '', password: '', confirmPassword: '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingEmployee(null)
    reset(blankForm)
    if (createActionRequested) {
      setSearchParams({}, { replace: true })
    }
  }

  const onSubmit = async (values) => {
    if (!editingEmployee && !values.password) {
      setError('password', { type: 'manual', message: 'Password is required' })
      return
    }

    const payload = {
      name: values.name,
      email: values.email
    }

    if (values.password) {
      payload.password = values.password
      payload.confirmPassword = values.confirmPassword
    }

    try {
      if (editingEmployee) {
        await api.put(`/admin/employees/${editingEmployee._id}`, payload)
        toast.success('Employee updated')
      } else {
        await api.post('/admin/employees', payload)
        toast.success('Employee created')
      }
      closeModal()
      loadEmployees()
    } catch (error) {
      toast.error(getErrorMessage(error, editingEmployee ? 'Failed to update employee' : 'Failed to create employee'))
    }
  }

  const toggleEmployee = async (employee) => {
    try {
      await api.patch(`/admin/employees/${employee._id}/toggle`, { isActive: !employee.isActive })
      toast.success(`Employee ${employee.isActive ? 'deactivated' : 'activated'}`)
      loadEmployees()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update employee'))
    }
  }

  const deleteEmployee = async () => {
    if (!deletingEmployee) return

    try {
      await api.delete(`/admin/employees/${deletingEmployee._id}`)
      toast.success('Employee deleted')
      setDeletingEmployee(null)

      if (employees.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        loadEmployees()
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete employee'))
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'candidateCount', label: 'Candidates', render: (row) => row.candidateCount || 0 },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.isActive ? 'emerald' : 'slate'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
    },
    { key: 'lastActiveAt', label: 'Last Active', render: (row) => formatDateTime(row.lastActiveAt || row.updatedAt) },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="crm-button-secondary h-8 px-3"
            onClick={(event) => {
              event.stopPropagation()
              openEditModal(row)
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="crm-button-secondary h-8 px-3"
            onClick={(event) => {
              event.stopPropagation()
              toggleEmployee(row)
            }}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className="crm-button-danger h-8 px-3"
            onClick={(event) => {
              event.stopPropagation()
              setDeletingEmployee(row)
            }}
          >
            Delete
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-brand-blue-dark">Employees</h1>
          <p className="mt-2 text-sm text-slate-600">Telecaller accounts created by CRM super admin.</p>
        </div>
        <button type="button" className="crm-button-primary" onClick={openCreateModal}>
          Add Employee
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-line bg-white p-6 text-slate-600">Loading employees...</div>
      ) : (
        <Table columns={columns} rows={employees} emptyMessage="No CRM employees found" />
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button className="crm-button-secondary" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="crm-button-secondary"
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      <Modal open={modalOpen} title={editingEmployee ? 'Update Employee' : 'Add Employee'} onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="crm-label">Name</span>
            <input className="crm-input mt-1" {...register('name')} />
            {errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name.message}</span>}
          </label>
          <label className="block">
            <span className="crm-label">Email</span>
            <input className="crm-input mt-1" type="email" {...register('email')} />
            {errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email.message}</span>}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="crm-label">{editingEmployee ? 'New Password' : 'Password'}</span>
              <input className="crm-input mt-1" type="password" {...register('password')} />
              {errors.password && <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>}
            </label>
            <label className="block">
              <span className="crm-label">Confirm Password</span>
              <input className="crm-input mt-1" type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <span className="mt-1 block text-xs text-rose-600">{errors.confirmPassword.message}</span>
              )}
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="crm-button-secondary" type="button" onClick={closeModal}>
              Cancel
            </button>
            <button className="crm-button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deletingEmployee)} title="Delete Employee" onClose={() => setDeletingEmployee(null)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Delete <span className="font-semibold text-slate-950">{deletingEmployee?.name}</span>? Candidate and call records stay in CRM history, but this employee account will no longer be available.
          </p>
          <div className="flex justify-end gap-2">
            <button className="crm-button-secondary" type="button" onClick={() => setDeletingEmployee(null)}>
              Cancel
            </button>
            <button className="crm-button-danger" type="button" onClick={deleteEmployee}>
              Delete Employee
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ManageEmployees
