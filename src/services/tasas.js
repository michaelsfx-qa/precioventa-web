import axios from 'axios';

export const obtenerTasasBcv = async () => {
  const response = await axios.get('https://rates.dolarvzla.com/bcv/current.json');
  return {
    usd: response.data.current.usd,
    eur: response.data.current.eur,
  };
};

export const obtenerTasaUsdt = async () => {
  const response = await axios.get('https://api.dolarvzla.com/public/usdt/exchange-rate', {
    headers: {
      'x-dolarvzla-key': '308e27f37ea2f3cd986f4dc0d27ca5db87dafcbedf7d5044d4e6930dae67c5e7'
    }
  });
  return response.data.current.sell;
};