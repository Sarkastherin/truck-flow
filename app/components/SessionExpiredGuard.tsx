import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { useAuth } from "~/context/AuthContext";
import type { RenewStage } from "~/backend/Auth/auth";

export default function SessionExpiredGuard() {
  const { sessionStatus, renewSession, logout } = useAuth();
  const [isRenewing, setIsRenewing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [stage, setStage] = useState<RenewStage>("silent");

  useEffect(() => {
    if (sessionStatus !== "expired") {
      setHasFailed(false);
      setIsRenewing(false);
      setStage("silent");
    }
  }, [sessionStatus]);

  const handleRenew = async () => {
    setIsRenewing(true);
    setHasFailed(false);
    setStage("silent");
    try {
      const renewed = await renewSession(setStage);
      if (!renewed) {
        setHasFailed(true);
      }
    } finally {
      setIsRenewing(false);
    }
  };

  if (sessionStatus === "refreshing") {
    return (
      <div
        className="fixed top-0 inset-x-0 z-[80] bg-amber-500 text-white text-sm text-center py-1.5 px-4"
        role="status"
      >
        Renovando sesión de Google...
      </div>
    );
  }

  if (sessionStatus !== "expired") {
    return null;
  }

  return (
    <>
      <div
        className="fixed top-0 inset-x-0 z-[80] bg-red-600 text-white text-sm text-center py-1.5 px-4"
        role="alert"
      >
        Sesión expirada: la edición está bloqueada hasta renovarla.
      </div>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-red-200 dark:bg-base-900 dark:border-red-500/40">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-center">
              <span className="text-2xl" aria-hidden>
                🔒
              </span>
              <h2 className="text-lg font-semibold text-base-800 dark:text-white">
                Tu sesión expiró
              </h2>
              <p className="text-sm text-base-600 dark:text-base-400">
                Google renueva los accesos cada hora. Para evitar que guardes
                sobre datos viejos, se bloqueó la edición hasta que la sesión se
                renueve. Tu trabajo en pantalla se conserva.
              </p>
            </div>

            {hasFailed && (
              <div className="bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-300 text-sm px-3 py-2 rounded-md text-center">
                No se pudo renovar automáticamente. Probá de nuevo o volvé a
                iniciar sesión con Google.
              </div>
            )}

            <div className="flex flex-col gap-2">
              {isRenewing && stage === "popup" && (
                <p className="text-sm text-center text-base-600 dark:text-base-400">
                  Se abrió una ventana de Google: completala ahí para renovar
                  la sesión.
                </p>
              )}
              <Button
                onClick={handleRenew}
                disabled={isRenewing}
                className="w-full"
              >
                {isRenewing ? "Renovando sesión..." : "Renovar sesión"}
              </Button>
              {hasFailed && (
                <Button color="alternative" onClick={logout} className="w-full">
                  Cerrar sesión e iniciar de nuevo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
