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
  const { auth, getAuth, isLoading: authLoading } = useAuth();
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="bg-red-100 text-red-700 dark:bg-red-500/50 dark:text-red-400 px-4 py-2 rounded">
          {"No se pudo obtener los datos del usuario. Puede que falten permisos en el login de Google."}
        </div>
        <button
          className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
          onClick={() => {
            Logout();
            window.location.href = redirectTo;
          }}
        >
          Volver a intentar login
        </button>
      </div>
    );
  }

  if (allowedRoles && activeUser && !allowedRoles.includes(activeUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}