import { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterPatient from '../components/RegisterPatient';
import RegisterAdmin from '../components/RegisterAdmin';

import Logo from '../components/Logo';
import iconPatient from '../assets/person.png';
import iconAdmin from '../assets/security.png';

import '../styles/Register.css';

// A API não tem mais médico: components/RegisterDoctor.jsx ficou fora da tela.
export default function Register() {
  const [tipoSelecionado, setTipoSelecionado] = useState(null);

  if (tipoSelecionado === 'paciente') {
    return <RegisterPatient onVoltarClick={() => setTipoSelecionado(null)} />;
  }

  if (tipoSelecionado === 'admin') {
    return <RegisterAdmin onVoltarClick={() => setTipoSelecionado(null)} />;
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <Link to="/" className="link-home">← Início</Link>
          <Logo />
          <h1>Criar Conta</h1>
          <p className="register-subtitle">Escolha o tipo de conta que deseja criar</p>
        </div>

        <div className="type-selection">

          {/* Card Paciente */}
          <div
            className="type-card"
            onClick={() => setTipoSelecionado('paciente')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && setTipoSelecionado('paciente')}
          >
            <div className="type-icon">
              <img src={iconPatient} alt="Ícone Paciente" />
            </div>

            <h2>Paciente</h2>
            <p>Crie uma conta como paciente para fazer pré-agendamentos, receber o código de chegada e acompanhar seus pedidos.</p>
          </div>

          {/* Card Administrador */}
          <div
            className="type-card"
            onClick={() => setTipoSelecionado('admin')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && setTipoSelecionado('admin')}
          >
            <div className="type-icon">
              <img src={iconAdmin} alt="Ícone Admin" />
            </div>
            <h2>Administrador</h2>
            <p>Crie uma conta como administrador para analisar pré-agendamentos, fazer o check-in e acompanhar a fila de triagem.</p>
          </div>
        </div>

        <div className="register-footer">
          <Link to="/login" className="link-entrar">
            Já tem uma conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
