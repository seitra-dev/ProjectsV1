// ============================================================================
// FESTIVOS DE COLOMBIA — cálculo algorítmico (Ley Emiliani + festivos fijos)
// ============================================================================
// Se usa para no penalizar como "tarde" el cierre de tareas cuyo plazo cae
// en un día no laboral (fin de semana o festivo).
// ============================================================================

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (d, n) => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
};

// Algoritmo de Meeus/Jones/Butcher para el Domingo de Pascua (calendario gregoriano)
const getEasterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
};

// Ley Emiliani: si el festivo no cae en lunes, se traslada al lunes siguiente
const toNextMonday = (d) => {
  const dow = d.getUTCDay(); // 0=domingo ... 6=sábado
  const diff = (1 - dow + 7) % 7;
  return addDays(d, diff);
};

const holidaysCache = {};

export const getColombianHolidays = (year) => {
  if (holidaysCache[year]) return holidaysCache[year];

  const easter = getEasterSunday(year);

  // Festivos fijos (no se trasladan)
  const fixed = [
    [1, 1],   // Año Nuevo
    [5, 1],   // Día del Trabajo
    [7, 20],  // Independencia
    [8, 7],   // Batalla de Boyacá
    [12, 8],  // Inmaculada Concepción
    [12, 25], // Navidad
  ].map(([m, d]) => new Date(Date.UTC(year, m - 1, d)));

  // Festivos trasladables al lunes siguiente (Ley Emiliani)
  const emiliani = [
    [1, 6],   // Reyes Magos
    [3, 19],  // San José
    [6, 29],  // San Pedro y San Pablo
    [8, 15],  // Asunción de la Virgen
    [10, 12], // Día de la Raza
    [11, 1],  // Todos los Santos
    [11, 11], // Independencia de Cartagena
  ].map(([m, d]) => toNextMonday(new Date(Date.UTC(year, m - 1, d))));

  // Festivos basados en Pascua
  const easterBased = [
    addDays(easter, -3), // Jueves Santo
    addDays(easter, -2), // Viernes Santo
    addDays(easter, 43), // Ascensión del Señor (ya cae en lunes)
    addDays(easter, 64), // Corpus Christi (ya cae en lunes)
    addDays(easter, 71), // Sagrado Corazón de Jesús (ya cae en lunes)
  ];

  const set = new Set([...fixed, ...emiliani, ...easterBased].map(toDateStr));
  holidaysCache[year] = set;
  return set;
};

export const isColombianHoliday = (dateStr) => {
  const year = Number(dateStr.slice(0, 4));
  return getColombianHolidays(year).has(dateStr.slice(0, 10));
};

const isWeekend = (date) => {
  const dow = date.getUTCDay();
  return dow === 0 || dow === 6;
};

const parseDateOnly = (dateStr) => {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

// Cuenta los días hábiles (no sábado/domingo/festivo) estrictamente
// posteriores a `fromStr` hasta `toStr` (inclusive).
export const countBusinessDaysAfter = (fromStr, toStr) => {
  let cursor = parseDateOnly(fromStr);
  const end = parseDateOnly(toStr);
  if (end <= cursor) return 0;

  let count = 0;
  cursor = addDays(cursor, 1);
  while (cursor <= end) {
    if (!isWeekend(cursor) && !isColombianHoliday(toDateStr(cursor))) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
};
