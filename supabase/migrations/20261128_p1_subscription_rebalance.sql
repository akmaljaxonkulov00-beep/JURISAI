-- P1-6 Subscription Rebalancing Migration (Non-destructive)
-- Grants Free tier limited trial access to Virtual Court (2), Decision Tree (2), and Document Analysis (2),
-- and removes paused Marketplace claims from Pro plan features.
-- Preserves all existing user_subscriptions and payment_requests records untouched.

UPDATE pricing_plans
SET
  limits = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(limits, '{}'::jsonb),
        '{virtual_court}',
        '2'::jsonb
      ),
      '{decision_tree}',
      '2'::jsonb
    ),
    '{document_analysis}',
    '2'::jsonb
  ),
  features = ARRAY[
    'To''liq qonunlar bazasi — cheksiz',
    '30 ta AI chat so''rovi / oy',
    '10 ta IRAC tahlili / oy',
    '10 ta hujjat generator / oy',
    '2 ta AI Drafting Coach tahlili / oy',
    '2 ta virtual sud sessiyasi / oy',
    '2 ta qarorlar daraxti (AI) / oy',
    '10 ta ovozli yozuv (STT) / oy',
    '5 ta senariy generator / oy',
    'Asboblar, jamiyat, statistika — cheksiz'
  ],
  updated_at = NOW()
WHERE id = 'free';

UPDATE pricing_plans
SET
  features = ARRAY[
    'AI chat so''rovlari — Fair Use',
    'IRAC va Imtihon rejimi — Fair Use',
    'Hujjat va AI Drafting Coach — Fair Use',
    'Qarorlar daraxti — Fair Use',
    'Senariy generator — Fair Use',
    'Ovozli yozuv (STT) — Fair Use',
    '50 ta virtual sud sessiyasi / oy',
    'Rasmiy .docx va sud PDF eksport',
    'Ustuvor tezkor AI tahlil'
  ],
  updated_at = NOW()
WHERE id = 'pro';
