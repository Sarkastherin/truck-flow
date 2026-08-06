# Base Repo

Repo base para arrancar proyectos nuevos. Cloná, instalá y listo.

## Stack

| Paquete | Versión | Para qué |
|---|---|---|
| React Router | v7 | Framework full-stack con SSR |
| Tailwind CSS | v4 | Utility-first CSS |
| Flowbite React | latest | Componentes UI + dark mode toggle |
| React Hook Form | v7 | Manejo de formularios |
| React Data Table | v7 | Tablas con paginado y filtros |
| React Icons | v5 | Librería de iconos |
| TypeScript | v5 | Tipado estático |

## Uso

```bash
# Clonar
git clone <url> nombre-proyecto
cd nombre-proyecto

# Instalar
npm install

# Desarrollo
npm run dev
# → http://localhost:5173
```

## Scripts

```bash
npm run dev        # Servidor de desarrollo con HMR
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run typecheck  # Chequeo de tipos
```

## Dark mode

Configurado con `useDarkMode` (hook en `app/hooks/`) que sincroniza el tema con la preferencia del sistema y persiste en `localStorage` vía la key `flowbite-theme-mode`. Funciona junto con el `<DarkThemeToggle />` de Flowbite.

## Deploy en Netlify

Configurado como SPA (`ssr: false`) con `netlify.toml` listo:

1. Subí el repo a GitHub
2. En Netlify: **Add new site → Import an existing project** → conectá el repo
3. Netlify detecta el `netlify.toml` automáticamente — no hay que configurar nada más
4. Deploy

Configuración aplicada:
```toml
[build]
  command = "npm run build"
  publish = "build/client"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

El redirect `/*` es necesario para que el routing del lado del cliente funcione correctamente al navegar o hacer refresh.

## Build local

```bash
npm run build
```

Output:
```
build/
└── client/   # Assets estáticos (lo que Netlify publica)
```

## Licencia

[MIT](LICENSE)
