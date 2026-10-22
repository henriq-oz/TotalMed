import { useState } from 'react';
import '../styles/Login.css';
import Logo from '../components/Logo';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  // Aviso deixado pelo cadastro ("Conta criada!"), que redireciona para cá.
  const mensagem = useLocation().state?.mensagem;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validarFormulario = () => {
    const novosErros = {};
    if (!formData.email.trim()) {
      novosErros.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      novosErros.email = 'Email inválido';
    }
    if (!formData.password.trim()) {
      novosErros.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      novosErros.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setCarregando(true);
    try {
      // POST /login → retorna { id, nome, role }
      const response = await authService.login(formData.email, formData.password);
      const data = response.data;

      // Salva os dados do usuário no localStorage
      localStorage.setItem('usuario', JSON.stringify(data));

      // Redireciona com base no role vindo da API
      const rotas = {
        'PACIENTE': '/paciente/dashboard',
        'ADMIN': '/admin/dashboard',
      };

      navigate(rotas[data.role] || '/');
    } catch (erro) {
      if (erro.response?.status === 401) {
        setErros({ geral: 'Email ou senha incorretos' });
      } else {
        setErros({ geral: 'Erro ao conectar ao servidor' });
      }
      console.error('Erro no login:', erro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Link to="/" className="link-home">← Início</Link>
          <Logo />
          <h1>Sistema Inteligente de Atendimento Hospitalar</h1>
          <p className="login-subtitle">Entre para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mensagem && !erros.geral && <div className="sucesso-geral" role="status">{mensagem}</div>}
          {erros.geral && <div className="erro-geral">{erros.geral}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="Digite seu email" disabled={carregando}
              className={erros.email ? 'input-erro' : ''} />
            {erros.email && <span className="erro-texto">{erros.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input type="password" id="password" name="password" value={formData.password}
              onChange={handleChange} placeholder="Digite sua senha" disabled={carregando}
              className={erros.password ? 'input-erro' : ''} />
            {erros.password && <span className="erro-texto">{erros.password}</span>}
          </div>

          <button type="submit" className="btn-entrar" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">

          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/criar-conta'); }} className="link-criar">
            Criar conta
          </a>
        </div>
      </div>
    </div>
  );
}
