export const obtenerToken = () => {
  const token = sessionStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const ahora = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < ahora) {
      sessionStorage.removeItem('token');
      return null;
    }
    return token;
  } catch (err) {
    sessionStorage.removeItem('token');
    return null;
  }
};

export const obtenerUsuarioId = () => {
  const token = obtenerToken();
  if (!token) return null;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.usuarioId;
};