import { formatarHora, paraData } from '../../utils/datas';
import { lerStatusConsulta } from './statusConsulta';

export default function ConsultasHoje({ consultas, carregando, aviso }) {
  return (
    <section className="adm-bloco" aria-labelledby="titulo-consultas-hoje">
      <div className="adm-section-head">
        <div>
          <h2 id="titulo-consultas-hoje" className="adm-section-title">Consultas de hoje</h2>
          <p className="adm-section-subtitle">Agenda de todos os médicos, em ordem de horário</p>
        </div>
        {!carregando && consultas.length > 0 && (
          <span className="adm-contador">{consultas.length}</span>
        )}
      </div>

      {aviso && <div className="adm-alerta adm-alerta-suave">{aviso}</div>}

      {carregando ? (
        <p className="adm-carregando">Carregando agendas...</p>
      ) : consultas.length === 0 ? (
        <div className="adm-vazio">
          <p>Nenhuma consulta marcada para hoje.</p>
        </div>
      ) : (
        <ul className="adm-lista">
          {consultas.map((consulta) => {
            const status = lerStatusConsulta(consulta);
            return (
              <li className="adm-consulta" key={consulta.id}>
                <strong className="adm-consulta-hora">
                  {formatarHora(paraData(consulta.dataHoraConsulta))}
                </strong>

                <div className="adm-consulta-info">
                  <strong>{consulta.paciente?.nome || 'Paciente sem nome'}</strong>
                  <p>{consulta.motivo || 'Sem motivo informado'}</p>
                </div>

                <div className="adm-consulta-medico">
                  <strong>
                    {consulta.medico?.nome ? `Dr(a). ${consulta.medico.nome}` : 'Médico não informado'}
                  </strong>
                  <p>{consulta.medico?.especialidade || '—'}</p>
                </div>

                <span className={`adm-status ${status.classe}`}>{status.rotulo}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
