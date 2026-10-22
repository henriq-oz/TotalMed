import BarrasHorizontais from './BarrasHorizontais';

const porcentagem = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

export default function GraficoConsultas({ relatorio, carregando }) {
  const total = relatorio?.totalConsultas ?? 0;
  const finalizadas = relatorio?.consultasFinalizadas ?? 0;
  const canceladas = relatorio?.consultasCanceladas ?? 0;
  // O relatório só separa finalizadas e canceladas; o resto ainda está em andamento.
  const emAberto = Math.max(total - finalizadas - canceladas, 0);

  const itens = [
    { id: 'aberto', rotulo: 'Em aberto', valor: emAberto, dica: 'Agendadas, confirmadas ou em andamento' },
    { id: 'finalizadas', rotulo: 'Finalizadas', valor: finalizadas, dica: 'Com diagnóstico registrado pelo médico' },
    { id: 'canceladas', rotulo: 'Canceladas', valor: canceladas, dica: 'Canceladas pelo paciente ou pelo médico' },
  ].map((item) => ({ ...item, detalhe: `${porcentagem(item.valor, total)}%` }));

  let conteudo;
  if (carregando) {
    conteudo = <p className="adm-carregando">Carregando...</p>;
  } else if (!relatorio) {
    conteudo = <p className="adm-card-vazio">O relatório não carregou.</p>;
  } else if (total === 0) {
    conteudo = <p className="adm-card-vazio">Nenhuma consulta registrada ainda.</p>;
  } else {
    conteudo = <BarrasHorizontais itens={itens} maximo={total} descricao="Consultas por status" />;
  }

  return (
    <article className="adm-card">
      <header className="adm-card-head">
        <h2>Status das consultas</h2>
        <p>{relatorio ? `${total.toLocaleString('pt-BR')} no total` : 'Todas as consultas'}</p>
      </header>
      {conteudo}
    </article>
  );
}
