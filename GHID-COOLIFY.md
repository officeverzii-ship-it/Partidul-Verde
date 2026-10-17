# Partidul Verde (Verzii) — Contabo / Coolify

## Instalare
1. Dezarhivează pachetul și pune conținutul în repository-ul tău GitHub (fără `.env`).
2. Coolify → New Resource → Application → selectează repository-ul → Build Pack: Dockerfile.
3. Dockerfile: `/Dockerfile`; portul aplicației: **3000**; domeniu complet `https://domeniul-tau.ro`.
4. Adaugă variabilele publice `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL` pentru build. Folosește valorile publice reale din proiect, nu exemplele din ghiduri. `VITE_SITE_URL` este domeniul final, fără slash la final.
5. La runtime: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. Datele și conturile rămân pe Lovable Cloud dacă folosești aceeași conexiune.
6. Deploy. Containerul pornește `node .output/server/index.mjs`; Coolify asigură HTTPS. Nu încărca doar fișierele publice: formularele cer aplicația completă.

## Ce este inclus
- Identitatea originală verde-galben, siglele și fotografia de pădure.
- 8 articole reale, 11 teme de viziune, programul politic, statutul, carta și comunitatea verde, conducerea și paginile legale.
- Formulare de contact/newsletter și cerere de adeziune, cu stocare reală și administrare.
- Administrare articole, pagini, evenimente, filiale și cereri.
- Mesajele de test pot fi șterse din administrare după verificare.
- Fișierele media disponibile sunt incluse local în `public/__l5e/assets-v1/`; containerul le servește independent.

## Limite care trebuie rezolvate înainte de lansarea oficială
- Nu este o copie pixel-cu-pixel: serverul WordPress a blocat cele mai multe fotografii, formularul PDF și detaliile filialelor. În locul fotografiilor indisponibile apare sigla partidului; formularul PDF rămâne legat de original. Directorul are județele, fără coordonatori/adrese inventate. Trimite fotografiile și contactele reale pentru completare.
- Paginile legale sunt preluate din original; nu reprezintă validare juridică. Confidențialitatea/termenii trebuie actualizați pentru utilizarea reală, inclusiv CNP și date sensibile de adeziune.
- Newsletterul înregistrează abonările, dar nu trimite campanii; confirmările prin email nu sunt implementate. CAPTCHA/antispam și dezabonarea automată nu sunt implementate.
- Autentificarea Google folosește serviciul Lovable și trebuie verificată/configurată pentru noul domeniu; nu presupune că funcționează imediat în afara Lovable. Loginul cu email existent rămâne disponibil, cu URL-urile de confirmare autorizate pentru domeniul nou.
- Plățile EuPlătesc folosesc `EUPLATESC_MID`, `EUPLATESC_KEY` și o conexiune privilegiată server-side. Cheia de serviciu Lovable Cloud nu poate fi exportată. Pentru plăți pe serverul tău ai nevoie de o bază de date proprie compatibilă sau de o integrare securizată separată; nu pune niciodată această cheie într-o variabilă `VITE_`.
- Pentru backend propriu, aplică în ordine fișierele din `supabase/migrations/`, apoi `drizzle/migrations/0000*.sql` și `0001*.sql`; conturile și rolurile necesită migrare separată. Acest pachet nu include conturi, membri, mesaje sau donații. Conținutul public este în `export/public-content.json` și `export/public-content.sql` (se aplică după schema completă); acestea nu conțin date personale de înscriere sau donații.
- Setează în EuPlătesc URL de notificare `https://domeniul-tau.ro/api/public/euplatesc/callback`; verifică plata reală/test și confirmarea înainte de acceptarea donațiilor. Emailul donatorului rămâne neimplementat.

## Verificări efectuate
Contactul și newsletterul au fost trimise și citite în panoul administratorului; formularul de adeziune este validat și are teste automate. Navigarea și afișarea pe telefon sunt verificate. Instalarea efectivă pe VPS, Google pe domeniul extern și plata EuPlătesc nu pot fi declarate verificate aici.
