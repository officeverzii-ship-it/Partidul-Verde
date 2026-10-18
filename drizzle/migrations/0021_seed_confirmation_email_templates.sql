INSERT INTO public.email_templates (name, subject, body_html)
SELECT v.name, v.subject, v.body_html
FROM (VALUES
  ('confirmare-adeziune',
   'Подтвердите адрес email — Partidul Verde',
   '<p>Бунă, {{prenume}}!</p><p>Спасибо за заявку на вступление в Partidul Verde. Подтвердите адрес email, перейдя по ссылке:</p><p><a href="{{link_confirmare}}">{{link_confirmare}}</a></p><p>Если вы не отправляли заявку, просто проигнорируйте это письмо.</p>'),
  ('confirmare-donatie',
   'Спасибо за пожертвование — Partidul Verde',
   '<p>Бунă, {{prenume}}!</p><p>Мы получили ваше пожертвование на сумму {{summa}} леев. Спасибо за поддержку Partidul Verde!</p><p>Чек и подтверждение оплаты придут от платёжной системы отдельно.</p>'),
  ('confirmare-newsletter',
   'Подтвердите подписку на рассылку Partidul Verde',
   '<p>Бунă, {{prenume}}!</p><p>Подтвердите подписку на рассылку, перейдя по ссылке:</p><p><a href="{{link_confirmare}}">{{link_confirmare}}</a></p><p>Если вы не подписывались, просто проигнорируйте это письмо.</p>')
) AS v(name, subject, body_html)
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates t WHERE t.name = v.name);