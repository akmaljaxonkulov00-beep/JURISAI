import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // O'zbek tilidagi matnlarda apostrof (') JSX ichida keng ishlatiladi
      // (masalan "O'zbekiston", "to'lov"). Bu HTML entity konflikti emas —
      // loyiha tili uchun apostrofni ruxsat beramiz.
      "react/no-unescaped-entities": [
        "error",
        { forbid: [">", '"', "}"] },
      ],

      // react-hooks v6 yangi qat'iy qoidalari — legacy kod uchun tavsiya
      // darajasida (build'ni buzmaydi, lekin ko'rinib turadi).
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // Legacy Next.js komponentlarida <img>/<a> — xato emas, tavsiya
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",

      // Server route'larda ixtiyoriy paketlar require() bilan yuklanadi
      // (try/catch ichida — Stripe/Telegram mavjud bo'lmasa ishlamaydi)
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
]);

export default eslintConfig;
