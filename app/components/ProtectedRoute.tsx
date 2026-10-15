import { Navigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useEffect } from "react";
import { useUser } from "~/context/UserContext";
import { Logout } from "~/backend/Auth/auth";
import type { Role } from "~/types/users";
import { LoadingComponent } from "./LoadingComponent";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: Role[];
}
export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  allowedRoles,
}: ProtectedRouteProps) {
  const { auth, getAuth, isLoading: authLoading, sessionStatus, email } =
    useAuth();
  const { activeUser, isLoading: userLoading } = useUser();

  useEffect(() => {
    if (auth === null) {
      void getAuth();
    }
  }, [auth, getAuth]);


  if (auth === null || authLoading || (auth && userLoading)) {
    return <LoadingComponent />;
  }

  if (!auth) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si hay auth pero no hay usuario y no está cargando, mostrar error en vez de redirigir en bucle
  if (auth && !activeUser && !userLoading) {
    // La sesión se está recuperando: no mostrar el error todavía,
    // el SessionExpiredGuard gobierna esa etapa.
    if (sessionStatus === "expired" || sessionStatus === "refreshing") {
      return <LoadingComponent />;
    }

    const userErrorMessage = email
      ? `El usuario ${email} no está registrado o está inactivo en la hoja de usuarios. Contactá al administrador.`
      : "No se pudo obtener tu email de Google. Puede que falten permisos en el login de Google.";

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="bg-red-100 text-red-700 dark:bg-red-500/50 dark:text-red-400 px-4 py-2 rounded text-center">
          {userErrorMessage}
        </div>
        <button
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          onClick={() => {
            Logout();
            window.location.href = redirectTo;
          }}
        >
          {email ? "Cerrar sesión" : "Volver a intentar login"}
        </button>
      </div>
    );
  }

  if(activeUser && !activeUser.active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="bg-red-100 text-red-700 dark:bg-red-500/50 dark:text-red-400 px-4 py-2 rounded">
          {"El usuario está desactivado. Por favor, contacte al administrador."}
        </div>
      </div>
    );
  }

  if (allowedRoles && activeUser && !allowedRoles.includes(activeUser.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}