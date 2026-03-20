import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
})

export const leadsService = {
  listar: () => api.get('/api/leads'),
  criar: (data: any) => api.post('/api/leads', data),
  atualizar: (id: string, data: any) => api.patch(`/api/leads/${id}`, data),
}

export default api
