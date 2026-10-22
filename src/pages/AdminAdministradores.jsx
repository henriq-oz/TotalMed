import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminService } from '../services/AdminService';
import { mensagemDeErro } from '../utils/erros';
import { mascaraCPF, mascaraTelefone } from '../utils/mascaras';
import { useUsuario } from '../utils/sessao';
import '../styles/AdminDashboard.css';

// Contas de administrador (GET /admin). O cadastro continua pela tela "Criar conta";
// aqui só se lista e exclui. A API recusa (422) excluir o último administrador.
export default function AdminAdministradores() {
  const admin = useUsuario('ADMIN');
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [aviso, setAviso] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const { data } = await adminService.listarAdmins();
      setAdmins(Array.isArray(data) ? data : []);
      setErroLista('');
    } catch (e) {
      console.error('Erro ao carregar administradores:', e);
      setErroLista(mensagemDeErro(e, 'Os administradores não carregaram. Recarregue a página.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (admin) carregar();
  }, [admin, carregar]);

  useEffect(() => {
    if (aviso?.tipo !== 'sucesso') return undefined;
    const timer = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(timer);
  }, [aviso]);

  const excluir = async (alvo) => {
    const propria = String(alvo.id) === String(admin.id);
    const confirmado = window.confirm(
      propria
        ? 'Excluir a sua própria conta de administrador? Você sairá do sistema e não poderá mais entrar com ela. Esta ação não pode ser desfeita.'
        : `Excluir definitivamente o administrador ${alvo.nome}? Essa conta perde o acesso ao sistema. Esta ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    setExcluindoId(alvo.id);
    setAviso(null);
    try {
      await adminService.deletar(alvo.id);
      if (propria) {
        // A sessão aponta para uma conta que não existe mais.
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setAviso({ tipo: 'sucesso', texto: `O administrador ${alvo.nome} foi excluído.` });
      await carregar();
    } catch (e) {
      console.error('Erro ao excluir administrador:', e);
      if (e.response?.status === 404) {
        await carregar();
        setAviso({ tipo: 'erro', texto: `O administrador ${alvo.nome} já tinha sido removido.` });
      } else {
        setAviso({
          tipo: 'erro',
          texto: mensagemDeErro(e, 'Não foi possível excluir o administrador. Tente de novo.'),
        });
      }
    } finally {
      setExcluindoId(null);
    }
  };

  if (!admin) return null;

  const ordenados = [...admins].sort((a, b) => String(a.nome ?? '').localeCompare(String(b.nome ?? ''), 'pt-BR'));

  return (
    <AdminLayout>
      <header className="adm-header">
        <div>
          <h1 className="adm-title">Administradores</h1>
          <p className="adm-subtitle">Contas com acesso ao painel e à recepção</p>
        </div>
      </header>

      <section className="adm-bloco" aria-labelledby="titulo-admins">
        <div className="adm-section-head">
          <div>
            <h2 id="titulo-admins" className="adm-section-title">
              Administradores cadastrados <span className="adm-contador">{admins.length}</span>
            </h2>
          </div>
        </div>

        {aviso && (
          <div
            className={`adm-alerta ${aviso.tipo === 'sucesso' ? 'adm-alerta-sucesso' : ''} adm-alerta-fechavel`}
            role={aviso.tipo === 'erro' ? 'alert' : 'status'}
          >
            <span>{aviso.texto}</span>
            <button type="button" className="adm-alerta-fechar" aria-label="Fechar aviso" onClick={() => setAviso(null)}>
              ×
            </button>
          </div>
        )}

        {erroLista && <div className="adm-alerta" role="alert">{erroLista}</div>}

        {carregando ? (
          <p className="adm-carregando">Carregando administradores...</p>
        ) : admins.length === 0 ? (
          !erroLista && <div className="adm-vazio"><p>Nenhum administrador cadastrado.</p></div>
        ) : (
          <div className="adm-tabela-wrap">
            <table className="adm-tabela">
              <thead>
                <tr>
                  <th scope="col">Administrador</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Telefone</th>
                  <th scope="col" className="adm-acoes-col">
                    <span className="adm-sr">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((item) => {
                  const excluindo = excluindoId === item.id;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="adm-pessoa">
                          <strong>{item.nome}{String(item.id) === String(admin.id) ? ' (você)' : ''}</strong>
                          <span>{item.email}</span>
                        </div>
                      </td>
                      <td className="adm-num-texto">{item.cpf ? mascaraCPF(item.cpf) : '—'}</td>
                      <td className="adm-num-texto">{item.tell ? mascaraTelefone(item.tell) : '—'}</td>
                      <td className="adm-acoes">
                        <button
                          type="button"
                          className="adm-btn adm-btn-perigo adm-btn-pequeno"
                          onClick={() => excluir(item)}
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
