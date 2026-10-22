import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "./Logo";
import "../styles/RegisterForms.css";
import { adminService } from "../services/AdminService";
import { aplicarMascara, apenasDigitos, limparRG } from "../utils/mascaras";
import { mensagemDeErro } from "../utils/erros";
import { idade, lerDataBR } from "../utils/datas";

export default function RegisterAdmin({ onVoltarClick }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    tell: "", // <-- adicionar
    email: "",
    password: "",
    confirmarPassword: "",
    dataNascimento: "",
    sexo: "",
  });

  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: aplicarMascara(name, value),
    }));

    if (erros[name]) {
      setErros((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validarCPF = (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    let soma = 0;
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

    return true;
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = "Nome completo é obrigatório";
    } else if (formData.nome.trim().split(" ").length < 2) {
      novosErros.nome = "Digite seu nome completo";
    }

    if (!formData.cpf.trim()) {
      novosErros.cpf = "CPF é obrigatório";
    } else if (!validarCPF(formData.cpf)) {
      novosErros.cpf = "CPF inválido";
    }

    if (!formData.rg.trim()) {
      novosErros.rg = "RG é obrigatório";
    } else if (apenasDigitos(formData.rg).length < 8) {
      novosErros.rg = "RG inválido";
    }

    if (!formData.tell.trim()) {
      novosErros.tell = "Telefone é obrigatório";
    } else if (![10, 11].includes(apenasDigitos(formData.tell).length)) {
      novosErros.tell = "Telefone incompleto";
    }

    const nascimento = lerDataBR(formData.dataNascimento);
    if (!formData.dataNascimento) {
      novosErros.dataNascimento = "Data de nascimento é obrigatória";
    } else if (!nascimento || idade(nascimento) > 120) {
      novosErros.dataNascimento = "Data de nascimento inválida";
    } else if (idade(nascimento) < 18) {
      novosErros.dataNascimento = "Você deve ter pelo menos 18 anos";
    }

    if (!formData.sexo) {
      novosErros.sexo = "Sexo é obrigatório";
    }

    if (!formData.email.trim()) {
      novosErros.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      novosErros.email = "Email inválido";
    }

    if (!formData.password.trim()) {
      novosErros.password = "Senha é obrigatória";
    } else if (formData.password.length < 8) {
      novosErros.password = "Senha deve ter no mínimo 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      novosErros.password =
        "Senha deve conter maiúsculas, minúsculas e números";
    }

    if (!formData.confirmarPassword.trim()) {
      novosErros.confirmarPassword = "Confirme sua senha";
    } else if (formData.password !== formData.confirmarPassword) {
      novosErros.confirmarPassword = "As senhas não coincidem";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const converterDataParaISO = (dataBR) => {
    const [dia, mes, ano] = dataBR.split("/");
    return `${ano}-${mes}-${dia}`;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validarFormulario()) {
    return;
  }

  setCarregando(true);

  try {
    const dataNascimentoISO = converterDataParaISO(formData.dataNascimento);

    await adminService.cadastrar({
      nome: formData.nome,
      email: formData.email,
      cpf: formData.cpf.replace(/\D/g, ''),
      rg: limparRG(formData.rg),
      password: formData.password,
      tell: formData.tell,
      dataNascimento: dataNascimentoISO,
      sexo: formData.sexo.toUpperCase(), // "MASCULINO" | "FEMININO" | "OUTRO"
      role: 'ADMIN'                      // obrigatório na API
    });

    navigate('/login', { state: { mensagem: 'Conta criada! Entre com seu e-mail e senha.' } });
  } catch (erro) {
    setErros({ geral: mensagemDeErro(erro, 'Erro ao criar conta') });
    console.error('Erro no cadastro de admin:', erro);
  } finally {
    setCarregando(false);
  }
};

  return (
    <div className="register-form-container">
      <div className="register-form-card">
        <div className="form-header">
          <Logo />
          <button className="btn-voltar" onClick={onVoltarClick}>
            ← Voltar
          </button>
          <h1>Cadastro de Administrador</h1>
          <p>Preencha seus dados para se cadastrar</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {erros.geral && <div className="erro-geral">{erros.geral}</div>}

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="nome">Nome completo *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Digite seu nome completo"
                disabled={carregando}
                className={erros.nome ? "input-erro" : ""}
              />
              {erros.nome && <span className="erro-texto">{erros.nome}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cpf">CPF *</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                disabled={carregando}
                className={erros.cpf ? "input-erro" : ""}
                maxLength="14"
              />
              {erros.cpf && <span className="erro-texto">{erros.cpf}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="rg">RG *</label>
              <input
                type="text"
                id="rg"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
                placeholder="00.000.000-0"
                disabled={carregando}
                className={erros.rg ? "input-erro" : ""}
                maxLength="12"
              />
              {erros.rg && <span className="erro-texto">{erros.rg}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dataNascimento">Data de nascimento *</label>
              <input
                type="text"
                id="dataNascimento"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                placeholder="dd/mm/aaaa"
                disabled={carregando}
                className={erros.dataNascimento ? "input-erro" : ""}
                maxLength="10"
              />
              {erros.dataNascimento && (
                <span className="erro-texto">{erros.dataNascimento}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sexo">Sexo *</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                disabled={carregando}
                className={erros.sexo ? "input-erro" : ""}
              >
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
              {erros.sexo && <span className="erro-texto">{erros.sexo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tell">Telefone *</label>
              <input
                type="text"
                id="tell"
                name="tell"
                value={formData.tell}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                disabled={carregando}
                className={erros.tell ? "input-erro" : ""}
                maxLength="15"
              />
              {erros.tell && <span className="erro-texto">{erros.tell}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                disabled={carregando}
                className={erros.email ? "input-erro" : ""}
              />
              {erros.email && <span className="erro-texto">{erros.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="password">Senha *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Digite sua senha"
                disabled={carregando}
                className={erros.password ? "input-erro" : ""}
              />
              {erros.password && (
                <span className="erro-texto">{erros.password}</span>
              )}
              <p className="password-hint">
                Mínimo 8 caracteres, com maiúsculas, minúsculas e números
              </p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="confirmarPassword">Confirmar Senha *</label>
              <input
                type="password"
                id="confirmarPassword"
                name="confirmarPassword"
                value={formData.confirmarPassword}
                onChange={handleChange}
                placeholder="Confirme sua senha"
                disabled={carregando}
                className={erros.confirmarPassword ? "input-erro" : ""}
              />
              {erros.confirmarPassword && (
                <span className="erro-texto">{erros.confirmarPassword}</span>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={carregando}>
            {carregando ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login" className="link-login">
            Já tem uma conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
