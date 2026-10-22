import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { IconeLua } from './BotaoTema';
import { useTemaEscuro } from '../utils/tema';
import '../styles/DoctorLayout.css';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/medico/dashboard',
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
    label: 'Minha agenda',
    path: '/medico/agenda',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4.5" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 8.5h14" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Fila de espera',
    path: '/medico/fila',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 16c.5-2.6 2.3-4.2 4.5-4.2s4 1.6 4.5 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14 7.5h4M16 5.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Minha conta',
    path: '/medico/conta',
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

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.8 7.7a2.2 2.2 0 1 1 3.3 1.9c-.7.4-1.1.8-1.1 1.6v.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="14" r="0.9" fill="currentColor" />
  </svg>
);

export default function DoctorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, alternarTema] = useTemaEscuro();

  const usuario = (() => {
    try {
      return JSON.parse(localStorage.getItem('usuario')) || {};
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const iniciais = (usuario.nome || 'M')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <div className="doctor-shell">
      <aside className="doctor-sidebar">
        <div className="doctor-sidebar-top">
          <div className="doctor-sidebar-logo">
            <Logo />
          </div>

          <div className="doctor-identity">
            <span className="doctor-avatar">{iniciais}</span>
            <div className="doctor-identity-text">
              <strong>{usuario.nome ? `Dr(a). ${usuario.nome.split(' ')[0]}` : 'Médico'}</strong>
              <span>{usuario.especialidade || 'Corpo clínico'}</span>
            </div>
          </div>

          <nav className="doctor-sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`doctor-nav-item ${location.pathname === item.path ? 'doctor-nav-item-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="doctor-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="doctor-sidebar-bottom">
          <button type="button" className="doctor-nav-item" onClick={alternarTema} aria-pressed={darkMode}>
            <span className="doctor-nav-icon"><IconeLua /></span>
            Moda de exibição
          </button>
          <button type="button" className="doctor-nav-item doctor-nav-item-logout" onClick={handleLogout}>
            <span className="doctor-nav-icon"><LogoutIcon /></span>
            Sair
          </button>
        </div>
      </aside>

      <main className="doctor-main">{children}</main>

      <button type="button" className="doctor-help-fab" aria-label="Ajuda">
        <HelpIcon />
      </button>
    </div>
  );
}
