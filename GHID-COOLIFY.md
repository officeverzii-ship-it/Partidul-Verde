# Partidul Verde (Verzii) — Contabo / Coolify

## Înainte de orice deploy: adu codul la zi în GitHub
Repository-ul `officeverzii-ship-it/Partidul-Verde` are acum o singură copie (17 octombrie, 15:52) în care **lipsesc** portalul intern, harta cu județe și modulele de CRM, email și donații. Dacă redeploy-ești acum, publică un site mai vechi decât ce vezi în preview.
1. În Lovable: **Project settings → Git → GitHub** → conectează repository-ul `officeverzii-ship-it/Partidul-Verde`, branch `main`.
2. Cât timp vezi „Lovable is N commits ahead of GitHub", așteaptă; sincronizarea e automată, nu există buton de push.
3. Abia apoi **Redeploy** în Coolify.

## Domeniu: partidulverde.duckdns.org
1. Deschide https://www.duckdns.org, autentifică-te (GitHub sau Google) și creează subdomeniul `partidulverde`.
2. Pune în câmpul de IP adresa serverului Contabo (`169.58.35.157`, dacă nu s-a schimbat) și salvează. DuckDNS rezolvă numele automat — nu ai de adăugat înregistrări A la niciun registrar.
3. Nu activa „Wildcard" dacă nu ai nevoie de `www`; folosește simplu `https://partidulverde.duckdns.org`.
4. Coolify → aplicația → **Settings → Domains** → adaugă `https://partidulverde.duckdns.org`.
5. HTTPS (Let's Encrypt) se emite singur prin Coolify, după ce DNS-ul indică spre server. Dacă un certificat eșuează, **nu** șterge și nu reîncerca la nesfârșit: DuckDNS împarte o singură limită Let's Encrypt cu toți utilizatorii și se poate atinge. Așteaptă și verifică din nou.
6. Pe server trebuie deschise porturile **80** și **443** (panoul Contabo / firewall).

## Variabile de mediu (Coolify → Environment Variables)
| Nume | Unde | Valoare |
|---|---|---|
| `VITE_SUPABASE_URL` | Build | `https://oppxryairenijsjmpbxn.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build | `sb_publishable_SsLs76mqt85zzQlCi8I3dw_W0fAPcoO` |
| `VITE_SITE_URL` | Build | `https://partidulverde.duckdns.org` (fără slash la final) |
| `SUPABASE_URL` | Runtime | `https://oppxryairenijsjmpbxn.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Runtime | `sb_publishable_SsLs76mqt85zzQlCi8I3dw_W0fAPcoO` |

Valorile de mai sus sunt cele reale ale acestui proiect și sunt publice (cheia publică apare oricum în codul site-ului), deci le poți copia direct din acest fișier — nu mai trebuie să cauți `.env`.

`VITE_SITE_URL` controlează linkurile din emailuri (confirmare newsletter, dezabonare), adresa canonică și previzualările afișate pe Facebook/WhatsApp.

## Instalare
1. Dezarhivează pachetul și pune conținutul în repository-ul tău GitHub (fără `.env`).
2. Coolify → New Resource → Application → selectează repository-ul → Build Pack: Dockerfile.
3. Dockerfile: `/Dockerfile`; portul aplicației: **3000**; domeniu complet `https://partidulverde.duckdns.org`.
4. Adaugă variabilele publice `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL` pentru build. Folosește valorile publice reale din proiect, nu exemplele din ghiduri. `VITE_SITE_URL` este domeniul final, fără slash la final.
5. La runtime: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. Datele și conturile rămân pe Lovable Cloud dacă folosești aceeași conexiune.
6. Deploy. Containerul pornește `node .output/server/index.mjs`; Coolify asigură HTTPS. Nu încărca doar fișierele publice: formularele cer aplicația completă.

## După ce domeniul merge
- Stripe → Webhooks: `https://partidulverde.duckdns.org/api/public/payments/webhook`
- Resend → Webhooks: `https://partidulverde.duckdns.org/api/public/resend/webhook`
- Loginul cu Google prin Lovable poate refuza un domeniu care nu este autorizat pentru broker; loginul cu email și parolă funcționează oricum.

## Dacă Acasă, Articole sau Filiale dau eroare 500
- Mesajul `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL` înseamnă că valoarea adresei bazei de date este invalidă, nu că serverul nu pornește.
- În Coolify → Environment Variables, câmpul **Name** conține `SUPABASE_URL`, iar câmpul **Value** conține doar adresa reală HTTP/HTTPS a bazei de date (nu numele variabilei, nu adresa site-ului, nu un exemplu). Activează Runtime. Pentru `SUPABASE_PUBLISHABLE_KEY`, Value conține doar cheia publică reală.
- Codul normalizează spațiile, ghilimelele și atribuirea lipită accidental. Dacă variabilele runtime lipsesc, conținutul și formularele publice folosesc configurația publică `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` inclusă la build. O adresă runtime prezentă dar invalidă este respinsă; nu este înlocuită automat cu altă bază de date.
- Păstrează variabilele `VITE_` active la Build pentru browser și administrare. Nu introduce chei private în ele.
- Salvează variabilele și fă **Redeploy** după actualizarea codului din repository. Un restart nu include modificările de cod sau variabilele de build.

## Ce este inclus
- Identitatea originală verde-galben, siglele și fotografia de pădure.
- 8 articole reale, 11 teme de viziune, programul politic, statutul, carta și comunitatea verde, conducerea și paginile legale.
- Formulare de contact/newsletter și cerere de adeziune, cu stocare reală și administrare.
- Administrare articole, pagini, evenimente, filiale și cereri.
- Mesajele de test pot fi șterse din administrare după verificare.
- Fișierele media disponibile sunt incluse local în `public/__l5e/assets-v1/`; containerul le servește independent.

## Limite care trebuie rezolvate înainte de lansarea oficială
- `partidulverde.duckdns.org` este un subdomeniu gratuit, potrivit pentru testare: nu primește emailuri pe numele lui și nu arată a site oficial. Pentru lansare cumpără `partidulverde.ro` și schimbă doar `VITE_SITE_URL` (plus domeniul din Coolify), restul rămâne la fel.
- Nu este o copie pixel-cu-pixel: serverul WordPress a blocat cele mai multe fotografii, formularul PDF și detaliile filialelor. În locul fotografiilor indisponibile apare sigla partidului; formularul PDF rămâne legat de original. Directorul are județele, fără coordonatori/adrese inventate. Trimite fotografiile și contactele reale pentru completare.
- Paginile legale sunt preluate din original; nu reprezintă validare juridică. Confidențialitatea/termenii trebuie actualizați pentru utilizarea reală, inclusiv CNP și date sensibile de adeziune.
- Newsletterul înregistrează abonările, dar nu trimite campanii; confirmările prin email nu sunt implementate. CAPTCHA/antispam și dezabonarea automată nu sunt implementate.
- Autentificarea Google folosește serviciul Lovable și trebuie verificată/configurată pentru noul domeniu; nu presupune că funcționează imediat în afara Lovable. Loginul cu email existent rămâne disponibil, cu URL-urile de confirmare autorizate pentru domeniul nou.
- Plățile EuPlătesc folosesc `EUPLATESC_MID`, `EUPLATESC_KEY` și o conexiune privilegiată server-side. Cheia de serviciu Lovable Cloud nu poate fi exportată. Pentru plăți pe serverul tău ai nevoie de o bază de date proprie compatibilă sau de o integrare securizată separată; nu pune niciodată această cheie într-o variabilă `VITE_`.
- Pentru backend propriu, aplică în ordine fișierele din `supabase/migrations/`, apoi `drizzle/migrations/0000*.sql` și `0001*.sql`; conturile și rolurile necesită migrare separată. Acest pachet nu include conturi, membri, mesaje sau donații. Conținutul public este în `export/public-content.json` și `export/public-content.sql` (se aplică după schema completă); acestea nu conțin date personale de înscriere sau donații.
- Setează în EuPlătesc URL de notificare `https://domeniul-tau.ro/api/public/euplatesc/callback`; verifică plata reală/test și confirmarea înainte de acceptarea donațiilor. Emailul donatorului rămâne neimplementat.

## Verificări efectuate
Contactul și newsletterul au fost trimise și citite în panoul administratorului; formularul de adeziune este validat și are teste automate. Navigarea și afișarea pe telefon sunt verificate. Instalarea efectivă pe VPS, Google pe domeniul extern și plata EuPlătesc nu pot fi declarate verificate aici.
