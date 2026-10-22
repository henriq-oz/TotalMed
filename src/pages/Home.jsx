import { Link } from 'react-router-dom';
import logo from '../assets/img_totalmed.png';
import BotaoTema from '../components/BotaoTema';
import '../styles/Home.css';

const passos = [
  {
    titulo: 'Faça o pré-agendamento',
    texto: 'Escolha a unidade, o dia, a hora e o tipo de ficha: Normal ou Preferencial.',
  },
  {
    titulo: 'A recepção analisa sua solicitação',
    texto: 'A equipe da recepção confere o pré-agendamento e pode aceitá-lo ou recusá-lo. Em caso de recusa, o motivo será informado.',
  },
  {
    titulo: 'Receba seu código de atendimento',
    texto: 'Se o pré-agendamento for aceito, o sistema gera um código único para você apresentar na unidade.',
  },
  {
    titulo: 'Apresente o código na recepção',
    texto: 'Ao chegar à unidade, apresente seu código. Após a validação, você entra na fila de espera da triagem.',
  },
];

export default function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <Link to="/" className="home-logo">
          <img src={logo} alt="TotalMed, página inicial" />
        </Link>
        <nav className="home-nav" aria-label="Acesso">
          <Link to="/login" className="home-link">Entrar</Link>
          <Link to="/criar-conta" className="home-btn home-btn--small">Criar conta</Link>
          <BotaoTema />
        </nav>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-hero-text">
            <h1>Chegue à consulta sem enfrentar fila.</h1>
            <p className="home-lead">
              Faça o pré-agendamento pelo TotalMed antes de sair de casa. A recepção analisa o pedido
              com antecedência e, se aceitar, você recebe um código. Na chegada, é só apresentá-lo.
            </p>
            <div className="home-actions">
              <Link to="/criar-conta" className="home-btn">Criar minha conta</Link>
              <a href="#como-funciona" className="home-link">Ver como funciona</a>
            </div>
          </div>

          <figure className="home-ticket" aria-label="Exemplo de código de atendimento">
            <div className="home-ticket-top">
              <span className="home-ticket-label">Seu código de atendimento</span>
              <strong className="home-ticket-code">B73A-113</strong>
            </div>
            <dl className="home-ticket-info">
              <div><dt>Paciente</dt><dd>Maria Souza</dd></div>
              <div><dt>Unidade</dt><dd>Clínica São Lucas</dd></div>
              <div><dt>Horário</dt><dd>Hoje, 14h30</dd></div>
            </dl>
            <p className="home-ticket-stamp"><span aria-hidden="true">✓</span>Validado pela clínica</p>
          </figure>
        </section>

        <section id="como-funciona" className="home-section">
          <h2>Como funciona</h2>
          <p className="home-section-intro">
            A burocracia sai da recepção e acontece antes da consulta, no seu tempo.
          </p>
          <ol className="home-steps">
            {passos.map((passo, i) => (
              <li key={passo.titulo}>
                <span className="home-step-num" aria-hidden="true">{i + 1}</span>
                <h3>{passo.titulo}</h3>
                <p>{passo.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-section home-section--mint">
          <h2>Bom para os dois lados do balcão</h2>
          <div className="home-sides">
            <div>
              <h3>Para pacientes</h3>
              <ul>
                <li>Nada de fila na recepção para fazer cadastro.</li>
                <li>Pedido feito pelo celular ou computador, no seu tempo.</li>
                <li>Tudo conferido antes de você chegar.</li>
              </ul>
            </div>
            <div>
              <h3>Para clínicas e hospitais</h3>
              <ul>
                <li>Recepção menos cheia e entrada mais rápida.</li>
                <li>Pedidos analisados antes da chegada do paciente.</li>
                <li>Fila de triagem organizada por prioridade.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="home-cta">
          <h2>Sua próxima consulta pode começar em casa.</h2>
          <p>Crie sua conta, faça o pré-cadastro e receba seu código de atendimento.</p>
          <div className="home-actions">
            <Link to="/criar-conta" className="home-btn home-btn--light">Criar minha conta</Link>
            <Link to="/login" className="home-link home-link--light">Já tenho conta</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>© {new Date().getFullYear()} TotalMed. Pré-atendimento digital para clínicas e hospitais.</p>
      </footer>
    </div>
  );
}
