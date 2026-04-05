import { useEffect } from "react";

export function useDarkMode() {
  useEffect(() => {
    // Función para aplicar el tema
    const applyTheme = () => {
      const stored = localStorage.getItem('flowbite-theme-mode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Si hay un valor guardado, usarlo; si no, usar la preferencia del sistema
      const isDark = stored === 'dark' || (!stored && prefersDark);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Aplicar tema al cargar
    applyTheme();

    // Escuchar cambios en localStorage (para sincronización entre tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flowbite-theme-mode') {
        applyTheme();
      }
    };

    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const stored = localStorage.getItem('flowbite-theme-mode');
      if (!stored) {
        applyTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);
}
