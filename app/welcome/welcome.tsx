import { DarkThemeToggle } from "flowbite-react";

export function Welcome() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Base Repo
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Stack base para nuevos proyectos. Clonalo y arranca.
            </p>
          </div>
          <DarkThemeToggle />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stack.map(({ name, description }) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-1"
            >
              <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 dark:text-gray-600">
          El toggle comprueba que dark mode + Flowbite están bien configurados.
        </p>
      </div>
    </main>
  );
}

const stack = [
  { name: "React Router v7", description: "Framework full-stack con SSR" },
  { name: "Tailwind CSS v4", description: "Utility-first CSS" },
  { name: "Flowbite React", description: "Componentes UI + DarkThemeToggle" },
  { name: "React Hook Form", description: "Manejo de formularios" },
  { name: "React Data Table", description: "Tablas con paginado y filtros" },
  { name: "React Icons", description: "Librería de iconos" },
  { name: "TypeScript", description: "Tipado estático" },
  { name: "useDarkMode", description: "Sincroniza tema con el sistema" },
];
