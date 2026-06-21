import { io } from 'socket.io-client'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_ROOT = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? undefined : `http://${defaultHost}:5000`)

const socket = io(API_ROOT || undefined, {
  autoConnect: false,
  withCredentials: true
})

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
  }
}

export const connectAdminSocket = connectSocket

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}

export default socket
