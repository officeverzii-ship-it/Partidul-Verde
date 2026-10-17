/**
 * Configurare donații (Legea nr. 334/2006).
 * Actualizează salariul minim brut când se modifică prin HG.
 */
export const SALARIU_MINIM_BRUT_RON = 4050;
export const NUMAR_SALARII_PLAFON = 200;
/** Plafon anual per persoană fizică (CNP). */
export const PLAFON_ANUAL_CNP_RON = SALARIU_MINIM_BRUT_RON * NUMAR_SALARII_PLAFON;

export const PARTID = {
  denumireOficiala: "Partidul Verde",
  cif: "RO00000000", // TODO: înlocuiește cu CIF-ul real
};

export const MESAJ_PLAFON =
  "Suma depășește plafonul anual legal permis pentru donații de către o persoană fizică conform Legii nr. 334/2006.";
