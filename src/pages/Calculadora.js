import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, LogOut, RotateCcw } from 'lucide-react';
import { guardarEstado, obtenerEstado } from '../services/estadoCalculadora';
import { obtenerTasas } from '../services/tasas';
import { useNavigate } from 'react-router-dom';


const datosIniciales = {
  productos: [{ nombreProducto: '', costoProducto: '' }],
  ganancia: '',
  costoEnvio: '',
  comisionTarjeta: '',
};

function Calculadora() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState(datosIniciales.productos);
  const [tipoBcv, setTipoBcv] = useState('usd');
  const [tasaBcv, setTasaBcv] = useState('');
  const [tasaUsdt, setTasaUsdt] = useState('');
  const [ganancia, setGanancia] = useState(datosIniciales.ganancia);
  const [costoEnvio, setCostoEnvio] = useState(datosIniciales.costoEnvio);
  const [comisionTarjeta, setComisionTarjeta] = useState(datosIniciales.comisionTarjeta);
  const [resultados, setResultados] = useState([]);
  const [errores, setErrores] = useState({});
  const [tasas, setTasas] = useState({ usd: '', eur: '' });
  const [loadingTasas, setLoadingTasas] = useState(true);
  const [copiado, setCopiado] = useState(false);

  // Cargar datos guardados
 const [estadoCargado, setEstadoCargado] = useState(false);

  useEffect(() => {
    const cargarEstado = async () => {
      const usuarioId = sessionStorage.getItem('usuarioId');
      if (!usuarioId) {
        setEstadoCargado(true);
        return;
      }
      try {
        const datos = await obtenerEstado(usuarioId);
        if (datos) {
          if (datos.productos) setProductos(datos.productos);
          if (datos.ganancia) setGanancia(datos.ganancia);
          if (datos.costoEnvio) setCostoEnvio(datos.costoEnvio);
          if (datos.comisionTarjeta) setComisionTarjeta(datos.comisionTarjeta);
        }
      } catch (err) {
        console.error('No se pudo cargar el estado guardado');
      } finally {
        setEstadoCargado(true);
      }
    };
    cargarEstado();
  }, []);

  // Guardar datos automáticamente
 useEffect(() => {
    if (!estadoCargado) return;
    const usuarioId = sessionStorage.getItem('usuarioId');
    if (!usuarioId) return;
    const timer = setTimeout(() => {
      guardarEstado(usuarioId, { productos, ganancia, costoEnvio, comisionTarjeta }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [productos, ganancia, costoEnvio, comisionTarjeta, estadoCargado]);

  useEffect(() => {
    const cargarTasas = async () => {
      try {
        const data = await obtenerTasas();
        setTasas(data.bcv);
        setTasaBcv(String(data.bcv.usd));
        setTasaUsdt(String(data.usdt));
      } catch (err) {
        setErrores({ general: 'No se pudieron cargar las tasas automáticamente' });
      } finally {
        setLoadingTasas(false);
      }
    };
    cargarTasas();
  }, []);

  const esNumeroValido = (valor) => {
    if (!valor || valor.trim() === '') return false;
    return !isNaN(parseFloat(valor.replace(',', '.')));
  };

  const esTextoValido = (valor) => valor && valor.trim().length > 0;

  const validarCampos = useCallback(() => {
    const nuevosErrores = {};
    if (!esNumeroValido(ganancia)) nuevosErrores.ganancia = 'El porcentaje de ganancia no es válido';
    productos.forEach((p, i) => {
      if (!esTextoValido(p.nombreProducto)) nuevosErrores[`nombreProducto_${i}`] = 'El nombre del producto no es válido';
      if (!esNumeroValido(p.costoProducto)) nuevosErrores[`costoProducto_${i}`] = 'El costo del producto no es válido';
    });
    return nuevosErrores;
  }, [productos, ganancia]);

const calcular = useCallback(async () => {
    if (loadingTasas) return;

    if (!esNumeroValido(ganancia)) {
      setResultados([]);
      return;
    }

    setErrores(prev => {
      const limpio = {};
      Object.keys(prev).forEach(key => {
        if (!key.startsWith('nombreProducto_') && !key.startsWith('costoProducto_')) {
          limpio[key] = prev[key];
        }
      });
      return limpio;
    });

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/calcular`, {
        productos, tasaBcv, tasaUsdt, ganancia, costoEnvio, comisionTarjeta
      });
      setResultados(response.data.resultados);
    } catch (err) {
      const codigo = err.response?.data?.error?.codigo;
      const mapaErrores = {
        1001: { campo: 'tasaBcv', mensaje: 'La tasa BCV no es válida' },
        1002: { campo: 'tasaUsdt', mensaje: 'La tasa USDT no es válida' },
        1003: { campo: 'ganancia', mensaje: 'El porcentaje de ganancia no es válido' },
        1004: { campo: 'costoEnvio', mensaje: 'El costo de envío no es válido' },
        1005: { campo: 'comisionTarjeta', mensaje: 'La comisión de tarjeta no es válida' },
      };
      const errorInfo = mapaErrores[codigo];
      if (errorInfo) {
        setErrores(prev => ({ ...prev, [errorInfo.campo]: errorInfo.mensaje }));
      } else {
        setErrores(prev => ({ ...prev, general: 'Error al calcular' }));
      }
      setResultados([]);
    }
  }, [productos, tasaBcv, tasaUsdt, ganancia, costoEnvio, comisionTarjeta, loadingTasas]);

  useEffect(() => {
    if (loadingTasas) return;
    const timer = setTimeout(() => calcular(), 300);
    return () => clearTimeout(timer);
  }, [calcular, loadingTasas]);

  const handleTipoBcv = (tipo) => {
    setTipoBcv(tipo);
    setTasaBcv(String(tasas[tipo]));
  };

  const agregarProducto = () => {
    setProductos([...productos, { nombreProducto: '', costoProducto: '' }]);
  };

  const eliminarProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevos = [...productos];
    nuevos[index][campo] = valor;
    setProductos(nuevos);

    const mensajes = {
      nombreProducto: 'El nombre del producto no es válido',
      costoProducto: 'El costo del producto no es válido',
    };

    const esValido = campo === 'nombreProducto' ? esTextoValido(valor) : esNumeroValido(valor);

    if (!esValido) {
      setErrores(prev => ({ ...prev, [`${campo}_${index}`]: mensajes[campo] }));
    } else {
      setErrores(prev => {
        const nuevos = { ...prev };
        delete nuevos[`${campo}_${index}`];
        return nuevos;
      });
    }
  };

  const actualizarCampo = (setter, campo, valor) => {
    setter(valor);
    const mensajes = {
      ganancia: 'El porcentaje de ganancia no es válido',
      costoEnvio: 'El costo de envío no es válido',
      comisionTarjeta: 'La comisión de tarjeta no es válida',
    };
    const camposOpcionales = ['costoEnvio', 'comisionTarjeta'];
    const esValido = camposOpcionales.includes(campo)
      ? valor === '' || esNumeroValido(valor)
      : esNumeroValido(valor);

    if (!esValido) {
      setErrores(prev => ({ ...prev, [campo]: mensajes[campo] }));
    } else {
      setErrores(prev => {
        const nuevos = { ...prev };
        delete nuevos[campo];
        return nuevos;
      });
    }
  };

const limpiarTodo = () => {
    setProductos([{ nombreProducto: '', costoProducto: '' }]);
    setGanancia('');
    setCostoEnvio('');
    setComisionTarjeta('');
    setResultados([]);
    setErrores({});
    const usuarioId = sessionStorage.getItem('usuarioId');
    if (usuarioId) {
      guardarEstado(usuarioId, { productos: [{ nombreProducto: '', costoProducto: '' }], ganancia: '', costoEnvio: '', comisionTarjeta: '' }).catch(() => {});
    }
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem('usuarioId');
    navigate('/');
  };

  const copiarResultados = () => {
    const texto = resultados.map(r => `${r.nombreProducto}: ${r.precioUnitarioDolares}$ / ${r.precioUnitarioBolivares}Bs`).join('\n');
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const ErrorMsg = ({ campo }) => errores[campo]
    ? <p style={styles.errorMsg}>{errores[campo]}</p>
    : null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>

        <div style={styles.header}>
          <h2 style={styles.title}>Calculadora de precios</h2>
          <div style={styles.headerBtns}>
            <button style={styles.limpiarBtn} onClick={limpiarTodo}>
              <RotateCcw size={14} /> Limpiar
            </button>
            <button style={styles.logoutBtn} onClick={cerrarSesion}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

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
            <ErrorMsg campo={`nombreProducto_${i}`} />
            <div style={styles.inputGroup}>
              <input
                style={styles.inputInner}
                placeholder="Costo"
                value={p.costoProducto}
                onChange={(e) => actualizarProducto(i, 'costoProducto', e.target.value)}
              />
              <span style={styles.suffix}>$</span>
            </div>
            <ErrorMsg campo={`costoProducto_${i}`} />
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
            <input style={styles.inputInner} value={loadingTasas ? 'Cargando...' : tasaBcv} readOnly />
            <span style={styles.suffix}>Bs</span>
          </div>
          <ErrorMsg campo="tasaBcv" />
        </div>

        <div style={styles.tasaCard}>
          <div style={styles.tasaHeader}>
            <span style={styles.tasaLabel}>Tasa USDT</span>
          </div>
          <div style={styles.inputGroup}>
            <input style={styles.inputInner} value={loadingTasas ? 'Cargando...' : tasaUsdt} readOnly />
            <span style={styles.suffix}>Bs</span>
          </div>
          <ErrorMsg campo="tasaUsdt" />
        </div>

        <p style={styles.sectionLabel}>Costos adicionales</p>
        <div style={styles.inputGroup}>
          <input
            style={styles.inputInner}
            placeholder="Ganancia"
            value={ganancia}
            onChange={(e) => actualizarCampo(setGanancia, 'ganancia', e.target.value)}
          />
          <span style={styles.suffix}>%</span>
        </div>
        <ErrorMsg campo="ganancia" />

        <div style={styles.row2}>
          <div>
            <div style={styles.inputGroup}>
              <input
                style={styles.inputInner}
                placeholder="Costo envío"
                value={costoEnvio}
                onChange={(e) => actualizarCampo(setCostoEnvio, 'costoEnvio', e.target.value)}
              />
              <span style={styles.suffix}>$</span>
            </div>
            <ErrorMsg campo="costoEnvio" />
          </div>
          <div>
            <div style={styles.inputGroup}>
              <input
                style={styles.inputInner}
                placeholder="Comisión tarjeta"
                value={comisionTarjeta}
                onChange={(e) => actualizarCampo(setComisionTarjeta, 'comisionTarjeta', e.target.value)}
              />
              <span style={styles.suffix}>%</span>
            </div>
            <ErrorMsg campo="comisionTarjeta" />
          </div>
        </div>

        {errores.general && <div style={styles.errorBox}>{errores.general}</div>}

        {resultados.length > 0 && (
          <div style={{ ...styles.resultados, cursor: 'pointer' }} onClick={copiarResultados}>
            <p style={{ ...styles.sectionLabel, color: copiado ? '#22c55e' : '#aaa' }}>
              {copiado ? '¡Copiado! ✓' : 'Resultados — toca para copiar'}
            </p>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtns: {
    display: 'flex',
    gap: '8px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#111',
  },
  limpiarBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    background: 'transparent',
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  logoutBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    background: '#fef2f2',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
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
    gap: '8px',
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
    gap: '8px',
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
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#ef4444',
  },
  errorMsg: {
    margin: '0',
    fontSize: '12px',
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