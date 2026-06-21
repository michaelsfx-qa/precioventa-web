import axios from 'axios';

export const obtenerTasas = async () => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/tasas`);
  return {
    bcv: {
      usd: response.data.tasaBcvUsd,
      eur: response.data.tasaBcvEur,
    },
    usdt: response.data.tasaUsdt,
  };
};