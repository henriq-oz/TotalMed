import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { IconeLua } from './BotaoTema';
import { useTemaEscuro } from '../utils/tema';
import '../styles/AdminLayout.css';

const ROTA_DASHBOARD = '/admin/dashboard';

// Telas da recepção: cada uma tem a sua rota.
const NAV_RECEPCAO = [
  {
    label: 'Pré-agendamentos',
    path: '/admin/pre-agendamentos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 3h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 2.5h5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Check-in',
    path: '/admin/check-in',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.8 10.2 9 12.4l4.2-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Fila de triagem',
    path: '/admin/fila',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="1.3" fill="currentColor" />
        <circle cx="5" cy="10" r="1.3" fill="currentColor" />
        <circle cx="5" cy="15" r="1.3" fill="currentColor" />
        <path d="M8.5 5h8M8.5 10h8M8.5 15h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Cadastros administrativos. O AdminLayout só é montado em páginas que já
// passaram pelo useUsuario('ADMIN'), então outros perfis nunca veem estes itens.
const NAV_GESTAO = [
  {
    label: 'Clínicas e hospitais',
    path: '/admin/unidades',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.5 17V5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v12" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10 6.8v4.4M7.8 9h4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8.5 17v-3h3v3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: 'Administradores',
    path: '/admin/administradores',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2.5 4 4.8v4.6c0 3.7 2.6 6.6 6 8.1 3.4-1.5 6-4.4 6-8.1V4.8L10 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="m7.4 10 1.9 1.9 3.4-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// Os itens rolam até as seções do dashboard (ids em AdminDashboard.jsx).
const NAV_ITEMS = [
  {
    label: 'Visão geral',
    secao: 'visao-geral',
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
    label: 'Pacientes',
    secao: 'pacientes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7.5" cy="6.5" r="2.8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 16.5c.5-2.8 2.5-4.5 5-4.5s4.5 1.7 5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13 4.1a2.6 2.6 0 0 1 0 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14.7 12.3c1.4.6 2.4 2 2.8 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function rolarPara(secao) {
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(secao)?.scrollIntoView({
    behavior: reduzirMovimento ? 'auto' : 'smooth',
    block: 'start',
  });
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, alternarTema] = useTemaEscuro();
  const noDashboard = location.pathname === ROTA_DASHBOARD;
  // Vindo de uma tela da recepção, a seção pedida chega pelo state da rota.
  const secaoPedida = location.state?.secao;
  const [secaoAtiva, setSecaoAtiva] = useState(secaoPedida || 'visao-geral');

  const usuario = (() => {
    try {
      return JSON.parse(localStorage.getItem('usuario')) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (secaoPedida) rolarPara(secaoPedida);
  }, [secaoPedida]);

  const irParaSecao = (secao) => {
    if (!noDashboard) {
      navigate(ROTA_DASHBOARD, { state: { secao } });
      return;
    }
    setSecaoAtiva(secao);
    rolarPara(secao);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const iniciais = (usuario.nome || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-logo">
            <Logo />
          </div>

          <div className="admin-identity">
            <span className="admin-avatar">{iniciais}</span>
            <div className="admin-identity-text">
              <strong>{usuario.nome ? usuario.nome.split(' ')[0] : 'Administrador'}</strong>
              <span>Administrador</span>
            </div>
          </div>

          <nav className="admin-sidebar-nav" aria-label="Seções do painel">
            {NAV_ITEMS.map((item) => {
              const ativo = noDashboard && secaoAtiva === item.secao;
              return (
                <button
                  key={item.secao}
                  type="button"
                  className={`admin-nav-item ${ativo ? 'admin-nav-item-active' : ''}`}
                  aria-current={ativo ? 'true' : undefined}
                  onClick={() => irParaSecao(item.secao)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}

            {[['Recepção', NAV_RECEPCAO], ['Gestão', NAV_GESTAO]].map(([grupo, itens]) => [
              <span key={grupo} className="admin-nav-grupo">{grupo}</span>,
              ...itens.map((item) => {
                const ativo = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    className={`admin-nav-item ${ativo ? 'admin-nav-item-active' : ''}`}
                    aria-current={ativo ? 'page' : undefined}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                );
              }),
            ])}
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-nav-item"
            onClick={alternarTema}
            aria-pressed={darkMode}
          >
            <span className="admin-nav-icon"><IconeLua /></span>
            Modo de exibição
          </button>
          <button type="button" className="admin-nav-item admin-nav-item-logout" onClick={handleLogout}>
            <span className="admin-nav-icon"><LogoutIcon /></span>
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
