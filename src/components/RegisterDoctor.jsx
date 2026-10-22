import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import '../styles/RegisterForms.css';
import { medicoService } from '../services/MedicoService';
import { aplicarMascara, apenasDigitos, limparRG } from '../utils/mascaras';

export default function RegisterDoctor({ onVoltarClick }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '', cpf: '', rg: '', crm: '', especialidade: '', horario: '',
    email: '', password: '', confirmarPassword: '', tell: '',
    dataNascimento: '', sexo: '',
    logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: ''
  });

  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  // Valores exatos do enum Especialidade do backend
  const especialidades = [
    'Cirurgia', 'Pediatria', 'Urologia', 'Ginecologia',
    'Otorrinolaringologia', 'Enfermagem', 'Oftalmologia',
    'Psiquiatria', 'Cardiologia', 'Dermatologia',
    'Ortopedia', 'Radiologia', 'Outro'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: aplicarMascara(name, value) }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validarFormulario = () => {
    const e = {};
    if (!formData.nome.trim() || formData.nome.trim().split(' ').length < 2) e.nome = 'Digite o nome completo';
    if (apenasDigitos(formData.rg).length < 8) e.rg = 'RG inválido';
    if (!formData.crm.trim() || apenasDigitos(formData.crm).length < 5) e.crm = 'CRM inválido';
    if (!formData.especialidade) e.especialidade = 'Especialidade é obrigatória';
    if (!formData.horario.trim()) e.horario = 'Horário de atendimento é obrigatório';
    else if (apenasDigitos(formData.horario).length < 8) e.horario = 'Informe o horário completo (ex: 08:00 - 17:00)';
    if (!formData.tell.trim()) e.tell = 'Telefone é obrigatório';
    else if (![10,11].includes(apenasDigitos(formData.tell).length)) e.tell = 'Telefone incompleto';
    if (!formData.dataNascimento) e.dataNascimento = 'Data obrigatória';
    if (!formData.sexo) e.sexo = 'Sexo é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email inválido';
    if (!formData.logradouro.trim()) e.logradouro = 'Logradouro é obrigatório';
    if (!formData.numero.trim()) e.numero = 'Número é obrigatório';
    if (!formData.bairro.trim()) e.bairro = 'Bairro é obrigatório';
    if (!formData.cidade.trim()) e.cidade = 'Cidade é obrigatória';
    if (!formData.uf.trim()) e.uf = 'UF é obrigatório';
    if (!formData.cep.trim()) e.cep = 'CEP é obrigatório';
    if (formData.password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) e.password = 'Mínimo 8 caracteres com maiúsculas, minúsculas e números';
    if (formData.password !== formData.confirmarPassword) e.confirmarPassword = 'As senhas não coincidem';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validarFormulario()) return;
    setCarregando(true);
    try {
      const [d,m,a] = formData.dataNascimento.split('/');
      await medicoService.cadastrar({
        nome: formData.nome,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf.replace(/\D/g,''),
        rg: limparRG(formData.rg),
        tell: formData.tell,
        horario: formData.horario,
        dataNascimento: `${a}-${m}-${d}`,
        crm: parseInt(formData.crm.replace(/\D/g,'')),  // API espera Long (número)
        sexo: formData.sexo.toUpperCase(),               // "MASCULINO" | "FEMININO" | "OUTRO"
        role: 'MEDICO',                                  // obrigatório
        especialidade: formData.especialidade,           // valor exato do enum
        endereco: {
          logradouro: formData.logradouro,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.uf,
          uf: formData.uf,
          cep: formData.cep.replace(/\D/g,''),
          complemento: ''
        }
      });

      navigate('/login');
    } catch (erro) {
      const msg = erro.response?.data?.message || erro.response?.data?.mensagem || 'Erro ao criar conta';
      setErros({ geral: msg });
      console.error('Erro no cadastro de médico:', erro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="register-form-container">
      <div className="register-form-card">
        <div className="form-header">
          <Logo />
          <button className="btn-voltar" onClick={onVoltarClick}>← Voltar</button>
          <h1>Cadastro de Médico</h1>
          <p>Preencha seus dados para se cadastrar</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {erros.geral && <div className="erro-geral">{erros.geral}</div>}

          <div className="form-row">
            <div className="form-group full-width">
              <label>Nome completo *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange}
                placeholder="Dr. João Silva" disabled={carregando} className={erros.nome ? 'input-erro' : ''} />
              {erros.nome && <span className="erro-texto">{erros.nome}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CPF *</label>
              <input type="text" name="cpf" value={formData.cpf} onChange={handleChange}
                placeholder="000.000.000-00" disabled={carregando} maxLength="14" className={erros.cpf ? 'input-erro' : ''} />
              {erros.cpf && <span className="erro-texto">{erros.cpf}</span>}
            </div>
            <div className="form-group">
              <label>RG *</label>
              <input type="text" name="rg" value={formData.rg} onChange={handleChange}
                placeholder="00.000.000-0" disabled={carregando} maxLength="12" className={erros.rg ? 'input-erro' : ''} />
              {erros.rg && <span className="erro-texto">{erros.rg}</span>}
            </div>
            <div className="form-group">
              <label>Data de nascimento *</label>
              <input type="text" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange}
                placeholder="dd/mm/aaaa" disabled={carregando} maxLength="10" className={erros.dataNascimento ? 'input-erro' : ''} />
              {erros.dataNascimento && <span className="erro-texto">{erros.dataNascimento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sexo *</label>
              <select name="sexo" value={formData.sexo} onChange={handleChange}
                disabled={carregando} className={erros.sexo ? 'input-erro' : ''}>
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
              {erros.sexo && <span className="erro-texto">{erros.sexo}</span>}
            </div>
            <div className="form-group">
              <label>CRM *</label>
              <input type="text" name="crm" value={formData.crm} onChange={handleChange} inputMode="numeric"
                placeholder="123456" disabled={carregando} maxLength="6" className={erros.crm ? 'input-erro' : ''} />
              {erros.crm && <span className="erro-texto">{erros.crm}</span>}
            </div>
            <div className="form-group">
              <label>Telefone *</label>
              <input type="text" name="tell" value={formData.tell} onChange={handleChange}
                placeholder="(11) 99999-9999" disabled={carregando} maxLength="15" className={erros.tell ? 'input-erro' : ''} />
              {erros.tell && <span className="erro-texto">{erros.tell}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Especialidade *</label>
              <select name="especialidade" value={formData.especialidade} onChange={handleChange}
                disabled={carregando} className={erros.especialidade ? 'input-erro' : ''}>
                <option value="">Selecione</option>
                {especialidades.map(esp => <option key={esp} value={esp}>{esp}</option>)}
              </select>
              {erros.especialidade && <span className="erro-texto">{erros.especialidade}</span>}
            </div>
            <div className="form-group">
              <label>Horário de atendimento *</label>
              <input type="text" name="horario" value={formData.horario} onChange={handleChange}
                placeholder="08:00 - 17:00" disabled={carregando} maxLength="13" className={erros.horario ? 'input-erro' : ''} />
              {erros.horario && <span className="erro-texto">{erros.horario}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="medico@hospital.com" disabled={carregando} className={erros.email ? 'input-erro' : ''} />
              {erros.email && <span className="erro-texto">{erros.email}</span>}
            </div>
          </div>

          <h3 style={{marginTop:'1rem', marginBottom:'0.5rem', color:'var(--text-primary)'}}>Endereço</h3>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Logradouro *</label>
              <input type="text" name="logradouro" value={formData.logradouro} onChange={handleChange}
                placeholder="Rua das Flores" disabled={carregando} className={erros.logradouro ? 'input-erro' : ''} />
              {erros.logradouro && <span className="erro-texto">{erros.logradouro}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Número *</label>
              <input type="text" name="numero" value={formData.numero} onChange={handleChange}
                placeholder="123" disabled={carregando} className={erros.numero ? 'input-erro' : ''} />
              {erros.numero && <span className="erro-texto">{erros.numero}</span>}
            </div>
            <div className="form-group">
              <label>Bairro *</label>
              <input type="text" name="bairro" value={formData.bairro} onChange={handleChange}
                placeholder="Centro" disabled={carregando} className={erros.bairro ? 'input-erro' : ''} />
              {erros.bairro && <span className="erro-texto">{erros.bairro}</span>}
            </div>
            <div className="form-group">
              <label>CEP *</label>
              <input type="text" name="cep" value={formData.cep} onChange={handleChange}
                placeholder="00000-000" disabled={carregando} maxLength="9" className={erros.cep ? 'input-erro' : ''} />
              {erros.cep && <span className="erro-texto">{erros.cep}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cidade *</label>
              <input type="text" name="cidade" value={formData.cidade} onChange={handleChange}
                placeholder="São Paulo" disabled={carregando} className={erros.cidade ? 'input-erro' : ''} />
              {erros.cidade && <span className="erro-texto">{erros.cidade}</span>}
            </div>
            <div className="form-group">
              <label>UF *</label>
              <input type="text" name="uf" value={formData.uf} onChange={handleChange}
                placeholder="SP" disabled={carregando} maxLength="2" className={erros.uf ? 'input-erro' : ''} />
              {erros.uf && <span className="erro-texto">{erros.uf}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Senha *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="Digite sua senha" disabled={carregando} className={erros.password ? 'input-erro' : ''} />
              {erros.password && <span className="erro-texto">{erros.password}</span>}
              <p className="password-hint">Mínimo 8 caracteres, com maiúsculas, minúsculas e números</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Confirmar Senha *</label>
              <input type="password" name="confirmarPassword" value={formData.confirmarPassword} onChange={handleChange}
                placeholder="Confirme sua senha" disabled={carregando} className={erros.confirmarPassword ? 'input-erro' : ''} />
              {erros.confirmarPassword && <span className="erro-texto">{erros.confirmarPassword}</span>}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={carregando}>
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login" className="link-login">Já tem uma conta? Entrar</Link>
        </div>
      </div>
    </div>
  );
}
