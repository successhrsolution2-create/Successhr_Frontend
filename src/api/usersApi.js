import api from './axios'

export const listAllAdminUsers = async () => {
  const { data } = await api.get('/users/all')
  return data
}

export const updateUser = async (id, payload, role) => {
  let url = `/users/${id}`
  if (role === 'manager') url = `/users/managers/${id}`
  if (role === 'candidateAdmin') url = `/users/candidate-admins/${id}`
  const { data } = await api.put(url, payload)
  return data
}

export const deleteUser = async (id, role) => {
  let url = `/users/${id}`
  if (role === 'manager') url = `/users/managers/${id}`
  if (role === 'candidateAdmin') url = `/users/candidate-admins/${id}`
  const { data } = await api.delete(url)
  return data
}
