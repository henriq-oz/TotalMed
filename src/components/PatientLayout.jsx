import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import CentralAjuda from './CentralAjuda';
import { IconeLua } from './BotaoTema';
import { useTemaEscuro } from '../utils/tema';
import { lerUsuario } from '../utils/sessao';
import '../styles/PatientLayout.css';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/paciente/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: 'Novo Pré-agendamento',
    path: '/ficha-saude',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 3h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 2.5h5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Meus Pré-agendamentos',
    path: '/paciente/solicitacoes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 2.5h7l3 3V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V3a.5.5 0 0 1 0-.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 2.5V5a1 1 0 0 0 1 1h2.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7.5 10h5M7.5 12.5h5M7.5 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Minha Conta',
    path: '/paciente/conta',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 17c.6-3.4 3.4-5.5 6.5-5.5s5.9 2.1 6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 17H4.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 13.5 17 10l-4-3.5M17 10H7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PatientLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, alternarTema] = useTemaEscuro();

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const nome = (lerUsuario()?.nome || '').trim();
  const iniciais = (nome || 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <div className="patient-shell">
      <aside className="patient-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <Logo />
          </div>

          <div className="patient-identity">
            <span className="patient-avatar">{iniciais}</span>
            <div className="patient-identity-text">
              <strong>{nome ? nome.split(' ')[0] : 'Paciente'}</strong>
              <span>Paciente</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-item ${location.pathname === item.path ? 'nav-item-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button type="button" className="nav-item" onClick={alternarTema} aria-pressed={darkMode}>
            <span className="nav-icon"><IconeLua /></span>
            Modo de exibição
          </button>
          <button type="button" className="nav-item nav-item-logout" onClick={handleLogout}>
            <span className="nav-icon"><LogoutIcon /></span>
            Sair
          </button>
        </div>
      </aside>

      <main className="patient-main">{children}</main>

      <CentralAjuda />
    </div>
  );
}
