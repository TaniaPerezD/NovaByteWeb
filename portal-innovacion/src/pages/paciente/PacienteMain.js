import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { supabase } from "../../services/supabaseClient";

const PacienteMain = () => {
  // --- ESTADOS ---
  const [perfilId, setPerfilId] = useState(null);
  
  // Estados para mostrar en las tarjetas
  const [proximaCita, setProximaCita] = useState("Sin agendar");
  const [ultimaCita, setUltimaCita] = useState("Sin registros");
  const [loading, setLoading] = useState(true);

  // --- 1. OBTENER USUARIO (Corrección del Error Visual) ---
  const usuarioObj = JSON.parse(localStorage.getItem("nb-user"));
  const email = usuarioObj?.email;
  // Validamos si existe el nombre, si no, usamos el email o "Usuario"
  const nombreUsuario = usuarioObj?.nombre || usuarioObj?.email || "Usuario"; 

  // --- 2. Obtener ID del Perfil (Paciente) ---
  useEffect(() => {
    if (!email) return;

    const fetchPerfil = async () => {
      const { data, error } = await supabase
        .from("perfil")
        .select("id")
        .eq("email", email)
        .single();
      
      if (!error && data) {
        setPerfilId(data.id);
      }
    };
    fetchPerfil();
  }, [email]);

  // --- 3. Cargar Citas y Calcular Próxima/Última ---
  useEffect(() => {
    const cargarYCalcularCitas = async () => {
      if (!perfilId) return;
      setLoading(true);

      // Usamos la misma estructura de consulta que en AgendarCita.js
      const { data, error } = await supabase
        .from("cita")
        .select(`
          id,
          fecha_hora,
          estado,
          medico_id,
          medico:perfil!cita_medico_id_fkey(nombre, apellidos)
        `)
        .eq("paciente_id", perfilId)
        .neq("estado", "cancelada") // Ignoramos las canceladas para estos contadores
        .order("fecha_hora", { ascending: true }); // Orden ascendente (antiguas -> futuras)

      if (!error && data) {
        const ahora = new Date();
        let foundProxima = null;
        let foundUltima = null;

        // Recorremos las citas para encontrar la última pasada y la primera futura
        data.forEach((c) => {
            const fechaCita = new Date(c.fecha_hora);

            if (fechaCita < ahora) {
                // Como vienen ordenadas ascendente, la última que entre aquí será la más reciente del pasado
                foundUltima = fechaCita;
            } else if (fechaCita >= ahora && !foundProxima) {
                // La primera que encontremos mayor a hoy será la próxima cita más cercana
                foundProxima = fechaCita;
            }
        });

        // --- Formateadores de fecha ---
        const opcionesMes = { day: 'numeric', month: 'long' }; // Ej: "12 Noviembre"
        const opcionesCompleta = { day: '2-digit', month: '2-digit', year: 'numeric' }; // Ej: "31/10/2025"

        // Actualizar Estado Próxima Cita
        if (foundProxima) {
            setProximaCita(foundProxima.toLocaleDateString('es-ES', opcionesMes)); // Ej: 12 Noviembre
        } else {
            setProximaCita("Sin agendar");
        }

        // Actualizar Estado Última Cita (Último diagnóstico)
        if (foundUltima) {
            setUltimaCita(foundUltima.toLocaleDateString('es-ES', opcionesCompleta)); // Ej: 28/10/2025
        } else {
            setUltimaCita("N/A");
        }
      }
      setLoading(false);
    };

    cargarYCalcularCitas();
  }, [perfilId]);

  // --- DATOS PARA EL RENDER ---
  
  // Arrays de tarjetas superiores
  const resumenSalud = [
    {
      id: 1,
      titulo: 'Próxima cita',
      valor: loading ? "..." : proximaCita, // Valor dinámico
      fontSize: '26px'
    },
    {
      id: 2,
      titulo: 'Última Cita Atendida',
      valor: loading ? "..." : ultimaCita, // Valor dinámico
      fontSize: '26px'
    },
    {
      id: 3,
      titulo: 'Recomendación del día',
      valor: 'Autoexploración',
      fontSize: '24px'
    }
  ];

  // Arrays de tarjetas inferiores (Acciones)
  const acciones = [
    {
      id: 1,
      titulo: 'Agendar nueva cita',
      descripcionBoton: 'Agendar cita',
      fechaDecorativa: 'HOY', 
      imagen: require('../../assets/img/event/event2.jpg'),
    },
    {
      id: 2,
      titulo: 'Ver historial médico',
      descripcionBoton: 'Ver historial médico',
      fechaDecorativa: 'HIST',
      imagen: require('../../assets/img/event/event2.jpg'),
    },
    {
      id: 3,
      titulo: 'Recordatorio Salud',
      descripcionBoton: 'Realizar Autoexploración',
      fechaDecorativa: 'TIP',
      imagen: require('../../assets/img/event/event1.jpg'),
    },
  ];

  return (
    <main style={{ background: '#F8EAE7', minHeight: '100vh' }}>
      
      {/* Breadcrumb y Fondo Superior */}
      <div style={{ backgroundColor: '#FCECEC' }}>
        <Breadcrumb title={`Bienvenida ${nombreUsuario}`} subtitle="Página Principal / Paciente" />
      </div>

      <div className="container" style={{ maxWidth: '1100px' }}>
        
        {/* Banner de Saludo (CORREGIDO: usa nombreUsuario string, no objeto) */}
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
          Hola, {nombreUsuario}! Nos alegra verte de nuevo
        </div>

        {/* 3 TARJETAS SUPERIORES (Datos Dinámicos Calculados) */}
        <div className="d-flex gap-4 justify-content-between" style={{ display: 'flex', gap: '28px', justifyContent: 'center', marginBottom: '30px' }}>
          {resumenSalud.map((item) => (
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
                {item.titulo}
              </span>
              <span style={{ color: '#0F172A', fontWeight: 700, fontSize: item.fontSize }}>
                {item.valor}
              </span>
            </div>
          ))}
        </div>

        {/* 3 TARJETAS INFERIORES (Acciones con Imagen) */}
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
              {/* Imagen */}
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
                    fontSize: '12px'
                  }}
                >
                  {item.fechaDecorativa}
                </span>
              </div>
              {/* Contenido Texto + Botón */}
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
                    cursor: 'pointer'
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