# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Mock API Development with MSW

This project uses [Mock Service Worker (MSW)](https://mswjs.io/) to enable rapid frontend development against realistic API mocks.

- **To enable mock API mode:**
  - Set `VITE_API_MOCK=1` in your `.env` or `.env.local` file (default in this repo).
  - When running `npm run dev`, MSW will intercept API requests and serve mock data from `src/mocks/handlers/`.
- **To use the live backend:**
  - Set `VITE_API_MOCK=0` (or remove the variable) in your `.env`.
  - API requests will be sent to the real backend (ensure your proxy is configured if needed).

**How it works:**
- In development, the app checks `VITE_API_MOCK` and starts MSW if set to `1`.
- All major endpoints are mocked in `src/mocks/handlers/` (auth, company, customers, campaigns, etc.).
- You can develop the UI and flows before backend endpoints are ready, or switch to live backend as needed.

See `src/main.tsx` and `src/mocks/` for details.

## Design System & Tailwind Integration

- All custom colors are now defined under `theme.extend.colors` in `tailwind.config.cjs`.
- This ensures that both custom and default Tailwind color utilities (e.g., `bg-primary-base`, `text-primary-base`) work as expected.
- To add or update design tokens (colors, spacing, etc.), edit `tailwind.config.cjs` under the appropriate `extend` section.

### Example: Adding a New Color
```js
// tailwind.config.cjs
extend: {
  colors: {
    'brand-accent': '#FFB800',
  },
}
```

## Troubleshooting: Custom Color Utilities
- If you see errors like `bg-primary-base` not found, ensure the color is under `theme.extend.colors` (not `theme.colors`).
- After updating the config, restart the Tailwind watcher and Vite dev server.
- If issues persist, delete `.next`, `dist`, or `node_modules` and reinstall dependencies.

## Dev Workflow
- Run Tailwind in watch mode:
  ```sh
  npx tailwindcss -i ./src/index.css -o ./dist/output.css --config ./tailwind.config.cjs --watch
  ```
- Start the Vite dev server:
  ```sh
  npm run dev
  ```

## References
- [Tailwind Customization Docs](https://tailwindcss.com/docs/theme#extending-the-default-theme)
- [Design System JSON](../design-system.json)

## Tailwind CSS Custom Color Utility Best Practices

### Defining Custom Colors
- **Use flat keys** in `tailwind.config.cjs` for each custom color:
  ```js
  extend: {
    colors: {
      'primary-base': '#387FF5',
      'primary-hover': '#2968DD',
      // ...etc
    }
  }
  ```
- This ensures Tailwind v3 generates utility classes like `bg-primary-base`, `text-primary-base`, etc.

### Safelisting Custom Utilities
- If you use custom color utilities only in CSS (e.g., with `@apply`), add them to the `safelist` in `tailwind.config.cjs`:
  ```js
  safelist: [
    'bg-primary-base',
    'bg-primary-hover',
    // ...other custom bg- classes
  ]
  ```
- This forces Tailwind to generate these classes even if not found in your HTML/JSX.

### Using Custom Utilities
- You can now use `bg-primary-base`, `bg-primary-hover`, etc. directly in your JSX, HTML, or with `@apply` in CSS.
- Example:
  ```jsx
  <button className="bg-primary-base text-white hover:bg-primary-hover">Click me</button>
  ```

### Common Pitfalls
- **Do not use nested color objects** (e.g., `primary: { base: ... }`) unless you are on Tailwind v4+ and know the new color system.
- If you see errors about unknown utility classes, check your safelist and color key format.
- Make sure your `postcss.config.cjs` only uses `require('tailwindcss')` and `require('autoprefixer')` as plugins.

### Upgrading
- If you upgrade to Tailwind v4+, review the new color system and update your config accordingly.
