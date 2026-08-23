-- Email templates: auth user lookup RPC + seed HTML email copy (lv/en/ru).

create or replace function public.find_auth_user_by_email(p_email text)
returns table (id uuid, email_confirmed_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, auth, public
as $$
  select u.id, u.email_confirmed_at
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.find_auth_user_by_email(text) from public;
revoke all on function public.find_auth_user_by_email(text) from anon;
revoke all on function public.find_auth_user_by_email(text) from authenticated;
grant execute on function public.find_auth_user_by_email(text) to service_role;

insert into public.site_translations (translation_key, namespace, description, values)
values
  (
    'email.signup.subject',
    'email',
    'Email template subject (signup)',
    '{"lv":"Apstiprini e-pastu — {system}","en":"Confirm your email — {system}","ru":"Подтвердите e-mail — {system}"}'::jsonb
  ),
  (
    'email.signup.body',
    'email',
    'Email template body (signup)',
    '{"lv":"Sveiki, {name}!\n\nPaldies, ka reģistrējies sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu e-pastu un aktivizētu kontu.","en":"Hello, {name}!\n\nThanks for signing up to {system}.\n\nPress the button below to confirm your email and activate your account.","ru":"Здравствуйте, {name}!\n\nСпасибо за регистрацию в {system}.\n\nНажмите кнопку ниже, чтобы подтвердить e-mail и активировать аккаунт."}'::jsonb
  ),
  (
    'email.signup.button',
    'email',
    'Email template button (signup)',
    '{"lv":"Apstiprināt e-pastu","en":"Confirm email","ru":"Подтвердить e-mail"}'::jsonb
  ),
  (
    'email.password_reset.subject',
    'email',
    'Email template subject (password_reset)',
    '{"lv":"Atjauno paroli — {system}","en":"Reset your password — {system}","ru":"Сброс пароля — {system}"}'::jsonb
  ),
  (
    'email.password_reset.body',
    'email',
    'Email template body (password_reset)',
    '{"lv":"Sveiki, {name}!\n\nSaņēmām pieprasījumu atjaunot paroli sistēmā {system}.\n\nNospied pogu zemāk, lai izvēlētos jaunu paroli. Ja tu to nepieprasīji, vari ignorēt šo e-pastu.","en":"Hello, {name}!\n\nWe received a request to reset your password for {system}.\n\nPress the button below to choose a new password. If you did not request this, you can ignore this email.","ru":"Здравствуйте, {name}!\n\nМы получили запрос на сброс пароля в {system}.\n\nНажмите кнопку ниже, чтобы выбрать новый пароль. Если вы этого не запрашивали, просто проигнорируйте письмо."}'::jsonb
  ),
  (
    'email.password_reset.button',
    'email',
    'Email template button (password_reset)',
    '{"lv":"Atjaunot paroli","en":"Reset password","ru":"Сбросить пароль"}'::jsonb
  ),
  (
    'email.invite.subject',
    'email',
    'Email template subject (invite)',
    '{"lv":"Uzaicinājums komandai {team}","en":"Invitation to the {team} team","ru":"Приглашение в команду {team}"}'::jsonb
  ),
  (
    'email.invite.body',
    'email',
    'Email template body (invite)',
    '{"lv":"Sveiki, {name}!\n\n{inviter} uzaicina tevi pievienoties komandai „{team}” sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu uzaicinājumu.","en":"Hello, {name}!\n\n{inviter} invited you to join the team “{team}” in {system}.\n\nPress the button below to accept the invitation.","ru":"Здравствуйте, {name}!\n\n{inviter} приглашает вас присоединиться к команде «{team}» в {system}.\n\nНажмите кнопку ниже, чтобы принять приглашение."}'::jsonb
  ),
  (
    'email.invite.button',
    'email',
    'Email template button (invite)',
    '{"lv":"Pievienoties komandai","en":"Join the team","ru":"Присоединиться к команде"}'::jsonb
  ),
  (
    'email.notification.subject',
    'email',
    'Email template subject (notification)',
    '{"lv":"{system}: {title}","en":"{system}: {title}","ru":"{system}: {title}"}'::jsonb
  ),
  (
    'email.notification.body',
    'email',
    'Email template body (notification)',
    '{"lv":"Sveiki, {name}!\n\n{message}\n\nNospied pogu zemāk, lai atvērtu ierakstu sistēmā {system}.","en":"Hello, {name}!\n\n{message}\n\nPress the button below to open this item in {system}.","ru":"Здравствуйте, {name}!\n\n{message}\n\nНажмите кнопку ниже, чтобы открыть запись в {system}."}'::jsonb
  ),
  (
    'email.notification.button',
    'email',
    'Email template button (notification)',
    '{"lv":"Atvērt","en":"Open","ru":"Открыть"}'::jsonb
  ),
  (
    'email.footer_hint',
    'email',
    'Email template footer hint',
    '{"lv":"Ja poga nedarbojas, atver šo saiti pārlūkā:","en":"If the button does not work, open this link in your browser:","ru":"Если кнопка не работает, откройте эту ссылку в браузере:"}'::jsonb
  )
on conflict (translation_key) do nothing;
