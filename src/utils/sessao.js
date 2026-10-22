import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function lerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch {
    return null;
  }
}

// Devolve o usuário logado. Sem sessão (ou com papel diferente do exigido)
// manda para o login e devolve null.
export function useUsuario(role) {
  const navigate = useNavigate();
  const [usuario] = useState(lerUsuario);
  const permitido = Boolean(usuario?.id) && (!role || usuario.role === role);

  useEffect(() => {
    if (!permitido) navigate('/login');
  }, [permitido, navigate]);

  return permitido ? usuario : null;
}
