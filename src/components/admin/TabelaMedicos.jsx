import { useState } from 'react';
import { combinaBusca } from '../../utils/busca';
import { mascaraTelefone } from '../../utils/mascaras';

export default function TabelaMedicos({
  medicos,
  consultasPorMedico,
  carregando,
  erro,
  excluindoId,
  onCadastrar,
  onEditar,
  onExcluir,
}) {
  const [busca, setBusca] = useState('');

  const visiveis = medicos
    .filter((medico) =>
      combinaBusca(busca, [medico.nome, medico.email, medico.crm, medico.especialidade]),
    )
    .sort((a, b) => String(a.nome ?? '').localeCompare(String(b.nome ?? ''), 'pt-BR'));

  return (
    <section id="medicos" className="adm-bloco adm-ancora" aria-labelledby="titulo-medicos">
      <div className="adm-section-head">
        <div>
          <h2 id="titulo-medicos" className="adm-section-title">
            Médicos <span className="adm-contador">{medicos.length}</span>
          </h2>
          <p className="adm-section-subtitle">Cadastre, edite ou remova médicos do corpo clínico</p>
        </div>
        <div className="adm-ferramentas">
          <input
            type="search"
            className="adm-busca"
            placeholder="Buscar por nome, CRM ou especialidade"
            aria-label="Buscar médicos"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
          <button type="button" className="adm-btn adm-btn-primario" onClick={onCadastrar}>
            + Cadastrar médico
          </button>
        </div>
      </div>

      {erro && <div className="adm-alerta">{erro}</div>}

      {carregando ? (
        <p className="adm-carregando">Carregando médicos...</p>
      ) : medicos.length === 0 ? (
        <div className="adm-vazio">
          <p>Nenhum médico cadastrado ainda.</p>
          <button type="button" className="adm-btn adm-btn-primario" onClick={onCadastrar}>
            Cadastrar o primeiro médico
          </button>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="adm-vazio">
          <p>Nenhum médico encontrado para “{busca}”.</p>
          <button type="button" className="adm-btn adm-btn-suave" onClick={() => setBusca('')}>
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="adm-tabela-wrap">
          <table className="adm-tabela">
            <thead>
              <tr>
                <th scope="col">Médico</th>
                <th scope="col">CRM</th>
                <th scope="col">Especialidade</th>
                <th scope="col">Horário</th>
                <th scope="col">Telefone</th>
                <th scope="col" className="adm-num">Consultas</th>
                <th scope="col" className="adm-acoes-col">
                  <span className="adm-sr">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((medico) => {
                const excluindo = excluindoId === medico.id;
                return (
                  <tr key={medico.id}>
                    <td>
                      <div className="adm-pessoa">
                        <strong>{medico.nome}</strong>
                        <span>{medico.email}</span>
                      </div>
                    </td>
                    <td className="adm-num-texto">{medico.crm ?? '—'}</td>
                    <td>
                      {medico.especialidade ? (
                        <span className="adm-tag">{medico.especialidade}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="adm-num-texto">{medico.horario || '—'}</td>
                    <td className="adm-num-texto">{medico.tell ? mascaraTelefone(medico.tell) : '—'}</td>
                    <td className="adm-num">{consultasPorMedico.get(medico.id) ?? 0}</td>
                    <td className="adm-acoes">
                      <button
                        type="button"
                        className="adm-btn adm-btn-suave adm-btn-pequeno"
                        onClick={() => onEditar(medico)}
                        disabled={excluindo}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-perigo adm-btn-pequeno"
                        onClick={() => onExcluir(medico)}
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
  );
}
