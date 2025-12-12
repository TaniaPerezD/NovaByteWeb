// Exploración Mamaria Guiada - Actualizado con validación y botón de paso
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Play, Square, AlertCircle, ArrowRight } from 'lucide-react';

const pasos = [
  { id: 'brazo_derecho', texto: 'Levanta tu brazo derecho lentamente por encima del hombro.' },
  { id: 'palpar_superior_derecho', texto: 'Con tu mano izquierda, palpa suavemente la parte superior del seno derecho.' },
  { id: 'palpar_inferior_derecho', texto: 'Con tu mano izquierda, palpa la parte inferior del seno derecho.' },
  { id: 'brazo_izquierdo', texto: 'Levanta tu brazo izquierdo lentamente por encima del hombro.' },
  { id: 'palpar_superior_izquierdo', texto: 'Con tu mano derecha, palpa suavemente la parte superior del seno izquierdo.' },
  { id: 'palpar_inferior_izquierdo', texto: 'Con tu mano derecha, palpa la parte inferior del seno izquierdo.' }
];

const ExploracionGuiada = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [pose, setPose] = useState(null);
  const [activo, setActivo] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [detected, setDetected] = useState(false);
  const [pasoValidado, setPasoValidado] = useState(false);
  const [tiempoCorrecto, setTiempoCorrecto] = useState(0);
  const [botonActivo, setBotonActivo] = useState(false);

  const cameraRef = useRef(null);
  const pasoActualRef = useRef(0);
useEffect(() => {
  pasoActualRef.current = pasoActual;
}, [pasoActual]);

useEffect(() => {
  let timer;
  if (detected && !botonActivo) {
    timer = setTimeout(() => {
      setBotonActivo(true);
    }, 3000); // Puedes ajustar a 30000 para 30 segundos
  } else if (!detected) {
    clearTimeout(timer);
  }
  return () => clearTimeout(timer);
}, [detected, botonActivo]);

  const instrucciones = 'Asegúrate de que la cámara pueda ver claramente tus hombros y torso. Usa ropa ajustada que no cubra los hombros. Colócate de pie frente a la cámara con buena iluminación.';

  useEffect(() => {
    const scriptPose = document.createElement('script');
    scriptPose.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose';
    scriptPose.async = true;

    const scriptCamera = document.createElement('script');
    scriptCamera.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils';
    scriptCamera.async = true;

    document.body.appendChild(scriptPose);
    document.body.appendChild(scriptCamera);

    scriptPose.onload = () => {
      const _pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      _pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      _pose.onResults(onResults);
      setPose(_pose);
    };
  }, []);

  const iniciarCamara = () => {
    if (videoRef.current && pose) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
      cameraRef.current = camera;
      setActivo(true);
    }
  };

  const detenerCamara = () => {
    cameraRef.current && cameraRef.current.stop();
    setActivo(false);
    setPasoActual(0);
    setPasoValidado(false);
    setDetected(false);
    setFeedback('');
  };

  const onResults = (results) => {
    if (!results.poseLandmarks) return;
    const lm = results.poseLandmarks.map((l) => ({ ...l, x: 1 - l.x }));

    const muñecaD = lm[16];
    const muñecaI = lm[15];
    const hombroD = lm[12];
    const hombroI = lm[11];
    

    if (pasoValidado) return;
    const pasoId = pasos[pasoActualRef.current]?.id;

    console.log(`📌 Paso actual (ref): ${pasoActualRef.current} (${pasoId})`);
    console.log('Landmarks:', { muñecaD_y: muñecaD.y.toFixed(3), hombroD_y: hombroD.y.toFixed(3) });


    switch (pasoId) {
      case 'brazo_derecho': {
  const distanciaManoCabeza = Math.sqrt(
    Math.pow(muñecaD.x - hombroD.x, 2) + Math.pow(muñecaD.y - hombroD.y, 2)
  );

  const manoDencimaCabeza = distanciaManoCabeza < 0.15;
  const brazoIzqRelajado = muñecaI.y > hombroI.y + 0.1;

  if (manoDencimaCabeza && brazoIzqRelajado) {
    setDetected(true);
    setPasoValidado(true);
    setFeedback('✅ Correcto: brazo derecho doblado sobre la cabeza y brazo izquierdo relajado');
  } else {
    setDetected(false);
    setFeedback('🟡 Coloca el brazo derecho sobre la cabeza, doblado, y relaja el izquierdo');
  }
  break;
}

case 'palpar_superior_derecho': {
  const brazoD_arriba = muñecaD.y < hombroD.y - 0.15; // brazo derecho doblado
  const centroX = (hombroD.x + hombroI.x) / 2;
  const manoI_centro = muñecaI.x > centroX - 0.15 && muñecaI.x < centroX + 0.25;
  const manoI_altura = muñecaI.y > hombroD.y - 0.05 && muñecaI.y < hombroD.y + 0.25;

  if (brazoD_arriba && manoI_centro && manoI_altura) {
    setDetected(true);
    setPasoValidado(true);
    setFeedback('✅ Correcto: mano izquierda en el pecho derecho superior y brazo derecho levantado');
  } else {
    setDetected(false);
    setFeedback('🟡 Levanta el brazo derecho y coloca la mano izquierda en la parte superior del pecho derecho');
  }
  break;
}


case 'palpar_inferior_derecho': {
  const brazoD_arriba = muñecaD.y < hombroD.y - 0.15; // aún levantado
  const centroX = (hombroD.x + hombroI.x) / 2;
  const pechoInferiorY = hombroD.y + 0.15;
  const limiteInferiorY = hombroD.y + 0.25;
  const manoI_cercaCentro = muñecaI.x > centroX - 0.15 && muñecaI.x < centroX + 0.25;
  const manoI_alturaCorrecta = muñecaI.y > pechoInferiorY - 0.05 && muñecaI.y < limiteInferiorY + 0.05;

  if (brazoD_arriba && manoI_cercaCentro && manoI_alturaCorrecta) {
    setDetected(true);
    setPasoValidado(true);
    setFeedback('✅ Correcto: mano izquierda en parte inferior del pecho derecho y brazo derecho levantado');
  } else {
    setDetected(false);
    setFeedback('🟡 Asegúrate de que el brazo derecho siga arriba y coloca la mano izquierda en la parte inferior del pecho derecho');
  }
  break;
}



case 'brazo_izquierdo': {
  const distanciaManoCabeza = Math.sqrt(
    Math.pow(muñecaI.x - hombroI.x, 2) + Math.pow(muñecaI.y - hombroI.y, 2)
  );

  const manoIencimaCabeza = distanciaManoCabeza < 0.15;
  const brazoDerRelajado = muñecaD.y > hombroD.y + 0.1;

  if (manoIencimaCabeza && brazoDerRelajado) {
    setDetected(true);
    setPasoValidado(true);
    setFeedback('✅ Correcto: brazo izquierdo doblado sobre la cabeza y brazo derecho relajado');
  } else {
    setDetected(false);
    setFeedback('🟡 Coloca el brazo izquierdo sobre la cabeza, doblado, y relaja el derecho');
  }
  break;
}

case 'palpar_superior_izquierdo': {
  const brazoI_arriba = muñecaI.y < hombroI.y - 0.15;
  const centroX = (hombroD.x + hombroI.x) / 2;
  const manoD_centro = muñecaD.x > centroX - 0.25 && muñecaD.x < centroX + 0.15;
  const manoD_altura = muñecaD.y > hombroI.y - 0.05 && muñecaD.y < hombroI.y + 0.25;

  if (brazoI_arriba && manoD_centro && manoD_altura) {
    setDetected(true);
    setFeedback('✅ Correcto: mano derecha en el pecho izquierdo superior y brazo izquierdo levantado');
  } else {
    setDetected(false);
    setFeedback('🟡 Mantén el brazo izquierdo levantado y palpa con la derecha el pecho izquierdo superior');
  }
  break;
}

case 'palpar_inferior_izquierdo': {
  const brazoI_arriba = muñecaI.y < hombroI.y - 0.15;
  const centroX = (hombroD.x + hombroI.x) / 2;
  const manoD_centro = muñecaD.x > centroX - 0.25 && muñecaD.x < centroX + 0.15;
  const manoD_baja = muñecaD.y > hombroI.y + 0.10 && muñecaD.y < hombroI.y + 0.35;

  if (brazoI_arriba && manoD_centro && manoD_baja) {
    setDetected(true);
    setFeedback('✅ Correcto: mano derecha en el pecho izquierdo inferior y brazo izquierdo levantado');
  } else {
    setDetected(false);
    setFeedback('🟡 Mantén el brazo izquierdo levantado y palpa con la derecha el pecho izquierdo inferior');
  }
  break;
}


      default:
        setDetected(false);
        setFeedback('Paso no implementado');
    }
  };

  const avanzarPaso = () => {
    setPasoActual((prev) => {
      const siguiente = prev + 1;
      if (siguiente >= pasos.length) {
        detenerCamara();
        alert('¡Exploración completada exitosamente!');
        return prev;
      }
      return siguiente;
    });
    setDetected(false);
    setPasoValidado(false);
    setFeedback('');
  };

return (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffe4e6, #ffffff)', display: 'flex', justifyContent: 'center', alignItems: 'start', padding: '2rem' }}>
    <div style={{ maxWidth: '720px', width: '100%', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#be123c', textAlign: 'center', marginBottom: '1rem' }}>
        🩺 Exploración Mamaria Guiada
      </h1>

      <p style={{ color: '#333', textAlign: 'center', marginBottom: '1rem' }}>
        {activo ? pasos[pasoActual]?.texto : instrucciones}
      </p>

      {activo && (
        <p style={{ fontSize: '0.875rem', color: '#be123c', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
          Progreso: Paso {pasoActual + 1} de {pasos.length}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', borderRadius: '1rem', border: '1px solid #ccc', backgroundColor: 'white', padding: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <video
            ref={videoRef}
            width={640}
            height={480}
            style={{ borderRadius: '0.75rem' }}
            autoPlay
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{ position: 'absolute', top: 0, left: 0, borderRadius: '0.75rem' }}
          />
        </div>

        <div>
          {activo ? (
            <button
              onClick={detenerCamara}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
            >
              Detener
            </button>
          ) : (
            <button
              onClick={iniciarCamara}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
            >
              Iniciar
            </button>
          )}
        </div>

        {activo && (
          <div style={{ textAlign: 'center', width: '100%', marginTop: '1rem' }}>
            <div
              style={{
                backgroundColor: detected ? '#d1fae5' : '#fef9c3',
                color: detected ? '#065f46' : '#92400e',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                marginBottom: '1rem',
              }}
            >
              {feedback}
            </div>

            {botonActivo && (
              <button
                onClick={avanzarPaso}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 auto',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
              >
                ➡ Siguiente paso
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);


};

export default ExploracionGuiada;