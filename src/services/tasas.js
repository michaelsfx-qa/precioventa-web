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
      'x-dolarvzla-key': 'c518977b485a9543e2edcd01230592bf2fbb81685eefd3e1e5b81aed7f970f81'
    }
  });
  return response.data.current.sell;
};