import BarrasHorizontais from './BarrasHorizontais';

const MAX_LINHAS = 6;

export default function MedicosPorEspecialidade({ medicos, carregando }) {
  const contagem = new Map();
  medicos.forEach((medico) => {
    const especialidade = medico.especialidade || 'Não informada';
    contagem.set(especialidade, (contagem.get(especialidade) || 0) + 1);
  });

  const ordenadas = [...contagem.entries()]
    .map(([especialidade, valor]) => ({ id: especialidade, rotulo: especialidade, valor }))
    .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

  // Muitas especialidades deixariam o card enorme: as menores viram "Outras".
  let itens = ordenadas;
  if (ordenadas.length > MAX_LINHAS) {
    const resto = ordenadas.slice(MAX_LINHAS - 1);
    itens = [
      ...ordenadas.slice(0, MAX_LINHAS - 1),
      {
        id: 'outras',
        rotulo: `Outras (${resto.length})`,
        valor: resto.reduce((soma, item) => soma + item.valor, 0),
        dica: resto.map((item) => `${item.rotulo}: ${item.valor}`).join(', '),
      },
    ];
  }

  const maximo = Math.max(0, ...itens.map((item) => item.valor));

  let conteudo;
  if (carregando) {
    conteudo = <p className="adm-carregando">Carregando...</p>;
  } else if (medicos.length === 0) {
    conteudo = <p className="adm-card-vazio">Nenhum médico cadastrado.</p>;
  } else {
    conteudo = <BarrasHorizontais itens={itens} maximo={maximo} descricao="Médicos por especialidade" />;
  }

  return (
    <article className="adm-card">
      <header className="adm-card-head">
        <h2>Médicos por especialidade</h2>
        <p>
          {carregando
            ? 'Corpo clínico'
            : contagem.size === 1
              ? '1 especialidade atendida'
              : `${contagem.size} especialidades atendidas`}
        </p>
      </header>
      {conteudo}
    </article>
  );
}
