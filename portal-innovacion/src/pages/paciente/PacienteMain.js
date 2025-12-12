import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
// import Event from '../home/EventSection'; // No parece usarse en el render, se puede omitir o descomentar si se usa

import { supabase } from "../../services/supabaseClient";
import { getCitasMedico, getCitaById } from "../../services/citasService";

const PacienteMain = () => {
  // --- ESTADOS ---
  // const [filtroPaciente, setFiltroPaciente] = useState(""); // No se usa en esta vista
  // const [filtroEstado, setFiltroEstado] = useState("");     // No se usa en esta vista
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilId, setPerfilId] = useState(null);
  const [proximaCitaDisplay, setProximaCitaDisplay] = useState("Sin agendar"); // Estado para la tarjeta

  // --- OBTENER USUARIO (Corrección del Error) ---
  const usuarioObj = JSON.parse(localStorage.getItem("nb-user"));
  const email = usuarioObj?.email;
  // Validamos si existe el nombre, si no, usamos el email o "Usuario"
  const nombreUsuario = usuarioObj?.nombre || usuarioObj?.email || "Usuario"; 

  // --- 1. Obtener ID del Perfil ---
  useEffect(() => {
    const medicoEmail = email;
    if (!medicoEmail) return;

    const fetchPerfil = async () => {
      const { data, error } = await supabase
        .from("perfil")
        .select("id")
        .eq("email", medicoEmail)
        .single();
      if (!error && data) setPerfilId(data.id);
    };
    fetchPerfil();
  }, [email]);

  // --- 2. Cargar Citas y Calcular Próxima Cita ---
  useEffect(() => {
    if (!perfilId) return;

    const cargarCitas = async () => {
      setLoading(true);
      const data = await getCitasMedico(perfilId);

      if (data) {
        const ahora = new Date();
        let citaMasProxima = null;

        const transformadas = data.map(c => {
          const fechaISO = c.fecha_hora;
          if (!fechaISO) return null;

          const [fecha, horaCompleta] = fechaISO.split("T");
          const hora = horaCompleta.substring(0, 5); // "09:00"

          // Crear objeto Date para comparar
          const fechaObjeto = new Date(fechaISO);

          // Lógica para encontrar la próxima cita (futura y pendiente/confirmada)
          if (fechaObjeto > ahora && (c.estado === 'pendiente' || c.estado === 'confirmada')) {
             if (!citaMasProxima || fechaObjeto < citaMasProxima.fechaObjeto) {
                 citaMasProxima = { fechaObjeto, fechaString: fecha };
             }
          }

          return {
            id: c.id,
            title: `${c.paciente_nombre ?? "Paciente"} — ${c.estado ?? "sin estado"}`,
            start: `${fecha}T${hora}`,
            end: calcularFin(fecha, hora),
            color: obtenerColorEstado(c.estado)
          };
        }).filter(Boolean);

        setCitas(transformadas);

        // Actualizar el estado visual de la tarjeta
        if (citaMasProxima) {
            // Formatear fecha ej: "12 Noviembre"
            const opciones = { day: 'numeric', month: 'long' };
            setProximaCitaDisplay(citaMasProxima.fechaObjeto.toLocaleDateString('es-ES', opciones));
        } else {
            setProximaCitaDisplay("Sin citas futuras");
        }
      }
      setLoading(false);
    };

    cargarCitas();
  }, [perfilId]);

  // Funciones auxiliares (igual que en tu Layout.js)
  const calcularFin = (fecha, hora) => {
    if (!fecha || !hora) return null;
    const inicio = new Date(`${fecha}T${hora}`);
    if (isNaN(inicio.getTime())) return null;
    const fin = new Date(inicio.getTime() + 60 * 60000);
    return fin.toISOString();
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case "confirmada": return "#b56b75";
      case "pendiente": return "#ddb6b8";
      case "cancelada": return "#e5c7c9";
      default: return "#d8a9b0";
    }
  };

  // Datos estáticos mezclados con dinámicos
  const paciente = {
    // Usamos el nombre real del usuario logueado o estático si prefieres
    nombre: nombreUsuario, 
    // Usamos el estado calculado arriba
    proximaCita: proximaCitaDisplay, 
    ultimoDiagnostico: '28/10/2025', // Esto aún es hardcoded (se requeriría lógica extra para traer historial)
    recomendacion: 'Autoexploración',
  };

  const acciones = [
    {
      id: 1,
      titulo: 'Agendar nueva cita',
      descripcionBoton: 'Agendar cita',
      fecha: '12 Noviembre', // Fecha decorativa de la imagen
      imagen: require('../../assets/img/event/event2.jpg'),
    },
    {
      id: 2,
      titulo: 'Ver historial médico',
      descripcionBoton: 'Ver historial médico',
      fecha: '12 Noviembre',
      imagen: require('../../assets/img/event/event2.jpg'),
    },
    {
      id: 3,
      titulo: 'Recomendación del día',
      descripcionBoton: 'Realizar Autoexploración',
      fecha: '05 Octubre',
      imagen: require('../../assets/img/event/event1.jpg'),
    },
  ];

  return (
    <main style={{ background: '#F8EAE7', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#FCECEC' }}>
        {/* CORRECCIÓN: Usar template literal para insertar la variable */}
        <Breadcrumb title={`Bienvenida ${nombreUsuario}`} subtitle="Página Principal / Paciente" />
      </div>

      <div className="container" style={{ maxWidth: '1100px' }}>
        <div
          style={{
            background: 'linear-gradient(90deg, #D78584 0%, #F6B364 100%)',
            borderRadius: '16px',
            padding: '18px 28px',
            marginTop: '26px',
            marginBottom: '16px',
            textAlign: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '22px',
            maxWidth: '1100px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {/* CORRECCIÓN DEL ERROR PRINCIPAL: Usar nombreUsuario (string) en lugar de usuario (objeto) */}
          Hola, {nombreUsuario}! Nos alegra verte de nuevo
        </div>

        {/* 3 tarjetas superiores con datos dinámicos */}
        <div className="d-flex gap-4 justify-content-between" style={{ display: 'flex', gap: '28px', justifyContent: 'center', marginBottom: '30px' }}>
          {acciones.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#D78584',
                borderRadius: '18px',
                padding: '26px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: '1 1 0',
                maxWidth: '350px',
              }}
            >
              <span style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '16px' }}>
                {item.id === 1
                  ? 'Próxima cita'
                  : item.id === 2
                  ? 'Último Diagnóstico'
                  : 'Recomendación del día'}
              </span>
              <span style={{ color: '#0F172A', fontWeight: 700, fontSize: item.id === 3 ? '24px' : '26px' }}>
                {item.id === 1
                  ? loading ? "Cargando..." : paciente.proximaCita 
                  : item.id === 2
                  ? paciente.ultimoDiagnostico
                  : paciente.recomendacion}
              </span>
            </div>
          ))}
        </div>

        {/* tarjetas con imagen */}
        <div className="d-flex gap-4 justify-content-between" style={{ display: 'flex', gap: '28px', justifyContent: 'center', marginBottom: '30px' }}>
          {acciones.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#F5CECE',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(216,135,135,0.20)',
                flex: '1 1 0',
                maxWidth: '350px',
              }}
            >
              <div style={{ position: 'relative' }}>
                <img src={item.imagen} alt={item.titulo} style={{ width: '100%', height: '190px', objectFit: 'cover' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    background: '#D48F8F',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    textAlign: 'right',
                    lineHeight: 1.1,
                  }}
                >
                  {item.fecha.split(' ')[0]}
                  <br />
                  {item.fecha.split(' ')[1]}
                </span>
              </div>
              <div style={{ padding: '18px 20px 22px 20px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>
                  {item.titulo}
                </h4>
                <button
                  type="button"
                  style={{
                    background: '#E09A9A',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '10px 26px',
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  {item.descripcionBoton}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default PacienteMain;