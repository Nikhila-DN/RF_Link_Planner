# RF Link Planner (React + Leaflet)
Simplified RF Outdoor Link Planner Tool [RF (Radio Frequency) concepts]

### Links

- Solution URL: https://github.com/Nikhila-DN/RF_Link_Planner.git
- Live Site URL: https://rf-link-plannner-by-nikhila-d.netlify.app/

## Summary
A simple frontend-only RF point-to-point link planner built with React and Leaflet. Users can place towers on the map, configure frequencies (GHz), connect towers with matching frequencies, and visualize a simplified first Fresnel zone as a 2D ellipse.

## Features
- Click map to add towers
- Edit frequency for each tower (GHz)
- Create links by clicking one tower and then another (must have same frequency)
- Links displayed as polylines; click a link to show simplified Fresnel zone
- Sidebar to manage towers and links

## Run locally
1. Install dependencies
   ```bash
   npm install
   ```
2. Run development server
   ```bash
   npm run dev
   ```
3. Open the URL printed by Vite (usually http://localhost:5173)

## Build & Deploy
- Build: `npm run build`
- Preview build: `npm run preview`

### Deploy to Vercel
1. Push the project to GitHub
2. Import the repository on vercel.com
3. Vercel auto-detects Vite and deploys

## Notes & Next Steps
- Fresnel zone is simplified (2D ellipse at midpoint). For more accuracy, sample elevations (Open-Elevation) and compute radius along the path.
- Elevation sampling and obstruction checks can be added.


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
