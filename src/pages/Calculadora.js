import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';
import { obtenerTasasBcv, obtenerTasaUsdt } from '../services/tasas';

function Calculadora() {
  const [productos, setProductos] = useState([{ nombreProducto: '', costoProducto: '', cantidadProducto: '' }]);
  const [tipoBcv, setTipoBcv] = useState('usd');
  const [tasaBcv, setTasaBcv] = useState('');
  const [tasaUsdt, setTasaUsdt] = useState('');
  const [ganancia, setGanancia] = useState('');
  const [costoEnvio, setCostoEnvio] = useState('');
  const [comisionTarjeta, setComisionTarjeta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasas, setTasas] = useState({ usd: '', eur: '' });
  const [loadingTasas, setLoadingTasas] = useState(true);

  const mensajesError = {
    1001: 'La tasa BCV no es válida',
    1002: 'La tasa USDT no es válida',
    1003: 'El porcentaje de ganancia no es válido',
    1004: 'El costo de envío no es válido',
    1005: 'La comisión de tarjeta no es válida',
    1101: 'El nombre del producto no es válido',
    1102: 'El costo del producto no es válido',
    1103: 'La cantidad del producto no es válida',
  };

  useEffect(() => {
    const cargarTasas = async () => {
      try {
        const [bcv, usdt] = await Promise.all([obtenerTasasBcv(), obtenerTasaUsdt()]);
        setTasas(bcv);
        setTasaBcv(String(bcv.usd));
        setTasaUsdt(String(usdt));
      } catch (err) {
        setError('No se pudieron cargar las tasas automáticamente');
      } finally {
        setLoadingTasas(false);
      }
    };
    cargarTasas();
  }, []);

  const handleTipoBcv = (tipo) => {
    setTipoBcv(tipo);
    setTasaBcv(String(tasas[tipo]));
  };

  const agregarProducto = () => {
    setProductos([...productos, { nombreProducto: '', costoProducto: '', cantidadProducto: '' }]);
  };

  const eliminarProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevos = [...productos];
    nuevos[index][campo] = valor;
    setProductos(nuevos);
  };

  const calcular = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/calcular', {
        productos, tasaBcv, tasaUsdt, ganancia, costoEnvio, comisionTarjeta
      });
      setResultados(response.data.resultados);
    } catch (err) {
      const codigo = err.response?.data?.error?.codigo;
      setError(mensajesError[codigo] || 'Error al calcular');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>

        <h2 style={styles.title}>Calculadora de precios</h2>

        <p style={styles.sectionLabel}>Productos</p>
        {productos.map((p, i) => (
          <div key={i} style={styles.productoCard}>
            <div style={styles.productoHeader}>
              <span style={styles.productoNum}>Producto {i + 1}</span>
              {productos.length > 1 && (
                <button style={styles.deleteBtn} onClick={() => eliminarProducto(i)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <input
              style={styles.input}
              placeholder="Nombre del producto"
              value={p.nombreProducto}
              onChange={(e) => actualizarProducto(i, 'nombreProducto', e.target.value)}
            />
            <div style={styles.row2}>
              <div style={styles.inputGroup}>
                <input
                  style={styles.inputInner}
                  placeholder="Costo"
                  value={p.costoProducto}
                  onChange={(e) => actualizarProducto(i, 'costoProducto', e.target.value)}
                />
                <span style={styles.suffix}>$</span>
              </div>
              <div style={styles.inputGroup}>
                <input
                  style={styles.inputInner}
                  placeholder="Cantidad"
                  value={p.cantidadProducto}
                  onChange={(e) => actualizarProducto(i, 'cantidadProducto', e.target.value)}
                />
                <span style={styles.suffix}>u</span>
              </div>
            </div>
          </div>
        ))}

        <button style={styles.addBtn} onClick={agregarProducto}>
          <Plus size={14} /> Agregar producto
        </button>

        <p style={styles.sectionLabel}>Tasas cambiarias</p>

        <div style={styles.tasaCard}>
          <div style={styles.tasaHeader}>
            <span style={styles.tasaLabel}>Tasa BCV</span>
            <div style={styles.toggle}>
              <button
                style={{ ...styles.toggleBtn, ...(tipoBcv === 'usd' ? styles.toggleActive : {}) }}
                onClick={() => handleTipoBcv('usd')}
              >
                USD
              </button>
              <button
                style={{ ...styles.toggleBtn, ...(tipoBcv === 'eur' ? styles.toggleActive : {}) }}
                onClick={() => handleTipoBcv('eur')}
              >
                EUR
              </button>
            </div>
          </div>
          <div style={styles.inputGroup}>
            <input
              style={styles.inputInner}
              value={loadingTasas ? 'Cargando...' : tasaBcv}
              readOnly
            />
            <span style={styles.suffix}>Bs</span>
          </div>
        </div>

        <div style={styles.tasaCard}>
          <div style={styles.tasaHeader}>
            <span style={styles.tasaLabel}>Tasa USDT</span>
          </div>
          <div style={styles.inputGroup}>
            <input
              style={styles.inputInner}
              value={loadingTasas ? 'Cargando...' : tasaUsdt}
              readOnly
            />
            <span style={styles.suffix}>Bs</span>
          </div>
        </div>

        <p style={styles.sectionLabel}>Costos adicionales</p>
        <div style={styles.inputGroup}>
          <input style={styles.inputInner} placeholder="Ganancia" value={ganancia} onChange={(e) => setGanancia(e.target.value)} />
          <span style={styles.suffix}>%</span>
        </div>
        <div style={styles.row2}>
          <div style={styles.inputGroup}>
            <input style={styles.inputInner} placeholder="Costo envío" value={costoEnvio} onChange={(e) => setCostoEnvio(e.target.value)} />
            <span style={styles.suffix}>$</span>
          </div>
          <div style={styles.inputGroup}>
            <input style={styles.inputInner} placeholder="Comisión tarjeta" value={comisionTarjeta} onChange={(e) => setComisionTarjeta(e.target.value)} />
            <span style={styles.suffix}>%</span>
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <button style={{ ...styles.calcBtn, opacity: loading ? 0.7 : 1 }} onClick={calcular} disabled={loading || loadingTasas}>
          {loading ? 'Calculando...' : 'Calcular precios'}
        </button>

        {resultados.length > 0 && (
          <div style={styles.resultados}>
            <p style={styles.sectionLabel}>Resultados</p>
            {resultados.map((r, i) => (
              <div key={i} style={styles.resultRow}>
                <span style={styles.resultNombre}>{r.nombreProducto}</span>
                <div style={styles.resultPrecios}>
                  <span style={styles.resultPrecio}>{r.precioUnitarioDolares} $</span>
                  <span style={styles.resultBs}>{r.precioUnitarioBolivares} Bs</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f0ff 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    boxSizing: 'border-box',
  },
  card: {
    background: '#fff',
    padding: '32px 28px',
    borderRadius: '24px',
    boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box',
    marginTop: '20px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#111',
  },
  sectionLabel: {
    margin: '4px 0 0',
    fontSize: '11px',
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  productoCard: {
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  productoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productoNum: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  input: {
    padding: '11px 13px',
    borderRadius: '10px',
    border: '1.5px solid #e5e5e5',
    fontSize: '14px',
    outline: 'none',
    background: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #e5e5e5',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#fff',
  },
  inputInner: {
    flex: 1,
    padding: '11px 13px',
    border: 'none',
    fontSize: '14px',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    boxSizing: 'border-box',
  },
  suffix: {
    padding: '0 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#aaa',
    background: '#f9f9f9',
    borderLeft: '1px solid #f0f0f0',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  tasaCard: {
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tasaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasaLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#555',
  },
  toggle: {
    display: 'flex',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: '5px 14px',
    border: 'none',
    background: 'transparent',
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
    cursor: 'pointer',
  },
  toggleActive: {
    background: '#2563eb',
    color: '#fff',
  },
  addBtn: {
    padding: '10px',
    borderRadius: '10px',
    border: '1.5px dashed #e0e0e0',
    background: 'transparent',
    fontSize: '13px',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: '500',
  },
  deleteBtn: {
    padding: '6px',
    borderRadius: '8px',
    border: 'none',
    background: '#fff0f0',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  calcBtn: {
    padding: '14px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#fff',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#ef4444',
  },
  resultados: {
    background: '#f8faff',
    border: '1px solid #e0eaff',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '4px',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid #eef2ff',
  },
  resultNombre: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
  },
  resultPrecios: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  resultPrecio: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#2563eb',
  },
  resultBs: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#888',
  },
};

export default Calculadora;