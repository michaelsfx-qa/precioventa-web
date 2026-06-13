import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/login', { usuario, clave });
      if (response.data.codigo === '0000') {
        navigate('/calculadora');
      }
    } catch (err) {
      setError('Usuario o clave incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoWrapper}>
          <div style={styles.logo}>P</div>
        </div>
        <h2 style={styles.title}>Bienvenido</h2>
        <p style={styles.subtitle}>Ingresa tus credenciales para continuar</p>

        <div style={styles.fieldWrapper}>
          <label style={styles.label}>Usuario</label>
          <input
            style={{
              ...styles.input,
              borderColor: focusedField === 'usuario' ? '#2563eb' : '#e5e5e5',
              boxShadow: focusedField === 'usuario' ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
            }}
            type="text"
            placeholder="Tu usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            onFocus={() => setFocusedField('usuario')}
            onBlur={() => setFocusedField('')}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div style={styles.fieldWrapper}>
          <label style={styles.label}>Contraseña</label>
          <input
            style={{
              ...styles.input,
              borderColor: focusedField === 'clave' ? '#2563eb' : '#e5e5e5',
              boxShadow: focusedField === 'clave' ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
            }}
            type="password"
            placeholder="Tu contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            onFocus={() => setFocusedField('clave')}
            onBlur={() => setFocusedField('')}
            onKeyDown={handleKeyDown}
          />
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f0ff 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    boxSizing: 'border-box',
  },
  card: {
    background: '#fff',
    padding: '40px 36px',
    borderRadius: '24px',
    boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  logo: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#fff',
    fontSize: '24px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e5e5e5',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#fafafa',
    width: '100%',
    boxSizing: 'border-box',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#ef4444',
  },
  button: {
    padding: '13px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#fff',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '4px',
    boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
  },
};

export default Login;