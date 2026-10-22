import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import '../styles/RegisterForms.css';
import { pacienteService } from '../services/PacienteService';
import { aplicarMascara, apenasDigitos, limparRG } from '../utils/mascaras';
import { mensagemDeErro } from '../utils/erros';
import { idade, lerDataBR } from '../utils/datas';

// "1,70" ou "1.70" -> 1.7 (NaN se não for número)
const paraNumero = (texto) => Number(String(texto).trim().replace(',', '.') || NaN);

export default function RegisterPatient({ onVoltarClick }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '', cpf: '', rg: '', dataNascimento: '', sexo: '',
    email: '', password: '', confirmarPassword: '', tell: '',
    altura: '', peso: '', convenio: '',
    logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: ''
  });

  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: aplicarMascara(name, value) }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validarCPF = (cpf) => {
    const c = cpf.replace(/\D/g,'');
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    let s = 0, r;
    for (let i = 1; i <= 9; i++) s += parseInt(c[i-1]) * (11-i);
    r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(c[9])) return false;
    s = 0;
    for (let i = 1; i <= 10; i++) s += parseInt(c[i-1]) * (12-i);
    r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
    return r === parseInt(c[10]);
  };

  const validarFormulario = () => {
    const e = {};
    if (!formData.nome.trim() || formData.nome.trim().split(' ').length < 2) e.nome = 'Digite seu nome completo';
    if (!validarCPF(formData.cpf)) e.cpf = 'CPF inválido';
    if (apenasDigitos(formData.rg).length < 8) e.rg = 'RG inválido';
    if (!formData.tell.trim()) e.tell = 'Telefone é obrigatório';
    else if (![10,11].includes(apenasDigitos(formData.tell).length)) e.tell = 'Telefone incompleto';
    const nascimento = lerDataBR(formData.dataNascimento);
    if (!formData.dataNascimento) e.dataNascimento = 'Data obrigatória';
    else if (!nascimento || idade(nascimento) > 120) e.dataNascimento = 'Data inválida';
    else if (idade(nascimento) < 18) e.dataNascimento = 'Você deve ter pelo menos 18 anos';
    if (!formData.sexo) e.sexo = 'Sexo é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email inválido';
    // Mesmas faixas que a API aceita.
    const altura = paraNumero(formData.altura);
    if (!(altura >= 0.1 && altura <= 3)) e.altura = 'Altura em metros, ex.: 1,70';
    const peso = paraNumero(formData.peso);
    if (!(peso >= 0.1 && peso <= 500)) e.peso = 'Peso em kg, ex.: 70';
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
      await pacienteService.cadastrar({
        nome: formData.nome,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g,''),
        rg: limparRG(formData.rg),
        password: formData.password,
        tell: formData.tell,
        dataNascimento: `${a}-${m}-${d}`,
        sexo: formData.sexo.toUpperCase(),   // API espera "MASCULINO" | "FEMININO" | "OUTRO"
        altura: paraNumero(formData.altura), // metros
        peso: paraNumero(formData.peso),     // kg
        convenio: formData.convenio.trim() || null,
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

      navigate('/login', { state: { mensagem: 'Conta criada! Entre com seu e-mail e senha.' } });
    } catch (erro) {
      setErros({ geral: mensagemDeErro(erro, 'Erro ao criar conta') });
      console.error('Erro no cadastro:', erro);
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
          <h1>Cadastro de Paciente</h1>
          <p>Preencha seus dados para se cadastrar</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {erros.geral && <div className="erro-geral">{erros.geral}</div>}

          <div className="form-row">
            <div className="form-group full-width">
              <label>Nome completo *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange}
                placeholder="Digite seu nome completo" disabled={carregando} className={erros.nome ? 'input-erro' : ''} />
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
              <label>Telefone *</label>
              <input type="text" name="tell" value={formData.tell} onChange={handleChange}
                placeholder="(11) 99999-9999" disabled={carregando} maxLength="15" className={erros.tell ? 'input-erro' : ''} />
              {erros.tell && <span className="erro-texto">{erros.tell}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Altura (m) *</label>
              <input type="text" inputMode="decimal" name="altura" value={formData.altura} onChange={handleChange}
                placeholder="1,70" disabled={carregando} maxLength="4" className={erros.altura ? 'input-erro' : ''} />
              {erros.altura && <span className="erro-texto">{erros.altura}</span>}
            </div>
            <div className="form-group">
              <label>Peso (kg) *</label>
              <input type="text" inputMode="decimal" name="peso" value={formData.peso} onChange={handleChange}
                placeholder="70" disabled={carregando} maxLength="5" className={erros.peso ? 'input-erro' : ''} />
              {erros.peso && <span className="erro-texto">{erros.peso}</span>}
            </div>
            <div className="form-group">
              <label>Convênio</label>
              <input type="text" name="convenio" value={formData.convenio} onChange={handleChange}
                placeholder="Opcional" disabled={carregando} maxLength="200" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="seu@email.com" disabled={carregando} className={erros.email ? 'input-erro' : ''} />
              {erros.email && <span className="erro-texto">{erros.email}</span>}
            </div>
          </div>

          <h3 style={{marginTop:'1rem', marginBottom:'0.5rem', color:'var(--text-primary)'}}>Endereço</h3>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Logradouro (rua/avenida) *</label>
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
