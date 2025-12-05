import React, { useState } from 'react';

const HorariosMain = () => {

  const [horarios, setHorarios] = useState({
    lunes: { activo: false, rangos: [{ inicio: "", fin: "" }] },
    martes: { activo: false, rangos: [{ inicio: "", fin: "" }] },
    miercoles: { activo: false, rangos: [{ inicio: "", fin: "" }] },
    jueves: { activo: false, rangos: [{ inicio: "", fin: "" }] },
    viernes: { activo: false, rangos: [{ inicio: "", fin: "" }] },
    sabado: { activo: false, rangos: [{ inicio: "", fin: "" }] },
    domingo: { activo: false, rangos: [{ inicio: "", fin: "" }] }
  });

  const manejarCambio = (dia, campo, valor) => {
    setHorarios(prev => {
      // If opening a day, close all others
      if (campo === "activo" && valor === true) {
        const nuevosHorarios = {};
        for (const d of Object.keys(prev)) {
          nuevosHorarios[d] = {
            ...prev[d],
            activo: d === dia ? true : false
          };
        }
        return nuevosHorarios;
      }

      // Normal update (times)
      return {
        ...prev,
        [dia]: {
          ...prev[dia],
          [campo]: valor
        }
      };
    });
  };

  const validarHorario = (inicio, fin) => {
    if (!inicio || !fin) return false;
    return inicio < fin;
  };

  return (
    <main>
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

        <div style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
        }}>

          <div
            className="horarios-masonry"
            style={{
              columnCount: 3,
              columnGap: "18px",
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
                          marginTop: "10px",
                          transition: "0.25s",
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        onClick={() => {
                          setHorarios((prev) => {
                            const nuevos = structuredClone(prev);
                            nuevos[dia].rangos.push({ inicio: "", fin: "" });
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
              fontSize: "16px"
            }}
          >
            Guardar configuración
          </button>

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