import BarrasHorizontais from './BarrasHorizontais';

const porcentagem = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

// Cartão com uma contagem dos pré-agendamentos (por status, por unidade).
// itens: [{ id, rotulo, valor }]
export default function GraficoFichas({ titulo, itens, total, carregando, falhou }) {
  let conteudo;
  if (carregando) {
    conteudo = <p className="adm-carregando">Carregando...</p>;
  } else if (falhou) {
    conteudo = <p className="adm-card-vazio">Os pré-agendamentos não carregaram.</p>;
  } else if (total === 0) {
    conteudo = <p className="adm-card-vazio">Nenhum pré-agendamento recebido ainda.</p>;
  } else {
    conteudo = (
      <BarrasHorizontais
        itens={itens.map((item) => ({ ...item, detalhe: `${porcentagem(item.valor, total)}%` }))}
        maximo={total}
        descricao={titulo}
      />
    );
  }

  return (
    <article className="adm-card">
      <header className="adm-card-head">
        <h2>{titulo}</h2>
        <p>{carregando || falhou ? 'Todos os pedidos' : `${total.toLocaleString('pt-BR')} no total`}</p>
      </header>
      {conteudo}
    </article>
  );
}
