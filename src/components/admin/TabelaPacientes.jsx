import { useState } from 'react';
import { combinaBusca } from '../../utils/busca';
import { formatarData, paraData } from '../../utils/datas';
import { apenasDigitos, mascaraCPF, mascaraTelefone } from '../../utils/mascaras';

export default function TabelaPacientes({
  pacientes,
  fichasPorPaciente,
  carregando,
  erro,
  excluindoId,
  onExcluir,
}) {
  const [busca, setBusca] = useState('');

  // O CPF pode ser digitado com ou sem pontuação.
  const cpfBuscado = apenasDigitos(busca);

  const filtrados = pacientes
    .filter(
      (paciente) =>
        combinaBusca(busca, [paciente.nome, paciente.email]) ||
        (cpfBuscado.length >= 3 && apenasDigitos(paciente.cpf).includes(cpfBuscado)),
    )
    .sort((a, b) => String(a.nome ?? '').localeCompare(String(b.nome ?? ''), 'pt-BR'));

  return (
    <section id="pacientes" className="adm-bloco adm-ancora" aria-labelledby="titulo-pacientes">
      <div className="adm-section-head">
        <div>
          <h2 id="titulo-pacientes" className="adm-section-title">
            Pacientes <span className="adm-contador">{pacientes.length}</span>
          </h2>
          <p className="adm-section-subtitle">Contas criadas pelos próprios pacientes</p>
        </div>
        <div className="adm-ferramentas">
          <input
            type="search"
            className="adm-busca"
            placeholder="Buscar por nome, e-mail ou CPF"
            aria-label="Buscar pacientes"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>
      </div>

      {erro && <div className="adm-alerta">{erro}</div>}

      {carregando ? (
        <p className="adm-carregando">Carregando pacientes...</p>
      ) : pacientes.length === 0 ? (
        <div className="adm-vazio">
          <p>Nenhum paciente cadastrado ainda.</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="adm-vazio">
          <p>Nenhum paciente encontrado para “{busca}”.</p>
          <button type="button" className="adm-btn adm-btn-suave" onClick={() => setBusca('')}>
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="adm-tabela-wrap">
          <table className="adm-tabela">
            <thead>
              <tr>
                <th scope="col">Paciente</th>
                <th scope="col">CPF</th>
                <th scope="col">Telefone</th>
                <th scope="col">Nascimento</th>
                <th scope="col" className="adm-num">Pré-agendamentos</th>
                <th scope="col" className="adm-acoes-col">
                  <span className="adm-sr">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((paciente) => {
                const excluindo = excluindoId === paciente.id;
                return (
                  <tr key={paciente.id}>
                    <td>
                      <div className="adm-pessoa">
                        <strong>{paciente.nome}</strong>
                        <span>{paciente.email}</span>
                      </div>
                    </td>
                    <td className="adm-num-texto">{paciente.cpf ? mascaraCPF(paciente.cpf) : '—'}</td>
                    <td className="adm-num-texto">{paciente.tell ? mascaraTelefone(paciente.tell) : '—'}</td>
                    <td className="adm-num-texto">{formatarData(paraData(paciente.dataNascimento))}</td>
                    <td className="adm-num">{fichasPorPaciente.get(paciente.id) ?? 0}</td>
                    <td className="adm-acoes">
                      <button
                        type="button"
                        className="adm-btn adm-btn-perigo adm-btn-pequeno"
                        onClick={() => onExcluir(paciente)}
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
