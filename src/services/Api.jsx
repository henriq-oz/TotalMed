// Cliente HTTP baseado em fetch nativo (sem axios).
// Mantém a mesma "forma" que os services já usam em todo o app:
//   API.get/post/put/patch/delete(url, dados) -> Promise<{ data, status, headers }>
// e em caso de erro (status fora de 2xx), rejeita com um objeto que tem
// erro.response = { status, data, headers }, exatamente como o axios fazia.
// Assim nenhum outro arquivo (AuthService, PacienteService, Login.jsx, etc.)
// precisa mudar.

// A API Spring. Para apontar para outro endereço, defina VITE_API_URL (.env).
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function montarHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function lerCorpoResposta(response) {
  if (response.status === 204) return null; // No Content
  const texto = await response.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    // Resposta não é JSON (ex: texto puro de erro) — devolve como string mesmo
    return texto;
  }
}

async function request(baseUrl, method, endpoint, body) {
  let response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: montarHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Erro de rede de verdade: backend fora do ar, CORS bloqueado, sem internet...
    const erroRede = new Error('Não foi possível conectar ao servidor');
    erroRede.request = true;
    throw erroRede;
  }

  const data = await lerCorpoResposta(response);

  if (!response.ok) {
    // Só força logout/redirect em 401 se HAVIA um token guardado (sessão expirada).
    // Sem essa checagem, um 401 de "senha errada" no próprio /login também
    // dispararia o redirect e derrubaria a tela antes do erro aparecer pro usuário.
    const tinhaToken = Boolean(localStorage.getItem('token'));
    if (response.status === 401 && tinhaToken) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const erro = new Error(`Request failed with status ${response.status}`);
    erro.response = { status: response.status, data, headers: response.headers };
    throw erro;
  }

  return { data, status: response.status, headers: response.headers };
}

const criarCliente = (baseUrl) => ({
  get: (endpoint) => request(baseUrl, 'GET', endpoint),
  post: (endpoint, body) => request(baseUrl, 'POST', endpoint, body),
  put: (endpoint, body) => request(baseUrl, 'PUT', endpoint, body),
  patch: (endpoint, body) => request(baseUrl, 'PATCH', endpoint, body),
  delete: (endpoint, body) => request(baseUrl, 'DELETE', endpoint, body),
});

const API = criarCliente(BASE_URL);

export default API;
