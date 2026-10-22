const PacientesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8.5" cy="7.2" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 18c.6-3 2.8-4.9 5.5-4.9S13.4 15 14 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M14.5 4.6a2.8 2.8 0 0 1 0 5.3M16.4 13.5c1.5.7 2.5 2.2 2.8 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const PendentesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M11 6.8V11l2.8 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AceitasIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7.5 11.2 10 13.7l4.6-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RecusadasIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="m8.2 8.2 5.6 5.6M13.8 8.2l-5.6 5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function Cartao({ titulo, descricao, icone, valor, dica }) {
  return (
    <article className="adm-stat">
      <div className="adm-stat-head">
        <div>
          <h2>{titulo}</h2>
          <p>{descricao}</p>
        </div>
        <span className="adm-stat-icon">{icone}</span>
      </div>
      <p className="adm-stat-value">{valor}</p>
      <p className="adm-stat-hint">{dica}</p>
    </article>
  );
}

// relatorio = GET /admin/relatorio:
//   { totalPacientes, fichasPendentes, fichasAceitas, fichasRecusadas }
// aceitosParaHoje: null quando a lista de pré-agendamentos não carregou.
export default function Indicadores({ relatorio, carregando, aceitosParaHoje }) {
  const numero = (valor) =>
    carregando || relatorio == null ? '—' : Number(valor ?? 0).toLocaleString('pt-BR');

  return (
    <section className="adm-stats" aria-label="Indicadores gerais">
      <Cartao
        titulo="Pacientes"
        descricao="Contas ativas"
        icone={<PacientesIcon />}
        valor={numero(relatorio?.totalPacientes)}
        dica="Cadastrados no sistema"
      />
      <Cartao
        titulo="Pendentes"
        descricao="Pré-agendamentos"
        icone={<PendentesIcon />}
        valor={numero(relatorio?.fichasPendentes)}
        dica="Aguardando a análise da recepção"
      />
      <Cartao
        titulo="Aceitos"
        descricao="Pré-agendamentos"
        icone={<AceitasIcon />}
        valor={numero(relatorio?.fichasAceitas)}
        dica={
          carregando || aceitosParaHoje == null
            ? 'Com código, aguardando a chegada'
            : `${aceitosParaHoje} com chegada prevista para hoje`
        }
      />
      <Cartao
        titulo="Recusados"
        descricao="Pré-agendamentos"
        icone={<RecusadasIcon />}
        valor={numero(relatorio?.fichasRecusadas)}
        dica="Com justificativa para o paciente"
      />
    </section>
  );
}
