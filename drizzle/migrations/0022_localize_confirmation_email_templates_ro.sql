UPDATE public.email_templates SET
  subject = 'Confirmă adresa de email — Partidul Verde',
  body_html = '<p>Bună, {{prenume}}!</p><p>Îți mulțumim pentru cererea de înscriere în Partidul Verde. Confirmă adresa de email accesând linkul de mai jos:</p><p><a href="{{link_confirmare}}">{{link_confirmare}}</a></p><p>Dacă nu ai trimis această cerere, poți ignora acest mesaj.</p>'
WHERE name = 'confirmare-adeziune';

UPDATE public.email_templates SET
  subject = 'Îți mulțumim pentru donație — Partidul Verde',
  body_html = '<p>Bună, {{prenume}}!</p><p>Am primit donația ta în valoare de {{summa}}. Îți mulțumim pentru susținerea Partidului Verde!</p><p>Dovada plății este emisă de sistemul de plăți și îți va fi transmisă separat.</p>'
WHERE name = 'confirmare-donatie';

UPDATE public.email_templates SET
  subject = 'Confirmă abonarea la noutățile Partidul Verde',
  body_html = '<p>Bună, {{prenume}}!</p><p>Confirmă abonarea la noutățile Partidului Verde accesând linkul de mai jos:</p><p><a href="{{link_confirmare}}">{{link_confirmare}}</a></p><p>Dacă nu te-ai abonat, poți ignora acest mesaj.</p>'
WHERE name = 'confirmare-newsletter';