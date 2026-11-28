// Política de contraseñas (NB-POL-P3-03):
//  - Pacientes: mínimo 8 caracteres, una mayúscula, un número y sin secuencias consecutivas (1234, abcd).
//  - Personal (cualquier rol distinto de paciente): mínimo 12 caracteres con las mismas reglas.
// El máximo de 72 caracteres es el límite real de bcrypt, que es lo que guarda Supabase Auth.

export const MAX_CLAVE = 72;

function tieneSecuencia(clave: string, largo = 4): boolean {
  const s = clave.toLowerCase();
  let asc = 1;
  let desc = 1;
  for (let i = 1; i < s.length; i++) {
    const a = s.charCodeAt(i - 1);
    const b = s.charCodeAt(i);
    const alfanum = /[a-z0-9]/.test(s[i]) && /[a-z0-9]/.test(s[i - 1]);
    asc = alfanum && b === a + 1 ? asc + 1 : 1;
    desc = alfanum && b === a - 1 ? desc + 1 : 1;
    if (asc >= largo || desc >= largo) return true;
  }
  return false;
}

export function esPersonal(rol: string | null | undefined): boolean {
  return !!rol && rol !== "paciente"; // todo el personal: médico, recepción, dirección, OSI, técnicos…
}

// Devuelve el mensaje de error o null si la contraseña cumple.
export function validarClave(clave: unknown, rol: string | null | undefined): string | null {
  if (typeof clave !== "string" || clave.length === 0) return "Escribe una contraseña.";
  const min = esPersonal(rol) ? 12 : 8;
  if (clave.length < min) {
    return `La contraseña debe tener al menos ${min} caracteres${esPersonal(rol) ? " (regla para el personal del consultorio)" : ""}.`;
  }
  if (clave.length > MAX_CLAVE) return `La contraseña no puede superar ${MAX_CLAVE} caracteres.`;
  if (!/[A-ZÁÉÍÓÚÑÜ]/.test(clave)) return "La contraseña debe incluir al menos una letra mayúscula.";
  if (!/[0-9]/.test(clave)) return "La contraseña debe incluir al menos un número.";
  if (tieneSecuencia(clave)) return "No uses secuencias consecutivas como 1234 o abcd.";
  return null;
}
