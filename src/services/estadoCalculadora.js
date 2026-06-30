import axios from 'axios';
import { obtenerToken } from '../utils/auth';

export const guardarEstado = async (usuarioId, datos) => {
  const token = obtenerToken();
  await axios.post(
    `${process.env.REACT_APP_API_URL}/estado-calculadora`,
    { usuarioId, datos },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const obtenerEstado = async (usuarioId) => {
  const token = obtenerToken();
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/estado-calculadora/${usuarioId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.datos;
};