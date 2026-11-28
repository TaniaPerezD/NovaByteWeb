import React from 'react';

// Si una pantalla falla, la persona ve un aviso y un botón para volver, en vez de una página en blanco.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    console.error('Error en pantalla:', error);
  }

  render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 560, margin: '120px auto', padding: '0 24px', textAlign: 'center', fontFamily: 'inherit' }}>
        <h2 style={{ color: '#b56b75' }}>Algo salió mal en esta pantalla</h2>
        <p style={{ color: '#4E5865' }}>Tu sesión sigue activa. Puedes volver al inicio e intentarlo de nuevo.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 16, padding: '10px 28px', borderRadius: 8, background: '#E79796', color: '#fff', textDecoration: 'none' }}>
          Volver al inicio
        </a>
      </div>
    );
  }
}

export default ErrorBoundary;
