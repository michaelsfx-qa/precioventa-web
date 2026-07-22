import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, LogOut, RotateCcw, Copy, Pencil } from 'lucide-react';
import { guardarEstado, obtenerEstado } from '../services/estadoCalculadora';
import { obtenerTasas } from '../services/tasas';
import { useNavigate } from 'react-router-dom';
import { obtenerToken, obtenerUsuarioId } from '../utils/auth';


const datosIniciales = {
  productos: [{ nombreProducto: '', costoProducto: '' }],
  ganancia: '',
  costoEnvio: '',
  comisionTarjeta: '',
};

function Calculadora() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = obtenerToken();
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const [productoNuevo, setProductoNuevo] = useState({ nombreProducto: '', costoProducto: '' });
  const [productos, setProductos] = useState([]);
  const [tipoBcv, setTipoBcv] = useState('usd');
  const [tasaBcv, setTasaBcv] = useState('');
  const [tasaUsdt, setTasaUsdt] = useState('');
  const [ganancia, setGanancia] = useState('');
  const [costoEnvio, setCostoEnvio] = useState('');
  const [comisionTarjeta, setComisionTarjeta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [errores, setErrores] = useState({});
  const [tasas, setTasas] = useState({ usd: '', eur: '' });
  const [loadingTasas, setLoadingTasas] = useState(true);
  const [copiadoIndex, setCopiadoIndex] = useState(null);
  const [copiadoTodo, setCopiadoTodo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalSalir, setModalSalir] = useState(false);
  const [modalLimpiar, setModalLimpiar] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [costoEditar, setCostoEditar] = useState('');
  const [estadoCargado, setEstadoCargado] = useState(false);

  useEffect(() => {
    const cargarEstado = async () => {
      const usuarioId = obtenerUsuarioId();
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
          if (datos.tipoBcv) setTipoBcv(datos.tipoBcv);
        }
      } catch (err) {
        console.error('No se pudo cargar el estado guardado');
      } finally {
        setEstadoCargado(true);
      }
    };
    cargarEstado();
  }, []);

  useEffect(() => {
    if (!estadoCargado) return;
    const usuarioId = obtenerUsuarioId();
    if (!usuarioId) return;
    const timer = setTimeout(() => {
      guardarEstado(usuarioId, { productos, ganancia, costoEnvio, comisionTarjeta, tipoBcv }).catch(() => {});
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

  useEffect(() => {
    if (loadingTasas) return;
    if (tasas[tipoBcv]) {
      setTasaBcv(String(tasas[tipoBcv]));
    }
  }, [loadingTasas, tipoBcv, tasas]);

const esNumeroValido = (valor) => {
    if (!valor || valor.trim() === '') return false;
    return !isNaN(parseFloat(valor.replace(',', '.')));
  };

  const esTextoValido = (valor) => valor && valor.trim().length > 0;

  const calcularPrecio = useCallback((costo, numProds) => {
    if (!esNumeroValido(String(costo)) || !esNumeroValido(ganancia) || !esNumeroValido(tasaBcv) || !esNumeroValido(tasaUsdt)) return null;
    const bcv = parseFloat(tasaBcv);
    const usdt = parseFloat(tasaUsdt);
    const gan = parseFloat(ganancia);
    const tar = esNumeroValido(comisionTarjeta) ? parseFloat(comisionTarjeta) : 0;
    const env = esNumeroValido(costoEnvio) ? parseFloat(costoEnvio) : 0;
    const envioPorProducto = numProds > 0 ? env / numProds : 0;
    const dolaresObjetivo = parseFloat(costo) * (1 + gan / 100);
    const precioBase = (dolaresObjetivo * usdt) / bcv;
    const montoTarjeta = precioBase * (tar / 100);
    const precioUnitario = precioBase + montoTarjeta + envioPorProducto;
    const fmt = (n) => { n = Math.round(n * 100) / 100; return n % 1 === 0 ? parseInt(n) : n; };
    return {
      precioUnitarioDolares: fmt(precioUnitario),
      precioUnitarioBolivares: fmt(precioUnitario * bcv)
    };
  }, [ganancia, tasaBcv, tasaUsdt, costoEnvio, comisionTarjeta]);

  const recalcularTodos = useCallback(() => {
    if (!esNumeroValido(ganancia) || !esNumeroValido(tasaBcv) || !esNumeroValido(tasaUsdt)) return;
    setProductos(prev => prev.map(p => {
      const resultado = calcularPrecio(p.costoProducto, prev.length);
      return resultado ? { ...p, ...resultado } : p;
    }));
  }, [calcularPrecio, ganancia, tasaBcv, tasaUsdt]);

  useEffect(() => {
    if (loadingTasas || !estadoCargado) return;
    recalcularTodos();
  }, [ganancia, tasaBcv, tasaUsdt, costoEnvio, comisionTarjeta, loadingTasas, estadoCargado]);

  const handleTipoBcv = (tipo) => {
    setTipoBcv(tipo);
    setTasaBcv(String(tasas[tipo]));
  };

  const agregarProducto = () => {
    if (!esTextoValido(productoNuevo.nombreProducto)) {
      setErrores(prev => ({ ...prev, nombreNuevo: 'El nombre del producto no es válido' }));
      return;
    }
    if (!esNumeroValido(productoNuevo.costoProducto)) {
      setErrores(prev => ({ ...prev, costoNuevo: 'El costo del producto no es válido' }));
      return;
    }
    const resultado = calcularPrecio(productoNuevo.costoProducto, productos.length + 1);
    if (!resultado) {
      setErrores(prev => ({ ...prev, general: 'Completa las tasas y ganancia antes de agregar productos' }));
      return;
    }
    setProductos(prev => [...prev, {
      nombreProducto: productoNuevo.nombreProducto.trim(),
      costoProducto: productoNuevo.costoProducto,
      ...resultado
    }]);
    setProductoNuevo({ nombreProducto: '', costoProducto: '' });
    setErrores({});
  };

  const eliminarProducto = (index) => {
    setModalEliminar(index);
  };

  const confirmarEliminar = () => {
    setProductos(productos.filter((_, i) => i !== modalEliminar));
    setModalEliminar(null);
  };

  const abrirEditar = (index) => {
    setCostoEditar(productos[index].costoProducto);
    setModalEditar(index);
  };

  const confirmarEditar = () => {
    if (!esNumeroValido(costoEditar)) return;
    const resultado = calcularPrecio(costoEditar);
    if (!resultado) return;
    setProductos(prev => prev.map((p, i) =>
      i === modalEditar ? { ...p, costoProducto: costoEditar, ...resultado } : p
    ));
    setModalEditar(null);
  };

  const confirmarLimpiar = () => {
    setProductos([]);
    setGanancia('');
    setCostoEnvio('');
    setComisionTarjeta('');
    setErrores({});
    const usuarioId = obtenerUsuarioId();
    if (usuarioId) {
      guardarEstado(usuarioId, { productos: [], ganancia: '', costoEnvio: '', comisionTarjeta: '' }).catch(() => {});
    }
    setModalLimpiar(false);
  };

  const cerrarSesion = () => setModalSalir(true);
  const limpiarTodo = () => setModalLimpiar(true);

  const confirmarSalir = () => {
    sessionStorage.removeItem('token');
    navigate('/');
  };

  const copiarProducto = (r, index) => {
    const texto = `${r.nombreProducto}: ${r.precioUnitarioDolares}$ / ${r.precioUnitarioBolivares}Bs`;
    navigator.clipboard.writeText(texto);
    setCopiadoIndex(index);
    setTimeout(() => setCopiadoIndex(null), 1500);
  };

  const copiarTodo = () => {
    const texto = productos
      .filter(p => p.precioUnitarioDolares)
      .map(p => `${p.nombreProducto}: ${p.precioUnitarioDolares}$ / ${p.precioUnitarioBolivares}Bs`)
      .join('\n');
    navigator.clipboard.writeText(texto);
    setCopiadoTodo(true);
    setTimeout(() => setCopiadoTodo(false), 2000);
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
      setErrores(prev => { const n = { ...prev }; delete n[campo]; return n; });
    }
  };

  const ErrorMsg = ({ campo }) => errores[campo]
    ? <p style={styles.errorMsg}>{errores[campo]}</p>
    : null;

 return (
    <div style={styles.wrapper}>
      <div style={styles.card}>

        {/* Header */}
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

        {/* Tasas */}
        <p style={styles.sectionLabel}>Tasas cambiarias</p>
        <div style={styles.tasasRow}>
          <div style={styles.tasaCard}>
            <div style={styles.tasaHeader}>
              <span style={styles.tasaLabel}>BCV</span>
              <div style={styles.toggle}>
                <button style={{ ...styles.toggleBtn, ...(tipoBcv === 'usd' ? styles.toggleActive : {}) }} onClick={() => handleTipoBcv('usd')}>USD</button>
                <button style={{ ...styles.toggleBtn, ...(tipoBcv === 'eur' ? styles.toggleActive : {}) }} onClick={() => handleTipoBcv('eur')}>EUR</button>
              </div>
            </div>
            <div style={styles.inputGroup}>
              <input style={styles.inputInner} value={loadingTasas ? 'Cargando...' : tasaBcv} readOnly />
              <span style={styles.suffix}>Bs</span>
            </div>
          </div>
          <div style={styles.tasaCard}>
            <span style={styles.tasaLabel}>USDT</span>
            <div style={styles.inputGroup}>
              <input style={styles.inputInner} value={loadingTasas ? 'Cargando...' : tasaUsdt} readOnly />
              <span style={styles.suffix}>Bs</span>
            </div>
          </div>
        </div>

        {/* Costos adicionales */}
        <p style={styles.sectionLabel}>Costos adicionales</p>
        <div style={styles.row3}>
          <div>
            <div style={styles.inputGroup}>
              <input style={styles.inputInner} placeholder="Ganancia" value={ganancia} onChange={(e) => actualizarCampo(setGanancia, 'ganancia', e.target.value)} />
              <span style={styles.suffix}>%</span>
            </div>
            <ErrorMsg campo="ganancia" />
          </div>
          <div>
            <div style={styles.inputGroup}>
              <input style={styles.inputInner} placeholder="Envío" value={costoEnvio} onChange={(e) => actualizarCampo(setCostoEnvio, 'costoEnvio', e.target.value)} />
              <span style={styles.suffix}>$</span>
            </div>
            <ErrorMsg campo="costoEnvio" />
          </div>
          <div>
            <div style={styles.inputGroup}>
              <input style={styles.inputInner} placeholder="Tarjeta" value={comisionTarjeta} onChange={(e) => actualizarCampo(setComisionTarjeta, 'comisionTarjeta', e.target.value)} />
              <span style={styles.suffix}>%</span>
            </div>
            <ErrorMsg campo="comisionTarjeta" />
          </div>
        </div>

        {/* Agregar producto */}
        <p style={styles.sectionLabel}>Agregar producto</p>
        <div style={styles.agregarRow}>
          <input
            style={{ ...styles.inputInner, ...styles.inputBorder, flex: 2 }}
            placeholder="Nombre"
            value={productoNuevo.nombreProducto}
            onChange={(e) => {
              setProductoNuevo(prev => ({ ...prev, nombreProducto: e.target.value }));
              setErrores(prev => { const n = { ...prev }; delete n.nombreNuevo; return n; });
            }}
          />
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <input
              style={styles.inputInner}
              placeholder="Costo"
              value={productoNuevo.costoProducto}
              onChange={(e) => {
                setProductoNuevo(prev => ({ ...prev, costoProducto: e.target.value }));
                setErrores(prev => { const n = { ...prev }; delete n.costoNuevo; return n; });
              }}
            />
            <span style={styles.suffix}>$</span>
          </div>
          <button style={styles.agregarBtn} onClick={agregarProducto}>
            <Plus size={16} />
          </button>
        </div>
        <ErrorMsg campo="nombreNuevo" />
        <ErrorMsg campo="costoNuevo" />
        <ErrorMsg campo="general" />

       {/* Lista de productos */}
        {productos.length > 0 && esNumeroValido(ganancia) && esNumeroValido(costoEnvio) && esNumeroValido(comisionTarjeta) && esNumeroValido(tasaBcv) && esNumeroValido(tasaUsdt) && (
          <>
            <div style={styles.resultadosHeader}>
              <p style={styles.sectionLabel}>Productos</p>
              <button style={{ ...styles.copiarTodoBtn, ...(copiadoTodo ? styles.copiarTodoBtnActivo : {}) }} onClick={copiarTodo}>
                <Copy size={12} /> {copiadoTodo ? '✓ Copiado' : 'Copiar todo'}
              </button>
            </div>
            <div style={styles.inputGroup}>
              <input
                style={styles.inputInner}
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {productos
              .filter(p => p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase()))
              .map((p) => {
                const indexReal = productos.indexOf(p);
                return (
              <div key={indexReal} style={styles.productoCard}>
                <div style={styles.productoTop}>
                  <span style={styles.productoNombre}>{p.nombreProducto}</span>
                  <div style={styles.productoBtns}>
                    <button style={styles.btnIcono} onClick={() => copiarProducto(p, indexReal)} title="Copiar">
                      <Copy size={13} style={{ color: copiadoIndex === indexReal ? '#16a34a' : '#aaa' }} />
                    </button>
                    <button style={styles.btnIcono} onClick={() => abrirEditar(indexReal)} title="Editar">
                      <Pencil size={13} style={{ color: '#aaa' }} />
                    </button>
                    <button style={styles.btnIcono} onClick={() => eliminarProducto(indexReal)} title="Eliminar">
                      <Trash2 size={13} style={{ color: '#aaa' }} />
                    </button>
                  </div>
                </div>
                <div style={styles.productoPrecios}>
                  <span style={styles.costoBadge}>Costo: ${p.costoProducto}</span>
                  <div style={styles.ventaBadge}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb' }}>{p.precioUnitarioDolares} $</span>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#888' }}>{p.precioUnitarioBolivares} Bs</span>
                  </div>
                </div>
              </div>
            );})}
          </>
        )}

        {errores.general && <div style={styles.errorBox}>{errores.general}</div>}

        {/* Modal eliminar */}
        {modalEliminar !== null && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <p style={styles.modalTexto}>¿Estás seguro de eliminar este producto?</p>
              <div style={styles.modalBtns}>
                <button style={styles.modalBtnNo} onClick={() => setModalEliminar(null)}>No</button>
                <button style={styles.modalBtnSi} onClick={confirmarEliminar}>Sí</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal editar */}
        {modalEditar !== null && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <p style={styles.modalTexto}>Editar costo del producto</p>
              <div style={styles.inputGroup}>
                <input
                  style={styles.inputInner}
                  placeholder="Nuevo costo"
                  value={costoEditar}
                  onChange={(e) => setCostoEditar(e.target.value)}
                />
                <span style={styles.suffix}>$</span>
              </div>
              <div style={styles.modalBtns}>
                <button style={styles.modalBtnNo} onClick={() => setModalEditar(null)}>Cancelar</button>
                <button style={styles.modalBtnSi} onClick={confirmarEditar}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal salir */}
        {modalSalir && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <p style={styles.modalTexto}>¿Estás seguro de cerrar sesión?</p>
              <div style={styles.modalBtns}>
                <button style={styles.modalBtnNo} onClick={() => setModalSalir(false)}>No</button>
                <button style={styles.modalBtnSi} onClick={confirmarSalir}>Sí</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal limpiar */}
        {modalLimpiar && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <p style={styles.modalTexto}>¿Estás seguro de limpiar todo?</p>
              <div style={styles.modalBtns}>
                <button style={styles.modalBtnNo} onClick={() => setModalLimpiar(false)}>No</button>
                <button style={styles.modalBtnSi} onClick={confirmarLimpiar}>Sí</button>
              </div>
            </div>
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
    padding: '24px 20px',
    borderRadius: '24px',
    boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
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
    fontSize: '18px',
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
  tasasRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  tasaCard: {
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  tasaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasaLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
  },
  toggle: {
    display: 'flex',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: '3px 8px',
    border: 'none',
    background: 'transparent',
    fontSize: '10px',
    fontWeight: '600',
    color: '#888',
    cursor: 'pointer',
  },
  toggleActive: {
    background: '#2563eb',
    color: '#fff',
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
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
    padding: '10px 12px',
    border: 'none',
    fontSize: '14px',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputBorder: {
    border: '1.5px solid #e5e5e5',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  suffix: {
    padding: '0 8px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#aaa',
    background: '#f9f9f9',
    borderLeft: '1px solid #f0f0f0',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  agregarRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  agregarBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productoCard: {
    background: '#f8faff',
    border: '1px solid #e0eaff',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  productoTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productoNombre: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111',
  },
  productoBtns: {
    display: 'flex',
    gap: '4px',
  },
  btnIcono: {
    padding: '5px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  productoPrecios: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costoBadge: {
    fontSize: '12px',
    color: '#888',
    fontWeight: '500',
  },
  ventaBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  resultadosHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copiarTodoBtn: {
    padding: '4px 10px',
    borderRadius: '8px',
    border: '1px solid #e0eaff',
    background: '#f0f4ff',
    fontSize: '11px',
    fontWeight: '600',
    color: '#2563eb',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  copiarTodoBtnActivo: {
    background: '#dcfce7',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    width: '280px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalTexto: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
  },
  modalBtns: {
    display: 'flex',
    gap: '10px',
  },
  modalBtnNo: {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: '1.5px solid #e5e5e5',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: '#888',
    cursor: 'pointer',
  },
  modalBtnSi: {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    background: '#2563eb',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
  },
};


export default Calculadora;