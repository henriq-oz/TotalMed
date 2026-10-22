import { useEffect, useState } from 'react';
import PatientLayout from '../components/PatientLayout';
import { pacienteService } from '../services/PacienteService';
import { mensagemDeErro } from '../utils/erros';
import { aplicarMascara, apenasDigitos } from '../utils/mascaras';
import { useUsuario } from '../utils/sessao';
import '../styles/PatientAccount.css';

const SEXO_LABELS = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  OUTRO: 'Outro',
};

// yyyy-mm-dd (formato que vem da API) -> dd/mm/aaaa (formato exibido/editado)
function isoParaBr(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  if (!a || !m || !d) return '';
  return `${d}/${m}/${a}`;
}

// "1,70" ou "1.70" -> 1.7 (NaN se não for número)
const paraNumero = (texto) => Number(String(texto).trim().replace(',', '.') || NaN);

// 1.7 -> "1,7"
const numeroBr = (valor) => (valor == null ? '' : String(valor).replace('.', ','));

function formatarCpf(cpf) {
  if (!cpf) return '—';
  return cpf.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2');
}

// Só o que o PATCH /pacientes/:id aceita. Data de nascimento e sexo ficam de
// fora: a API só troca esses dois no PUT, que exige a senha.
const CAMPO_VAZIO = {
  nome: '', email: '', tell: '', convenio: '', altura: '', peso: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '',
};

export default function PatientAccount() {
  const usuario = useUsuario('PACIENTE');
  const [paciente, setPaciente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erros, setErros] = useState({});
  const [formData, setFormData] = useState(CAMPO_VAZIO);
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [senhaData, setSenhaData] = useState({ novaSenha: '', confirmarNovaSenha: '' });

  const carregarPaciente = (id) => {
    setCarregando(true);
    setErro('');
    return pacienteService.buscar(id)
      .then((resposta) => setPaciente(resposta.data))
      .catch((e) => {
        console.error('Erro ao carregar dados da conta:', e);
        setErro('Não foi possível carregar suas informações agora.');
      })
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    if (usuario) carregarPaciente(usuario.id);
  }, [usuario]);

  const iniciarEdicao = () => {
    const end = paciente.endereco || {};
    setFormData({
      nome: paciente.nome || '',
      email: paciente.email || '',
      tell: aplicarMascara('tell', paciente.tell),
      convenio: paciente.convenio || '',
      altura: numeroBr(paciente.altura),
      peso: numeroBr(paciente.peso),
      logradouro: end.logradouro || '',
      numero: end.numero || '',
      complemento: end.complemento || '',
      bairro: end.bairro || '',
      cidade: end.cidade || '',
      uf: end.uf || '',
      cep: aplicarMascara('cep', end.cep),
    });
    setSenhaData({ novaSenha: '', confirmarNovaSenha: '' });
    setAlterarSenha(false);
    setErros({});
    setSucesso('');
    setEditando(true);
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setErros({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Mesmas máscaras do cadastro (telefone, CEP, altura e peso), pelo name do input.
    setFormData((prev) => ({ ...prev, [name]: aplicarMascara(name, value) }));
    if (erros[name]) setErros((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSenhaChange = (e) => {
    const { name, value } = e.target;
    setSenhaData((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) setErros((prev) => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const novosErros = {};
    if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) novosErros.email = 'Email inválido';
    if (!formData.tell.trim()) novosErros.tell = 'Telefone é obrigatório';
    else if (![10, 11].includes(apenasDigitos(formData.tell).length)) novosErros.tell = 'Telefone incompleto';
    // Mesmas faixas que a API aceita.
    const altura = paraNumero(formData.altura);
    if (!(altura >= 0.1 && altura <= 3)) novosErros.altura = 'Altura em metros, ex.: 1,70';
    const peso = paraNumero(formData.peso);
    if (!(peso >= 0.1 && peso <= 500)) novosErros.peso = 'Peso em kg, ex.: 70';
    if (alterarSenha) {
      if (senhaData.novaSenha.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(senhaData.novaSenha)) {
        novosErros.novaSenha = 'Mínimo 8 caracteres com maiúsculas, minúsculas e números';
      }
      if (senhaData.novaSenha !== senhaData.confirmarNovaSenha) {
        novosErros.confirmarNovaSenha = 'As senhas não coincidem';
      }
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setSalvando(true);
    setErro('');
    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        tell: formData.tell,
        altura: paraNumero(formData.altura),
        peso: paraNumero(formData.peso),
        // A API recusa texto vazio no PATCH; sem convênio digitado, o campo não vai.
        convenio: formData.convenio.trim() || undefined,
        endereco: {
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          uf: formData.uf,
          estado: formData.uf,
          cep: formData.cep.replace(/\D/g, ''),
        },
      };
      if (alterarSenha && senhaData.novaSenha) {
        payload.password = senhaData.novaSenha;
      }

      const resposta = await pacienteService.atualizar(paciente.id, payload);
      setPaciente(resposta.data);
      setEditando(false);
      setSucesso('Informações atualizadas com sucesso.');

      // Mantém nome/email do localStorage em sincronia (usado no restante do app)
      try {
        const usuarioSalvo = JSON.parse(localStorage.getItem('usuario')) || {};
        localStorage.setItem('usuario', JSON.stringify({ ...usuarioSalvo, nome: resposta.data.nome, email: resposta.data.email }));
      } catch {
        // localStorage indisponível — segue sem sincronizar
      }
    } catch (erroReq) {
      setErros({ geral: mensagemDeErro(erroReq, 'Erro ao salvar as alterações') });
      console.error('Erro ao atualizar conta:', erroReq);
    } finally {
      setSalvando(false);
    }
  };

  if (!usuario) return null;

  if (carregando) {
    return (
      <PatientLayout>
        <h1 className="dashboard-title">Minha Conta</h1>
        <p className="account-loading">Carregando...</p>
      </PatientLayout>
    );
  }

  if (erro && !paciente) {
    return (
      <PatientLayout>
        <h1 className="dashboard-title">Minha Conta</h1>
        <div className="dashboard-erro">{erro}</div>
      </PatientLayout>
    );
  }

  const end = paciente?.endereco || {};
  const enderecoCompleto = [end.logradouro, end.numero].filter(Boolean).join(', ')
    + (end.complemento ? ` - ${end.complemento}` : '')
    + (end.bairro ? `, ${end.bairro}` : '');
  const cidadeUf = [end.cidade, end.uf].filter(Boolean).join(' - ');

  return (
    <PatientLayout>
      <h1 className="dashboard-title">Minha Conta</h1>
      <p className="dashboard-greeting">Visualize e edite suas informações pessoais e de cadastro</p>

      {sucesso && !editando && <div className="account-sucesso">{sucesso}</div>}

      {!editando ? (
        <div className="account-card">
          <div className="account-card-header">
            <h2>Dados pessoais</h2>
            <button type="button" className="btn-primary btn-editar" onClick={iniciarEdicao}>
              Editar informações
            </button>
          </div>

          <div className="account-fields-grid">
            <div className="account-field">
              <span className="account-field-label">Nome completo</span>
              <span className="account-field-value">{paciente.nome}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">Email</span>
              <span className="account-field-value">{paciente.email}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">CPF</span>
              <span className="account-field-value">{formatarCpf(paciente.cpf)}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">RG</span>
              <span className="account-field-value">{paciente.rg || '—'}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">Telefone</span>
              <span className="account-field-value">{paciente.tell || '—'}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">Data de nascimento</span>
              <span className="account-field-value">{isoParaBr(paciente.dataNascimento) || '—'}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">Sexo</span>
              <span className="account-field-value">{SEXO_LABELS[paciente.sexo] || '—'}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">Altura</span>
              <span className="account-field-value">{paciente.altura != null ? `${numeroBr(paciente.altura)} m` : '—'}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">Peso</span>
              <span className="account-field-value">{paciente.peso != null ? `${numeroBr(paciente.peso)} kg` : '—'}</span>
            </div>
            <div className="account-field">
              <span className="account-field-label">Convênio</span>
              <span className="account-field-value">{paciente.convenio || '—'}</span>
            </div>
            <div className="account-field account-field-wide">
              <span className="account-field-label">Endereço</span>
              <span className="account-field-value">
                {enderecoCompleto.trim() ? `${enderecoCompleto}${cidadeUf ? `, ${cidadeUf}` : ''}${end.cep ? ` — CEP ${end.cep}` : ''}` : 'Nenhum endereço cadastrado'}
              </span>
            </div>
          </div>
          <p className="account-note">CPF, RG, data de nascimento e sexo não podem ser alterados por aqui. Se houver um erro nesses dados, procure a administração.</p>
        </div>
      ) : (
        <form className="account-card" onSubmit={handleSubmit}>
          <div className="account-card-header">
            <h2>Editar informações</h2>
          </div>

          {erros.geral && <div className="erro-geral">{erros.geral}</div>}

          <div className="form-row">
            <div className="form-group full-width">
              <label>Nome completo *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange}
                disabled={salvando} className={erros.nome ? 'input-erro' : ''} />
              {erros.nome && <span className="erro-texto">{erros.nome}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CPF</label>
              <input type="text" value={formatarCpf(paciente.cpf)} disabled />
            </div>
            <div className="form-group">
              <label>RG</label>
              <input type="text" value={paciente.rg || ''} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de nascimento</label>
              <input type="text" value={isoParaBr(paciente.dataNascimento)} disabled />
            </div>
            <div className="form-group">
              <label>Sexo</label>
              <input type="text" value={SEXO_LABELS[paciente.sexo] || ''} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Altura (m) *</label>
              <input type="text" inputMode="decimal" name="altura" value={formData.altura} onChange={handleChange}
                placeholder="1,70" maxLength="4" disabled={salvando} className={erros.altura ? 'input-erro' : ''} />
              {erros.altura && <span className="erro-texto">{erros.altura}</span>}
            </div>
            <div className="form-group">
              <label>Peso (kg) *</label>
              <input type="text" inputMode="decimal" name="peso" value={formData.peso} onChange={handleChange}
                placeholder="70" maxLength="5" disabled={salvando} className={erros.peso ? 'input-erro' : ''} />
              {erros.peso && <span className="erro-texto">{erros.peso}</span>}
            </div>
            <div className="form-group">
              <label>Convênio</label>
              <input type="text" name="convenio" value={formData.convenio} onChange={handleChange}
                placeholder="Opcional" maxLength="200" disabled={salvando} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                disabled={salvando} className={erros.email ? 'input-erro' : ''} />
              {erros.email && <span className="erro-texto">{erros.email}</span>}
            </div>
            <div className="form-group">
              <label>Telefone *</label>
              <input type="text" name="tell" value={formData.tell} onChange={handleChange}
                placeholder="(11) 99999-9999" disabled={salvando} className={erros.tell ? 'input-erro' : ''} />
              {erros.tell && <span className="erro-texto">{erros.tell}</span>}
            </div>
          </div>

          <h3 className="account-section-title">Endereço</h3>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Logradouro (rua/avenida)</label>
              <input type="text" name="logradouro" value={formData.logradouro} onChange={handleChange} disabled={salvando} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Número</label>
              <input type="text" name="numero" value={formData.numero} onChange={handleChange} disabled={salvando} />
            </div>
            <div className="form-group">
              <label>Complemento</label>
              <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} disabled={salvando} />
            </div>
            <div className="form-group">
              <label>Bairro</label>
              <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} disabled={salvando} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cidade</label>
              <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} disabled={salvando} />
            </div>
            <div className="form-group">
              <label>UF</label>
              <input type="text" name="uf" value={formData.uf} onChange={handleChange} maxLength="2" disabled={salvando} />
            </div>
            <div className="form-group">
              <label>CEP</label>
              <input type="text" name="cep" value={formData.cep} onChange={handleChange} maxLength="9" disabled={salvando} />
            </div>
          </div>

          <div className="account-senha-toggle">
            <button type="button" className="btn-link" onClick={() => setAlterarSenha((v) => !v)} disabled={salvando}>
              {alterarSenha ? 'Cancelar alteração de senha' : 'Alterar senha'}
            </button>
          </div>

          {alterarSenha && (
            <div className="form-row">
              <div className="form-group">
                <label>Nova senha *</label>
                <input type="password" name="novaSenha" value={senhaData.novaSenha} onChange={handleSenhaChange}
                  disabled={salvando} className={erros.novaSenha ? 'input-erro' : ''} />
                {erros.novaSenha && <span className="erro-texto">{erros.novaSenha}</span>}
              </div>
              <div className="form-group">
                <label>Confirmar nova senha *</label>
                <input type="password" name="confirmarNovaSenha" value={senhaData.confirmarNovaSenha} onChange={handleSenhaChange}
                  disabled={salvando} className={erros.confirmarNovaSenha ? 'input-erro' : ''} />
                {erros.confirmarNovaSenha && <span className="erro-texto">{erros.confirmarNovaSenha}</span>}
              </div>
            </div>
          )}

          <div className="account-form-actions">
            <button type="button" className="btn-secondary" onClick={cancelarEdicao} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      )}
    </PatientLayout>
  );
}
