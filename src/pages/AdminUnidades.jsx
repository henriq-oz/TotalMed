import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { unidadeService } from '../services/UnidadeService';
import { mensagemDeErro } from '../utils/erros';
import { apenasDigitos, mascaraCEP, mascaraTelefone } from '../utils/mascaras';
import { useUsuario } from '../utils/sessao';
import '../styles/AdminDashboard.css';

// Campos do POST /clinicas (model Clinica + Endereco da API). A API só exige
// nome, telefone e endereço; o resto segue as mesmas regras de endereço do cadastro de médico.
const FORM_VAZIO = {
  nome: '', telefone: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '',
};

function Campo({ nome, rotulo, erro, largo, children }) {
  return (
    <div className={`adm-campo ${largo ? 'adm-campo-largo' : ''}`}>
      <label htmlFor={`unidade-${nome}`}>{rotulo}</label>
      {children}
      {erro && (
        <span className="adm-campo-erro" id={`unidade-${nome}-erro`}>
          {erro}
        </span>
      )}
    </div>
  );
}

export default function AdminUnidades() {
  const admin = useUsuario('ADMIN');

  const [unidades, setUnidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');

  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Exclusão, na tabela de unidades
  const [avisoLista, setAvisoLista] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const { data } = await unidadeService.listar();
      setUnidades(Array.isArray(data) ? data : []);
      setErroLista('');
    } catch (e) {
      console.error('Erro ao carregar unidades:', e);
      setErroLista(mensagemDeErro(e, 'As unidades não carregaram. Recarregue a página.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (admin) carregar();
  }, [admin, carregar]);

  useEffect(() => {
    if (avisoLista?.tipo !== 'sucesso') return undefined;
    const timer = setTimeout(() => setAvisoLista(null), 5000);
    return () => clearTimeout(timer);
  }, [avisoLista]);

  const excluir = async (unidade) => {
    const confirmado = window.confirm(
      `Excluir definitivamente a unidade ${unidade.nome}? Todos os pré-agendamentos dela e as entradas na fila ` +
        'ligadas a eles também serão apagados. Esta ação não pode ser desfeita.',
    );
    if (!confirmado) return;

    setExcluindoId(unidade.id);
    setAvisoLista(null);
    try {
      await unidadeService.deletar(unidade.id);
      setAvisoLista({ tipo: 'sucesso', texto: `A unidade ${unidade.nome} foi excluída.` });
      await carregar();
    } catch (e) {
      console.error('Erro ao excluir unidade:', e);
      if (e.response?.status === 404) {
        await carregar();
        setAvisoLista({ tipo: 'erro', texto: `A unidade ${unidade.nome} já tinha sido removida.` });
      } else {
        setAvisoLista({
          tipo: 'erro',
          texto: mensagemDeErro(e, 'Não foi possível excluir a unidade. Tente de novo.'),
        });
      }
    } finally {
      setExcluindoId(null);
    }
  };

  const handleChange = (evento) => {
    const { name, value } = evento.target;
    const mascaras = {
      telefone: mascaraTelefone,
      cep: mascaraCEP,
      uf: (v) => v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
    };
    setForm((anterior) => ({ ...anterior, [name]: mascaras[name] ? mascaras[name](value) : value }));
    if (erros[name]) setErros((anteriores) => ({ ...anteriores, [name]: '' }));
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome da unidade';
    if (![10, 11].includes(apenasDigitos(form.telefone).length)) e.telefone = 'Telefone incompleto';
    if (!form.logradouro.trim()) e.logradouro = 'Informe o logradouro';
    if (!form.numero.trim()) e.numero = 'Informe o número';
    if (!form.bairro.trim()) e.bairro = 'Informe o bairro';
    if (!form.cidade.trim()) e.cidade = 'Informe a cidade';
    if (form.uf.length !== 2) e.uf = 'UF inválida';
    if (apenasDigitos(form.cep).length !== 8) e.cep = 'CEP inválido';

    setErros(e);
    const primeiroErro = Object.keys(FORM_VAZIO).find((campo) => e[campo]);
    if (primeiroErro) document.getElementById(`unidade-${primeiroErro}`)?.focus();
    return !primeiroErro;
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    setErroGeral('');
    setAviso('');
    if (!validar()) return;

    setSalvando(true);
    try {
      const { data } = await unidadeService.cadastrar({
        nome: form.nome.trim(),
        telefone: form.telefone,
        endereco: {
          logradouro: form.logradouro.trim(),
          numero: form.numero.trim(),
          complemento: form.complemento.trim(),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          uf: form.uf,
          estado: form.uf,
          cep: apenasDigitos(form.cep),
        },
      });
      setAviso(`${data?.nome || form.nome.trim()} foi cadastrada e já aparece para os pacientes.`);
      setForm(FORM_VAZIO);
      carregar();
    } catch (e) {
      console.error('Erro ao cadastrar unidade:', e);
      setErroGeral(mensagemDeErro(e, 'Não foi possível cadastrar a unidade. Tente de novo.'));
    } finally {
      setSalvando(false);
    }
  };

  const propsDoCampo = (nome) => ({
    id: `unidade-${nome}`,
    name: nome,
    value: form[nome],
    onChange: handleChange,
    disabled: salvando,
    'aria-invalid': erros[nome] ? true : undefined,
    'aria-describedby': erros[nome] ? `unidade-${nome}-erro` : undefined,
  });

  if (!admin) return null;

  return (
    <AdminLayout>
      <header className="adm-header">
        <div>
          <h1 className="adm-title">Clínicas e hospitais</h1>
          <p className="adm-subtitle">Cadastre as unidades onde os pacientes podem fazer pré-agendamento</p>
        </div>
      </header>

      <section className="adm-card adm-bloco">
        <div className="adm-card-head">
          <h2>Nova unidade</h2>
        </div>

        <form className="adm-form" onSubmit={salvar} noValidate>
          {erroGeral && <div className="adm-alerta" role="alert">{erroGeral}</div>}
          {aviso && <div className="adm-alerta adm-alerta-sucesso" role="status">{aviso}</div>}

          <fieldset className="adm-fieldset">
            <legend>Dados da unidade</legend>
            <div className="adm-grid">
              <Campo nome="nome" rotulo="Nome" erro={erros.nome} largo>
                <input {...propsDoCampo('nome')} placeholder="Hospital Santa Clara" />
              </Campo>
              <Campo nome="telefone" rotulo="Telefone" erro={erros.telefone}>
                <input {...propsDoCampo('telefone')} placeholder="(11) 3333-4444" maxLength={15} inputMode="tel" />
              </Campo>
            </div>
          </fieldset>

          <fieldset className="adm-fieldset">
            <legend>Endereço</legend>
            <div className="adm-grid">
              <Campo nome="logradouro" rotulo="Logradouro" erro={erros.logradouro} largo>
                <input {...propsDoCampo('logradouro')} placeholder="Av. Paulista" />
              </Campo>
              <Campo nome="numero" rotulo="Número" erro={erros.numero}>
                <input {...propsDoCampo('numero')} placeholder="1000" />
              </Campo>
              <Campo nome="complemento" rotulo="Complemento (opcional)" erro={erros.complemento}>
                <input {...propsDoCampo('complemento')} placeholder="Bloco B" />
              </Campo>
              <Campo nome="bairro" rotulo="Bairro" erro={erros.bairro}>
                <input {...propsDoCampo('bairro')} placeholder="Bela Vista" />
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

          <div className="adm-modal-acoes">
            <button type="submit" className="adm-btn adm-btn-primario" disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Cadastrar unidade'}
            </button>
          </div>
        </form>
      </section>

      <section className="adm-bloco" aria-labelledby="titulo-unidades">
        <div className="adm-section-head">
          <div>
            <h2 id="titulo-unidades" className="adm-section-title">
              Unidades cadastradas <span className="adm-contador">{unidades.length}</span>
            </h2>
          </div>
        </div>

        {avisoLista && (
          <div
            className={`adm-alerta ${avisoLista.tipo === 'sucesso' ? 'adm-alerta-sucesso' : ''} adm-alerta-fechavel`}
            role={avisoLista.tipo === 'erro' ? 'alert' : 'status'}
          >
            <span>{avisoLista.texto}</span>
            <button type="button" className="adm-alerta-fechar" aria-label="Fechar aviso" onClick={() => setAvisoLista(null)}>
              ×
            </button>
          </div>
        )}

        {erroLista && <div className="adm-alerta" role="alert">{erroLista}</div>}

        {carregando ? (
          <p className="adm-carregando">Carregando unidades...</p>
        ) : unidades.length === 0 ? (
          !erroLista && <div className="adm-vazio"><p>Nenhuma unidade cadastrada ainda.</p></div>
        ) : (
          <div className="adm-tabela-wrap">
            <table className="adm-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Endereço</th>
                  <th>Situação</th>
                  <th scope="col" className="adm-acoes-col">
                    <span className="adm-sr">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((unidade) => {
                  const end = unidade.endereco || {};
                  const excluindo = excluindoId === unidade.id;
                  return (
                    <tr key={unidade.id}>
                      <td><strong>{unidade.nome}</strong></td>
                      <td>{mascaraTelefone(unidade.telefone) || '—'}</td>
                      <td>
                        {[end.logradouro && `${end.logradouro}, ${end.numero || 's/n'}`, end.bairro, end.cidade && `${end.cidade}/${end.uf || ''}`]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td><span className="adm-tag">{unidade.ativa ? 'Ativa' : 'Inativa'}</span></td>
                      <td className="adm-acoes">
                        <button
                          type="button"
                          className="adm-btn adm-btn-perigo adm-btn-pequeno"
                          onClick={() => excluir(unidade)}
                          disabled={excluindo}
                        >
                          {excluindo ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
