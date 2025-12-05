import React, { useState, useEffect } from 'react';
import {
  getHorariosMedico,
  saveHorariosMedico,
  getFechasSinAtencion,
  crearFechaSinAtencion,
  actualizarFechaSinAtencion,
  eliminarFechaSinAtencion,
} from "../../services/horariosService";
import Swal from 'sweetalert2';

import { supabase } from "../../services/supabaseClient";


const HorariosMain = () => {
  const [cargandoHorarios, setCargandoHorarios] = useState(true);
  const [guardandoVacaciones, setGuardandoVacaciones] = useState(false);


  const [horarios, setHorarios] = useState({
    lunes: { activo: false, rangos: [{ id: null, inicio: "", fin: "" }] },
    martes: { activo: false, rangos: [{ id: null, inicio: "", fin: "" }] },
    miercoles: { activo: false, rangos: [{ id: null, inicio: "", fin: "" }] },
    jueves: { activo: false, rangos: [{ id: null, inicio: "", fin: "" }] },
    viernes: { activo: false, rangos: [{ id: null, inicio: "", fin: "" }] },
    sabado: { activo: false, rangos: [{ id: null, inicio: "", fin: "" }] },
    domingo: { activo: false, rangos: [{ id: null, inicio: "", fin: "" }] }
  });

  const [vacaciones, setVacaciones] = useState([
    { inicio: "", fin: "" }
  ]);
  const [vacacionSeleccionada, setVacacionSeleccionada] = useState(null);

  const manejarCambio = (dia, campo, valor) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [campo]: valor,
      },
    }));
  };

  const validarHorario = (inicio, fin) => {
    if (!inicio || !fin) return false;
    return inicio < fin;
  };

  //consumir, primero para traer los horarios del medico

  const usuario = JSON.parse(localStorage.getItem("nb-user"));
  const email = usuario?.email;
  const [perfilId, setPerfilId] = useState(null);


  useEffect(() => {
  const obtenerPerfil = async () => {
    if (!email) return;

    const { data, error } = await supabase
      .from("perfil")
      .select("id")
      .eq("email", email)
      .single();

    if (!error && data?.id) {
      setPerfilId(data.id);
      console.log("Perfil encontrado:", data.id);
    } else {
      console.error("Error obteniendo perfil:", error);
    }
  };

  obtenerPerfil();
}, [email]);

//  oara cargar horarios
useEffect(() => {
  if (!perfilId) return;

  const cargar = async () => {
    setCargandoHorarios(true);
    const data = await getHorariosMedico(perfilId);
    if (data) {
      setHorarios(data);
    }
    setCargandoHorarios(false);
  };

  cargar();
}, [perfilId]);

  //para guardar los horarios
  const [guardando, setGuardando] = useState(false);
  const guardarCambios = async () => {
    setGuardando(true);
    const resultado = await saveHorariosMedico(perfilId, horarios);
    setGuardando(false);

    if (!resultado.error) {
      Swal.fire({
        title: "¡Horarios guardados!",
        text: "La configuración se actualizó correctamente.",
        icon: "success",
        confirmButtonColor: "#b56b75",
        background: "#fff",
        color: "#6a5f5f",
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" }
      });
    } else {
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al guardar los horarios.",
        icon: "error",
        confirmButtonColor: "#b56b75",
        background: "#fff",
        color: "#6a5f5f",
        showClass: { popup: "animate__animated animate__shakeX" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" }
      });
    }
  };
  
  useEffect(() => {
  if (!perfilId) return;

  const cargarFechas = async () => {
    const data = await getFechasSinAtencion(perfilId);

    if (data) {
      setVacaciones(
        data.map(f => ({
          id: f.id,
          inicio: f.inicio,
          fin: f.fin
        }))
      );
    }
  };

  cargarFechas();
}, [perfilId]);

  const [activeTab, setActiveTab] = useState("horarios");
  const guardarFechas = async () => {
  let errores = 0;

  for (const v of vacaciones) {
    // borrar si está vacío
    if (!v.inicio && !v.fin && v.id) {
      await eliminarFechaSinAtencion(v.id);
      continue;
    }

    if (!v.inicio || !v.fin) continue;

    if (v.inicio > v.fin) {
      errores++;
      continue;
    }

    if (v.id) {
      await actualizarFechaSinAtencion(v.id, v.inicio, v.fin);
    } else {
      await crearFechaSinAtencion(perfilId, v.inicio, v.fin);
    }
  }

  if (errores > 0) {
    Swal.fire({
      title: "Error en fechas",
      text: "Algunas fechas no son válidas y no se guardaron.",
      icon: "warning",
      confirmButtonColor: "#b56b75"
    });
  } else {
    Swal.fire({
      title: "Fechas guardadas",
      text: "Los intervalos de descanso fueron actualizados.",
      icon: "success",
      confirmButtonColor: "#b56b75"
    });
  }
};

  // Helper para fechas mínimas (hoy)
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <main style={{ minHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}>
      <style>{`
@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
`}</style>
      <div className="container">

        <h1 style={{ color: "#b56b75", marginBottom: "20px" }}>
          Configuración de Horarios de Atención
        </h1>

        <p style={{ marginBottom: "25px", color: "#6a5f5f" }}>
          Seleccione los días de atención y configure un rango válido.
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "30px" }}>
          <div
            onClick={() => setActiveTab("horarios")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 500,
              color: activeTab === "horarios" ? "#b56b75" : "#7a4f4f99",
              position: "relative",
              transition: "color 0.45s cubic-bezier(.25,.8,.25,1)",
            }}
          >
            Horarios
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: "-2px",
                height: "3px",
                width: "100%",
                background: "#b56b75",
                transform: activeTab === "horarios" ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 0.45s cubic-bezier(.25,.8,.25,1)"
              }}
            ></span>
          </div>
          <div
            onClick={() => setActiveTab("vacaciones")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 500,
              color: activeTab === "vacaciones" ? "#b56b75" : "#7a4f4f99",
              position: "relative",
              transition: "color 0.45s cubic-bezier(.25,.8,.25,1)",
            }}
          >
            Fechas sin atención
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: "-2px",
                height: "3px",
                width: "100%",
                background: "#b56b75",
                transform: activeTab === "vacaciones" ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 0.45s cubic-bezier(.25,.8,.25,1)"
              }}
            ></span>
          </div>
        </div>

        <div style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          overflow: "visible",
          height: "auto"
        }}>

          {activeTab === "horarios" && (
            <div
              className="horarios-masonry"
              style={{
                columnCount: 3,
                columnGap: "18px",
                height: "auto",
                overflow: "visible"
              }}
            >
              {Object.entries(horarios).map(([dia, info]) => (
                <div key={dia} style={{ breakInside: "avoid", marginBottom: "18px" }}>
                  <div
                    style={
                      info.activo
                        ? {
                            borderRadius: "10px",
                            background: "#f9ecec",
                            padding: "15px 18px",
                            boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                            transition: "0.3s",
                          }
                        : {
                            borderRadius: "10px",
                            background: "#faf5f5",
                            padding: "10px 14px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            height: "55px",
                            display: "flex",
                            alignItems: "center",
                            transition: "0.3s",
                          }
                    }
                  >
                
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      paddingRight: "12px",
                      marginBottom: info.activo ? "0px" : "6px"
                    }}>
                      <div
                        style={{ cursor: "pointer", flexGrow: 1 }}
                        onClick={() => manejarCambio(dia, "activo", !info.activo)}
                      >
                        <strong style={{ fontSize: "18px", textTransform: "capitalize", color: "#7a4f4f" }}>
                          {dia}
                        </strong>
                      </div>

                      <label
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "relative",
                          display: "inline-block",
                          width: "52px",
                          height: "28px",
                          cursor: "pointer"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={info.activo}
                          onChange={(e) => manejarCambio(dia, "activo", e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: info.activo ? "#b56b75" : "#d1d1d6",
                            borderRadius: "28px",
                            transition: "0.35s cubic-bezier(.25,.8,.25,1)"
                          }}
                        ></span>
                        <span
                          style={{
                            position: "absolute",
                            height: "24px",
                            width: "24px",
                            left: info.activo ? "26px" : "2px",
                            top: "2px",
                            backgroundColor: "white",
                            borderRadius: "50%",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            transition: "0.35s cubic-bezier(.25,.8,.25,1)"
                          }}
                        ></span>
                      </label>
                    </div>

                    {info.activo && (
                      <div
                        style={{
                          marginTop: "18px",
                          padding: "15px",
                          borderRadius: "10px",
                          background: "#fff",
                          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.04)",
                          animation: "fadeSlide 0.35s ease"
                        }}
                      >
                        {info.rangos.map((rango, index) => (
                          <div
                            key={index}
                            style={{
                              borderBottom: "1px solid #e5d4d4",
                              paddingBottom: "12px",
                              marginBottom: "12px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                              <span style={{ width: "80px", color: "#6a5f5f" }}>Desde:</span>
                              <input
                                type="time"
                                value={rango.inicio}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  setHorarios((prev) => {
                                    const nuevos = structuredClone(prev);
                                    nuevos[dia].rangos[index].inicio = valor;
                                    return nuevos;
                                  });
                                }}
                                className="form-control"
                                style={{ width: "150px" }}
                              />
                            </div>

                            <div style={{ display: "flex", alignItems:"center", marginBottom:"12px" }}>
                              <span style={{ width:"80px", color:"#6a5f5f" }}>Hasta:</span>
                              <input
                                type="time"
                                value={rango.fin}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  setHorarios((prev) => {
                                    const nuevos = structuredClone(prev);
                                    nuevos[dia].rangos[index].fin = valor;
                                    return nuevos;
                                  });
                                }}
                                className="form-control"
                                style={{ width: "150px" }}
                              />
                            </div>

                            {(!validarHorario(rango.inicio, rango.fin)) && (
                              <span style={{ color: "red", fontSize: "0.9rem" }}>
                                Horario inválido (la hora inicial debe ser menor)
                              </span>
                            )}

                            {info.rangos.length > 1 && (
                              <button
                                style={{
                                  marginTop: "8px",
                                  background: "#f8d2d2",
                                  color: "#b34a4a",
                                  border: "1px solid #e8bcbc",
                                  padding: "5px 12px",
                                  borderRadius: "20px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  transition: "0.25s"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4c4c4")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "#f8d2d2")}
                                onClick={() => {
                                  setHorarios((prev) => {
                                    const nuevos = structuredClone(prev);
                                    nuevos[dia].rangos.splice(index, 1);
                                    return nuevos;
                                  });
                                }}
                              >
                                <span style={{ fontSize: "16px" }}>–</span>
                                Eliminar
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          style={{
                            background: "#b56b75",
                            color: "#fff",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "25px",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "0.25s",
                            fontWeight: 500
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          onClick={() => {
                            setHorarios((prev) => {
                              const nuevos = structuredClone(prev);
                              nuevos[dia].rangos.push({ id: null, inicio: "", fin: "" });
                              return nuevos;
                            });
                          }}
                        >
                          <span style={{ fontSize: "18px", fontWeight: "bold" }}>+</span>
                          Añadir horario
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "vacaciones" && (
            <>
              {/* Sidebar de próximas fechas sin atención */}
              <div style={{
                marginBottom: "25px",
                padding: "15px",
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
              }}>
                <h3 style={{ color:"#b56b75", marginBottom:"15px" }}>Próximas fechas sin atención</h3>

                {vacaciones
                  .filter(v => v.inicio && v.fin && v.inicio >= hoy)
                  .sort((a,b) => a.inicio.localeCompare(b.inicio))
                  .map((v, i) => (
                    <div
                      key={i}
                      style={{
                        padding:"10px",
                        borderBottom:"1px solid #e8e0e0",
                        cursor:"pointer",
                        transition:"0.25s"
                      }}
                      onClick={() => setVacacionSeleccionada({ ...v, index:i })}
                      onMouseEnter={(e)=>e.currentTarget.style.background="#f7eded"}
                      onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}
                    >
                      <strong>{v.inicio}</strong> — {v.fin}
                    </div>
                ))}

                {vacaciones.filter(v => v.inicio && v.fin && v.inicio >= hoy).length === 0 && (
                  <p style={{ color:"#7a4f4f99" }}>No hay fechas programadas.</p>
                )}
              </div>
              <h2 style={{ color: "#b56b75", marginTop: "35px", marginBottom: "15px" }}>
                Intervalos sin atención
              </h2>
              <div
                style={{
                  background: "#faf5f5",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  marginBottom: "25px"
                }}
              >
                {vacaciones.map((r, index) => (
                  <div
                    key={index}
                    style={{
                      borderBottom: index !== vacaciones.length - 1 ? "1px solid #e5d4d4" : "none",
                      paddingBottom: "14px",
                      marginBottom: "14px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ width: "120px", color: "#6a5f5f" }}>Desde:</span>
                      <input
                        type="date"
                        min={hoy}
                        value={r.inicio}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setVacaciones((prev) => {
                            const nuevos = structuredClone(prev);
                            nuevos[index].inicio = valor;
                            return nuevos;
                          });
                          if (vacacionSeleccionada && vacacionSeleccionada.index === index) {
                            setVacacionSeleccionada({
                              ...vacacionSeleccionada,
                              inicio: valor
                            });
                          }
                        }}
                        className="form-control"
                        style={{ width: "180px" }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems:"center", marginBottom:"12px" }}>
                      <span style={{ width:"120px", color:"#6a5f5f" }}>Hasta:</span>
                      <input
                        type="date"
                        min={hoy}
                        value={r.fin}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setVacaciones((prev) => {
                            const nuevos = structuredClone(prev);
                            nuevos[index].fin = valor;
                            return nuevos;
                          });
                          if (vacacionSeleccionada && vacacionSeleccionada.index === index) {
                            setVacacionSeleccionada({
                              ...vacacionSeleccionada,
                              fin: valor
                            });
                          }
                        }}
                        className="form-control"
                        style={{ width: "180px" }}
                      />
                    </div>

                    {vacacionSeleccionada?.index === index && (
                      <span style={{ color:"#b56b75", fontSize:"0.85rem" }}>
                        Editando intervalo seleccionado
                      </span>
                    )}

                    {(r.inicio && r.fin && r.inicio > r.fin) && (
                      <span style={{ color: "red", fontSize: "0.9rem" }}>
                        La fecha inicial debe ser menor.
                      </span>
                    )}

                    {vacaciones.length > 1 && (
                      <button
                        style={{
                          marginTop: "8px",
                          background: "#f8d2d2",
                          color: "#b34a4a",
                          border: "1px solid #e8bcbc",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          cursor: "pointer",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "0.25s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f4c4c4")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f8d2d2")}
                        onClick={() => {
                          setVacaciones((prev) => {
                            const nuevos = structuredClone(prev);
                            nuevos.splice(index, 1);
                            return nuevos;
                          });
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>–</span>
                        Eliminar intervalo
                      </button>
                    )}
                  </div>
                ))}

                <button
                  style={{
                    background: "#b56b75",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "25px",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "0.25s",
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  onClick={() => {
                    setVacaciones((prev) => [...prev, { inicio: "", fin: "" }]);
                  }}
                >
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>+</span>
                  Añadir intervalo
                </button>
              </div>
            </>
          )}

         {/* Botón para guardar HORARIOS */}
            {activeTab === "horarios" && (
              <button
                style={{
                  marginTop: "20px",
                  background: guardando ? "#a05a64" : "#b56b75",
                  color: "#fff",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: guardando ? "not-allowed" : "pointer",
                  width: "100%",
                  fontSize: "16px",
                  opacity: guardando ? 0.8 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
                disabled={guardando}
                onClick={guardarCambios}
              >
                {guardando ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      style={{ filter: "brightness(0) invert(1)" }}
                    ></span>
                    Guardando horarios...
                  </>
                ) : (
                  "Guardar horarios"
                )}
              </button>
            )}

            {/* Botón para guardar VACACIONES (la lógica la haremos luego) */}
            {activeTab === "vacaciones" && (
              <button
                style={{
                  marginTop: "20px",
                  background: "#b56b75",
                  color: "#fff",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
                onClick={guardarFechas}
              >
                Guardar fechas sin atención
              </button>
            )}

        </div>

      </div>
      <style>
      {`
        .horarios-masonry { column-count: 3; }
        @media (max-width: 1024px) { .horarios-masonry { column-count: 2; } }
        @media (max-width: 768px) { .horarios-masonry { column-count: 1; } }
      `}
      </style>
    </main>
  );
};

export default HorariosMain;