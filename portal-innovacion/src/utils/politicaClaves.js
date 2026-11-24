// Política de contraseñas (NB-POL-P3-03). El servidor aplica la misma regla y decide según el rol:
// pacientes 8 caracteres; personal del consultorio 12. Aquí se validan las reglas comunes para avisar antes de enviar.
const MAX_CLAVE = 72;

export const AYUDA_CLAVE =
  'Mínimo 8 caracteres (12 si eres personal del consultorio), con una mayúscula, un número y sin secuencias como 1234 o abcd.';

function tieneSecuencia(clave, largo = 4) {
  const s = clave.toLowerCase();
  let asc = 1;
  let desc = 1;
  for (let i = 1; i < s.length; i += 1) {
    const alfanum = /[a-z0-9]/.test(s[i]) && /[a-z0-9]/.test(s[i - 1]);
    asc = alfanum && s.charCodeAt(i) === s.charCodeAt(i - 1) + 1 ? asc + 1 : 1;
    desc = alfanum && s.charCodeAt(i) === s.charCodeAt(i - 1) - 1 ? desc + 1 : 1;
    if (asc >= largo || desc >= largo) return true;
  }
  return false;
}

// Devuelve el mensaje de error o null si la contraseña cumple las reglas comunes.
export function validarClave(clave) {
  if (!clave) return 'Escribe una contraseña.';
  if (clave.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (clave.length > MAX_CLAVE) return `La contraseña no puede superar ${MAX_CLAVE} caracteres.`;
  if (!/[A-ZÁÉÍÓÚÑÜ]/.test(clave)) return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(clave)) return 'La contraseña debe incluir al menos un número.';
  if (tieneSecuencia(clave)) return 'No uses secuencias consecutivas como 1234 o abcd.';
  return null;
}
