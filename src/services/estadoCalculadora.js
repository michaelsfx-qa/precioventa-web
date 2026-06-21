import axios from 'axios';

export const guardarEstado = async (usuarioId, datos) => {
  await axios.post(`${process.env.REACT_APP_API_URL}/estado-calculadora`, {
    usuarioId,
    datos,
  });
};

export const obtenerEstado = async (usuarioId) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/estado-calculadora/${usuarioId}`);
  return response.data.datos;
};