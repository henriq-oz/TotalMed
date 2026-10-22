import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import HealthForm from './pages/HealthForm'
import PatientDashboard from './pages/PatientDashboard'
import PatientRequests from './pages/PatientRequests'
import PatientAccount from './pages/PatientAccount'
import AdminDashboard from './pages/AdminDashboard'
import AdminPreAgendamentos from './pages/AdminPreAgendamentos'
import AdminCheckIn from './pages/AdminCheckIn'
import AdminFilaTriagem from './pages/AdminFilaTriagem'
import AdminUnidades from './pages/AdminUnidades'
import AdminAdministradores from './pages/AdminAdministradores'
import BotaoTema from './components/BotaoTema'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<><BotaoTema fixo /><Login /></>} />
        <Route path="/criar-conta" element={<><BotaoTema fixo /><Register /></>} />
        <Route path="/ficha-saude" element={<HealthForm />} />
        <Route path="/paciente/dashboard" element={<PatientDashboard />} />
        <Route path="/paciente/solicitacoes" element={<PatientRequests />} />
        <Route path="/paciente/conta" element={<PatientAccount />} />

        {/* A API não tem mais médico, consulta nem exame: pages/DoctorDashboard.jsx
            ficou sem rota. Quem ainda tiver um link antigo cai no login. */}
        <Route path="/medico/*" element={<Navigate to="/login" replace />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* Recepção: análise dos pré-agendamentos, check-in e fila de triagem */}
        <Route path="/admin/pre-agendamentos" element={<AdminPreAgendamentos />} />
        <Route path="/admin/check-in" element={<AdminCheckIn />} />
        <Route path="/admin/fila" element={<AdminFilaTriagem />} />
        {/* Cadastro de clínicas e hospitais (antes só pelo index.html da API) */}
        <Route path="/admin/unidades" element={<AdminUnidades />} />
        <Route path="/admin/administradores" element={<AdminAdministradores />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="/" element={<Home />} />

        <Route path="/cadastro-concluido" element={<Navigate to="/login" replace />} />
        <Route path="/esqueci-senha" element={<Navigate to="/login" replace />} />

        {/* Endereço digitado errado: sem esta rota a tela ficava em branco. */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Outras rotas aqui */}
      </Routes>
    </Router>
  )
}

export default App
