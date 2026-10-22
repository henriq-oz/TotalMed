import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sem proxy: o services/Api.jsx chama a API pelo endereço completo
// (VITE_API_URL, padrão http://localhost:8080), liberado no CORS do Spring.
// O proxy antigo nunca era usado e ainda mandava o F5 em /login para a API.
export default defineConfig({
  plugins: [react()],
})
