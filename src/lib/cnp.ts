/** Validare CNP românesc: 13 cifre, dată validă, cifră de control. */
export function isValidCnp(cnp: string): boolean {
  if (!/^[1-9]\d{12}$/.test(cnp)) return false;
  const w = "279146358279";
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(cnp[i]) * Number(w[i]);
  let c = sum % 11;
  if (c === 10) c = 1;
  if (c !== Number(cnp[12])) return false;
  const s = Number(cnp[0]);
  const century = s === 1 || s === 2 ? 1900 : s === 3 || s === 4 ? 1800 : s === 5 || s === 6 ? 2000 : 1900;
  const y = century + Number(cnp.slice(1, 3));
  const m = Number(cnp.slice(3, 5));
  const d = Number(cnp.slice(5, 7));
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Donatorul trebuie să fie major (18+). */
export function isAdultCnp(cnp: string): boolean {
  const s = Number(cnp[0]);
  const century = s === 3 || s === 4 ? 1800 : s === 5 || s === 6 ? 2000 : 1900;
  const birth = new Date(Date.UTC(century + Number(cnp.slice(1, 3)), Number(cnp.slice(3, 5)) - 1, Number(cnp.slice(5, 7))));
  const adult = new Date(birth);
  adult.setUTCFullYear(birth.getUTCFullYear() + 18);
  return adult <= new Date();
}
