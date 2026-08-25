-- Free (always) and paid catalog plans with names/descriptions in all
-- system languages. Modules stay empty so they can be assigned in admin.

alter table public.site_payment_plans
  add column if not exists is_free boolean not null default false;

insert into public.site_payment_plans (
  plan_key,
  name_values,
  description_values,
  is_free,
  sort_order,
  max_members,
  price_month,
  price_quarter,
  price_year,
  early_bird_price_month,
  early_bird_price_quarter,
  early_bird_price_year
)
values
  (
    'free',
    '{
      "lv": "Bezmaksas",
      "en": "Free",
      "ru": "Бесплатный",
      "de": "Kostenlos",
      "fr": "Gratuit",
      "es": "Gratis",
      "nl": "Gratis",
      "da": "Gratis",
      "no": "Gratis",
      "fi": "Ilmainen",
      "pl": "Bezpłatny",
      "lt": "Nemokamas",
      "et": "Tasuta",
      "it": "Gratuito",
      "sv": "Gratis"
    }'::jsonb,
    '{
      "lv": "Bezmaksas plāns. Vienmēr pieejams bez maksas.",
      "en": "Free plan. Always available at no cost.",
      "ru": "Бесплатный план. Всегда доступен без оплаты.",
      "de": "Kostenloser Plan. Immer ohne Gebühr verfügbar.",
      "fr": "Plan gratuit. Toujours disponible sans frais.",
      "es": "Plan gratuito. Siempre disponible sin coste.",
      "nl": "Gratis plan. Altijd beschikbaar zonder kosten.",
      "da": "Gratis plan. Altid tilgængelig uden betaling.",
      "no": "Gratis plan. Alltid tilgjengelig uten kostnad.",
      "fi": "Ilmainen suunnitelma. Aina saatavilla ilman maksua.",
      "pl": "Plan bezpłatny. Zawsze dostępny bez opłat.",
      "lt": "Nemokamas planas. Visada prieinamas be mokesčio.",
      "et": "Tasuta plaan. Alati saadaval tasuta.",
      "it": "Piano gratuito. Sempre disponibile senza costi.",
      "sv": "Gratisplan. Alltid tillgänglig utan kostnad."
    }'::jsonb,
    true,
    10,
    5,
    0,
    0,
    0,
    0,
    0,
    0
  ),
  (
    'paid',
    '{
      "lv": "Maksas",
      "en": "Paid",
      "ru": "Платный",
      "de": "Kostenpflichtig",
      "fr": "Payant",
      "es": "De pago",
      "nl": "Betaald",
      "da": "Betalt",
      "no": "Betalt",
      "fi": "Maksullinen",
      "pl": "Płatny",
      "lt": "Mokamas",
      "et": "Tasuline",
      "it": "A pagamento",
      "sv": "Betald"
    }'::jsonb,
    '{
      "lv": "Maksas plāns komandām.",
      "en": "Paid plan for teams.",
      "ru": "Платный план для команд.",
      "de": "Kostenpflichtiger Plan für Teams.",
      "fr": "Plan payant pour les équipes.",
      "es": "Plan de pago para equipos.",
      "nl": "Betaald plan voor teams.",
      "da": "Betalt plan til teams.",
      "no": "Betalt plan for team.",
      "fi": "Maksullinen suunnitelma tiimeille.",
      "pl": "Plan płatny dla zespołów.",
      "lt": "Mokamas planas komandoms.",
      "et": "Tasuline plaan meeskondadele.",
      "it": "Piano a pagamento per i team.",
      "sv": "Betald plan för team."
    }'::jsonb,
    false,
    20,
    5,
    0,
    0,
    0,
    0,
    0,
    0
  )
on conflict (plan_key) do nothing;
