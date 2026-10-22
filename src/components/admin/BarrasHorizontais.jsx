// Gráfico de barras de uma série só (uma cor): cada linha mostra rótulo e valor
// em texto, então a barra só reforça a comparação e nenhum número depende de hover.
export default function BarrasHorizontais({ itens, maximo, descricao }) {
  const escala = maximo > 0 ? maximo : 1;

  return (
    <ul className="adm-barras" aria-label={descricao}>
      {itens.map((item) => {
        const largura = Math.min((item.valor / escala) * 100, 100);
        return (
          <li key={item.id} className="adm-barra-linha" title={item.dica}>
            <div className="adm-barra-texto">
              <span className="adm-barra-rotulo">{item.rotulo}</span>
              <span className="adm-barra-valor">
                {item.valor.toLocaleString('pt-BR')}
                {item.detalhe && <span className="adm-barra-detalhe"> · {item.detalhe}</span>}
              </span>
            </div>
            <div className="adm-barra-trilho" aria-hidden="true">
              <div
                className={`adm-barra ${item.valor > 0 ? 'adm-barra-com-valor' : ''}`}
                style={{ width: `${largura}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
