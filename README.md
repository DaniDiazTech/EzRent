# EzRent: arrienda sin vueltas

A prototype of a rental marketplace and landlord management platform for Bogotá, Colombia.

- **Tenants apply before they visit.** They upload their documents once, and our agent (simulated) replies right away with whether they meet each landlord's requirements (ingresos mínimos como múltiplo del canon, tipo de contrato, antigüedad, codeudor o póliza, historial crediticio).
- **3D tours decide the visit.** Every listing has an interactive 3D apartment (react-three-fiber) with buttons to jump between rooms.
- **Landlords get a cash stream.** They see only pre-qualified applicants, each with a short profile summary. After the lease starts, EzRent collects rent and pays agua, luz, gas, administración and predial automatically, charging a COP 3.000 fee per bill.

This is a frontend-only build. All data is seeded in code (`src/data/seed.ts`) and state is saved to `localStorage`, so the demo survives a refresh. The UI is in Spanish (es-CO) and prices are in COP.

## Languages

The app opens in **English** by default. Use the **EN / ES** toggle in the header to switch to Spanish (es-CO); the choice is saved with the rest of the demo state and survives a refresh or a demo reset.

- Copy is written inline with `tr(english, spanish)` from `src/lib/i18n.ts`, so every original Spanish string sits next to its English version.
- Seed data keeps its original Spanish fields and adds English ones (`titleEn`, `descriptionEn`, `amenitiesEn`, `cargoEn`, `employerEn`, `codeudorEn`, `polizaEn`, `noteEn`, `nameEn`, `tenantNameEn`).
- Spanish copy uses Colombian Spanish (for example *iluminado*, *paredes*, *espacios*), not Spain Spanish.
- Prices show as `COP 2,650,000` in English and `$ 2.650.000` in Spanish. Colombian terms with no direct equivalent (estrato, canon, administración, predial, cédula) are kept and explained in English.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS 4 · three.js + @react-three/fiber + @react-three/drei. Routing uses the URL hash (`#/inmueble/...`), so the site works as plain static hosting.

## Run locally

Requires Node 20 or later.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Deploy to Vercel

`vercel.json` is included (framework `vite`, build `npm run build`, output `dist`).

**Option A: Git integration (recommended).** In Vercel, go to **Add New → Project**, import `DaniDiazTech/EzRent`, and keep the detected settings. Every push to `main` deploys to production, and every other branch gets a preview URL.

**Option B: CLI.**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

## Demo path

1. **Explorar**: browse 8 listings and filter by barrio, precio and habitaciones. Every card has a "Recorrido 3D" badge.
2. Open **Chapinero**, tour the 3D apartment (Vista general, Sala-comedor, Cocina, Habitación principal, Baño, Habitación 2). You can also tap a room's floor, or use **Cortar muros**.
3. Click **Verificar si califico**, accept the habeas data consent (Ley 1581 de 2012), upload any files (or tap **Usar documentos de ejemplo**), then **Verificar requisitos** (Check requirements).
4. After about 3.5 seconds you see the extracted data and a pass/fail result for each requirement. The result says **Calificas**; click **Aplicar a este inmueble**.
5. **Mis aplicaciones** shows the new application as *Preaprobado*, next to seeded *En revisión* and *Rechazado* ones.
6. Switch the header to **Propietario**. Laura appears at the top of the Chapinero pipeline, marked NUEVO, with her profile summary. You can accept or decline her.
7. Open **Flujo de caja**: 6 months of rent, automatic bill payments, fees, and net income per property, with a chart.

Use the profile selector in the header to try other applicants. For example, *Camilo Herrera* (independiente, puntaje 574) does not qualify and sees what he is missing, plus listings where he would qualify. **Reiniciar demo** in the footer clears saved state.

## Seed data

| Barrio | Estrato | m² | Hab | Canon | Adm. |
|---|---|---|---|---|---|
| Chapinero | 5 | 68 | 2 | $2.650.000 | $420.000 |
| Teusaquillo | 4 | 86 | 3 | $2.600.000 | $290.000 |
| Usaquén (Santa Bárbara) | 6 | 110 | 3 | $5.200.000 | $890.000 |
| Cedritos | 4 | 78 | 3 | $2.450.000 | $330.000 |
| La Soledad | 4 | 62 | 2 | $2.100.000 | $210.000 |
| Galerías | 4 | 42 | 1 | $1.550.000 | $180.000 |
| Salitre | 4 | 72 | 3 | $2.300.000 | $360.000 |
| Suba | 3 | 64 | 3 | $1.650.000 | $210.000 |

The seed also has 2 landlords, 6 applicants with different profiles, and 5 leased properties with 6 months (April to September 2026) of rent and bill history. The agent's review is deterministic: `src/lib/evaluate.ts` applies each landlord's rules to the current applicant's seeded profile.

## Project layout

```
src/
  data/seed.ts        listings, landlords, applicants, applications, cash-flow history
  lib/evaluate.ts     requirement engine + profile summary text
  lib/store.tsx       React state persisted to localStorage
  lib/router.ts       tiny hash router
  tour/               3D apartment (Apartment.tsx) and camera/room controls (Tour.tsx)
  pages/              Listings, ListingDetail, Apply, Applications, Pipeline, CashFlow
```

The 3D tour is lazy-loaded, so three.js is only downloaded when someone opens a listing.
