import { useEffect, useState } from 'react';
import { adminService } from '../../services/AdminService';
import { mensagemDeErro } from '../../utils/erros';
import {
  aplicarMascara,
  apenasDigitos,
  limparRG,
  mascaraCEP,
  mascaraCPF,
  mascaraTelefone,
} from '../../utils/mascaras';

// Valores exatos dos enums Especialidade e Sexo da API.
const ESPECIALIDADES = [
  'Cardiologia', 'Cirurgia', 'Dermatologia', 'Enfermagem', 'Ginecologia',
  'Oftalmologia', 'Ortopedia', 'Otorrinolaringologia', 'Pediatria',
  'Psiquiatria', 'Radiologia', 'Urologia', 'Outro',
];

const SEXOS = [
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'FEMININO', rotulo: 'Feminino' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

const CAMPOS_ENDERECO = ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep'];

// Campos que o PATCH /admin/medicos/{id} aceita (PatchMedicoDTO), além do endereço.
const CAMPOS_EDITAVEIS = ['email', 'tell', 'horario', 'especialidade'];

const FORM_VAZIO = {
  nome: '', cpf: '', rg: '', dataNascimento: '', sexo: '',
  crm: '', especialidade: '', horario: '',
  email: '', tell: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '',
  password: '', confirmarPassword: '',
};

function preencherComMedico(medico) {
  const endereco = medico.endereco || {};
  return {
    ...FORM_VAZIO,
    email: medico.email || '',
    tell: mascaraTelefone(medico.tell),
    especialidade: medico.especialidade || '',
    horario: medico.horario || '',
    logradouro: endereco.logradouro || '',
    numero: endereco.numero || '',
    complemento: endereco.complemento || '',
    bairro: endereco.bairro || '',
    cidade: endereco.cidade || '',
    uf: endereco.uf || '',
    cep: mascaraCEP(endereco.cep),
  };
}

function validarCPF(cpf) {
  const d = apenasDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const digito = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

// "dd/mm/aaaa" -> Date, ou null se a data não existir (ex: 31/02/2000).
function lerDataBR(texto) {
  const [dia, mes, ano] = texto.split('/').map(Number);
  if (!dia || !mes || !ano || ano < 1900) return null;
  const data = new Date(ano, mes - 1, dia);
  return data.getDate() === dia && data.getMonth() === mes - 1 ? data : null;
}

function idade(nascimento, hoje) {
  const anos = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  return aindaNaoFezAniversario ? anos - 1 : anos;
}

const montarEndereco = (form) => ({
  logradouro: form.logradouro.trim(),
  numero: form.numero.trim(),
  complemento: form.complemento.trim(),
  bairro: form.bairro.trim(),
  cidade: form.cidade.trim(),
  uf: form.uf,
  estado: form.uf,
  cep: apenasDigitos(form.cep),
});

function Campo({ nome, rotulo, erro, largo, children }) {
  return (
    <div className={`adm-campo ${largo ? 'adm-campo-largo' : ''}`}>
      <label htmlFor={`medico-${nome}`}>{rotulo}</label>
      {children}
      {erro && (
        <span className="adm-campo-erro" id={`medico-${nome}-erro`}>
          {erro}
        </span>
      )}
    </div>
  );
}

export default function MedicoFormModal({ medico, onFechar, onSalvo }) {
  const editando = Boolean(medico);
  const [original] = useState(() => (editando ? preencherComMedico(medico) : FORM_VAZIO));
  const [form, setForm] = useState(original);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape' && !salvando) onFechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [onFechar, salvando]);

  const mudou = (campo) => form[campo] !== original[campo];
  const enderecoMudou = CAMPOS_ENDERECO.some(mudou);

  const handleChange = (evento) => {
    const { name, value } = evento.target;
    const valor =
      name === 'uf' ? value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) : aplicarMascara(name, value);
    setForm((anterior) => ({ ...anterior, [name]: valor }));
    if (erros[name]) setErros((anteriores) => ({ ...anteriores, [name]: '' }));
  };

  const validar = () => {
    const e = {};
    // Na edição só validamos o que foi alterado, para um cadastro antigo com
    // algum campo fora do padrão não impedir a correção dos outros.
    const checar = (campo) => !editando || mudou(campo);

    if (!editando) {
      if (form.nome.trim().split(/\s+/).length < 2) e.nome = 'Digite o nome completo';
      if (!validarCPF(form.cpf)) e.cpf = 'CPF inválido';
      if (apenasDigitos(form.rg).length < 8) e.rg = 'RG inválido';

      const nascimento = lerDataBR(form.dataNascimento);
      if (!nascimento) e.dataNascimento = 'Data inválida';
      else if (idade(nascimento, new Date()) < 18) e.dataNascimento = 'Precisa ter pelo menos 18 anos';

      if (!form.sexo) e.sexo = 'Selecione o sexo';
      if (apenasDigitos(form.crm).length < 4) e.crm = 'CRM inválido';

      if (form.password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
        e.password = 'Mínimo 8 caracteres, com maiúsculas, minúsculas e números';
      }
      if (form.password !== form.confirmarPassword) e.confirmarPassword = 'As senhas não coincidem';
    }

    if (checar('especialidade') && !form.especialidade) e.especialidade = 'Selecione a especialidade';
    if (checar('horario') && apenasDigitos(form.horario).length < 8) {
      e.horario = 'Horário completo, ex: 08:00 - 17:00';
    }
    if (checar('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'E-mail inválido';
    if (checar('tell') && ![10, 11].includes(apenasDigitos(form.tell).length)) e.tell = 'Telefone incompleto';

    if (!editando || enderecoMudou) {
      if (!form.logradouro.trim()) e.logradouro = 'Informe o logradouro';
      if (!form.numero.trim()) e.numero = 'Informe o número';
      if (!form.bairro.trim()) e.bairro = 'Informe o bairro';
      if (!form.cidade.trim()) e.cidade = 'Informe a cidade';
      if (form.uf.length !== 2) e.uf = 'UF inválida';
      if (apenasDigitos(form.cep).length !== 8) e.cep = 'CEP inválido';
    }

    setErros(e);
    const primeiroErro = Object.keys(FORM_VAZIO).find((campo) => e[campo]);
    if (primeiroErro) document.getElementById(`medico-${primeiroErro}`)?.focus();
    return !primeiroErro;
  };

  const cadastrar = async () => {
    const [dia, mes, ano] = form.dataNascimento.split('/');
    const { data } = await adminService.cadastrarMedico({
      nome: form.nome.trim(),
      email: form.email.trim(),
      password: form.password,
      cpf: apenasDigitos(form.cpf),
      rg: limparRG(form.rg),
      tell: form.tell,
      horario: form.horario,
      dataNascimento: `${ano}-${mes}-${dia}`,
      crm: Number(apenasDigitos(form.crm)),
      sexo: form.sexo,
      role: 'MEDICO',
      especialidade: form.especialidade,
      endereco: montarEndereco(form),
    });
    onSalvo(data, 'cadastro');
  };

  const atualizar = async () => {
    const corpo = {};
    CAMPOS_EDITAVEIS.filter(mudou).forEach((campo) => {
      corpo[campo] = campo === 'email' ? form.email.trim() : form[campo];
    });
    if (enderecoMudou) corpo.endereco = montarEndereco(form);

    if (Object.keys(corpo).length === 0) {
      onFechar();
      return;
    }

    const { data } = await adminService.atualizarMedico(medico.id, corpo);
    onSalvo(data, 'edicao');
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setSalvando(true);
    try {
      if (editando) await atualizar();
      else await cadastrar();
    } catch (erro) {
      console.error('Erro ao salvar médico:', erro);
      setErroGeral(
        mensagemDeErro(
          erro,
          editando
            ? 'Não foi possível salvar as alterações. Tente de novo.'
            : 'Não foi possível cadastrar. Confira se CRM, RG e telefone já não pertencem a outro usuário.',
        ),
      );
    } finally {
      setSalvando(false);
    }
  };

  const propsDoCampo = (nome) => ({
    id: `medico-${nome}`,
    name: nome,
    value: form[nome],
    onChange: handleChange,
    disabled: salvando,
    'aria-invalid': erros[nome] ? true : undefined,
    'aria-describedby': erros[nome] ? `medico-${nome}-erro` : undefined,
  });

  return (
    <div
      className="adm-modal-fundo"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !salvando) onFechar();
      }}
    >
      <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-medico">
        <header className="adm-modal-head">
          <div>
            <h3 id="titulo-modal-medico">{editando ? 'Editar médico' : 'Cadastrar médico'}</h3>
            <p>
              {editando
                ? 'Nome, CPF, RG e CRM não podem ser alterados por aqui.'
                : 'O médico vai entrar no sistema com o e-mail e a senha definidos aqui.'}
            </p>
          </div>
          <button
            type="button"
            className="adm-modal-fechar"
            aria-label="Fechar"
            onClick={onFechar}
            disabled={salvando}
          >
            ×
          </button>
        </header>

        {editando && (
          <dl className="adm-resumo">
            <div>
              <dt>Nome</dt>
              <dd>{medico.nome}</dd>
            </div>
            <div>
              <dt>CRM</dt>
              <dd>{medico.crm ?? '—'}</dd>
            </div>
            <div>
              <dt>CPF</dt>
              <dd>{medico.cpf ? mascaraCPF(medico.cpf) : '—'}</dd>
            </div>
          </dl>
        )}

        <form className="adm-form" onSubmit={salvar} noValidate>
          {erroGeral && (
            <div className="adm-alerta" role="alert">
              {erroGeral}
            </div>
          )}

          {!editando && (
            <fieldset className="adm-fieldset">
              <legend>Dados pessoais</legend>
              <div className="adm-grid">
                <Campo nome="nome" rotulo="Nome completo" erro={erros.nome} largo>
                  <input {...propsDoCampo('nome')} placeholder="Dr. João Silva" autoFocus />
                </Campo>
                <Campo nome="cpf" rotulo="CPF" erro={erros.cpf}>
                  <input {...propsDoCampo('cpf')} placeholder="000.000.000-00" maxLength={14} inputMode="numeric" />
                </Campo>
                <Campo nome="rg" rotulo="RG" erro={erros.rg}>
                  <input {...propsDoCampo('rg')} placeholder="00.000.000-0" maxLength={12} />
                </Campo>
                <Campo nome="dataNascimento" rotulo="Data de nascimento" erro={erros.dataNascimento}>
                  <input
                    {...propsDoCampo('dataNascimento')}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    inputMode="numeric"
                  />
                </Campo>
                <Campo nome="sexo" rotulo="Sexo" erro={erros.sexo}>
                  <select {...propsDoCampo('sexo')}>
                    <option value="">Selecione</option>
                    {SEXOS.map((sexo) => (
                      <option key={sexo.valor} value={sexo.valor}>
                        {sexo.rotulo}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            </fieldset>
          )}

          <fieldset className="adm-fieldset">
            <legend>Atuação</legend>
            <div className="adm-grid">
              {!editando && (
                <Campo nome="crm" rotulo="CRM" erro={erros.crm}>
                  <input {...propsDoCampo('crm')} placeholder="123456" maxLength={6} inputMode="numeric" />
                </Campo>
              )}
              <Campo nome="especialidade" rotulo="Especialidade" erro={erros.especialidade}>
                <select {...propsDoCampo('especialidade')}>
                  <option value="">Selecione</option>
                  {ESPECIALIDADES.map((especialidade) => (
                    <option key={especialidade} value={especialidade}>
                      {especialidade}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo nome="horario" rotulo="Horário de atendimento" erro={erros.horario}>
                <input {...propsDoCampo('horario')} placeholder="08:00 - 17:00" maxLength={13} inputMode="numeric" />
              </Campo>
            </div>
          </fieldset>

          <fieldset className="adm-fieldset">
            <legend>Contato</legend>
            <div className="adm-grid">
              <Campo nome="email" rotulo="E-mail" erro={erros.email} largo>
                <input
                  {...propsDoCampo('email')}
                  type="email"
                  placeholder="medico@hospital.com"
                  autoFocus={editando}
                />
              </Campo>
              <Campo nome="tell" rotulo="Telefone" erro={erros.tell}>
                <input {...propsDoCampo('tell')} placeholder="(11) 99999-9999" maxLength={15} inputMode="tel" />
              </Campo>
            </div>
          </fieldset>

          <fieldset className="adm-fieldset">
            <legend>Endereço</legend>
            <div className="adm-grid">
              <Campo nome="logradouro" rotulo="Logradouro" erro={erros.logradouro} largo>
                <input {...propsDoCampo('logradouro')} placeholder="Rua das Flores" />
              </Campo>
              <Campo nome="numero" rotulo="Número" erro={erros.numero}>
                <input {...propsDoCampo('numero')} placeholder="123" />
              </Campo>
              <Campo nome="complemento" rotulo="Complemento (opcional)" erro={erros.complemento}>
                <input {...propsDoCampo('complemento')} placeholder="Sala 4" />
              </Campo>
              <Campo nome="bairro" rotulo="Bairro" erro={erros.bairro}>
                <input {...propsDoCampo('bairro')} placeholder="Centro" />
              </Campo>
              <Campo nome="cidade" rotulo="Cidade" erro={erros.cidade}>
                <input {...propsDoCampo('cidade')} placeholder="São Paulo" />
              </Campo>
              <Campo nome="uf" rotulo="UF" erro={erros.uf}>
                <input {...propsDoCampo('uf')} placeholder="SP" maxLength={2} />
              </Campo>
              <Campo nome="cep" rotulo="CEP" erro={erros.cep}>
                <input {...propsDoCampo('cep')} placeholder="00000-000" maxLength={9} inputMode="numeric" />
              </Campo>
            </div>
          </fieldset>

          {!editando && (
            <fieldset className="adm-fieldset">
              <legend>Acesso</legend>
              <div className="adm-grid">
                <Campo nome="password" rotulo="Senha" erro={erros.password}>
                  <input {...propsDoCampo('password')} type="password" autoComplete="new-password" />
                </Campo>
                <Campo nome="confirmarPassword" rotulo="Confirmar senha" erro={erros.confirmarPassword}>
                  <input {...propsDoCampo('confirmarPassword')} type="password" autoComplete="new-password" />
                </Campo>
              </div>
              <p className="adm-dica">Mínimo 8 caracteres, com maiúsculas, minúsculas e números.</p>
            </fieldset>
          )}

          <div className="adm-modal-acoes">
            <button type="button" className="adm-btn adm-btn-suave" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="adm-btn adm-btn-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
