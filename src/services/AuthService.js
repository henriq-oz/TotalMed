import API from './Api';

export const authService = {
  // POST /login  →  body: { email, password }
  // retorna: { id, nome, role }
  login: (email, password) =>
    API.post('/login', { email, password }),
};
