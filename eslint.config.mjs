// ESLint setup: Next.js's recommended rules plus one project decision.
// `npm run lint` must pass before every commit (see CLAUDE.md).
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // We use plain <img> for the logo and for photos (short-lived Supabase links), as CLAUDE.md requires.
      "@next/next/no-img-element": "off",
    },
  },
  // Generated files we don't lint.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
