import { NavBar } from "~/components/Navbar";
import ProtectedRoute from "~/components/ProtectedRoute";
import SessionExpiredGuard from "~/components/SessionExpiredGuard";
import { Outlet, useNavigate } from "react-router";
import ModalManager from "~/components/modals/ModalManager";
import { PedidosProvider } from "~/context/PedidoContext";
import { ConfiguracionesProvider } from "~/context/ConfiguracionesContext";
import { AdministracionProvider } from "~/context/AdministracionContext";
import { CarroceriasUsadasProvider } from "~/context/CarroceriasUsadasContext";
import { SociosProvider } from "~/context/SociosComercialesContext";
import { RRHHProvider } from "~/context/RRHHContext";
import { useAuth } from "~/context/AuthContext";
import { useEffect } from "react";

export default function Layout() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth) {
      navigate("/login");
    }
  }, [auth]);
  return (
    <main className="min-h-screen w-full flex flex-col gap-4 text-base-800 dark:text-white bg-white dark:bg-base-900">
      <SessionExpiredGuard />
      <NavBar />
      <div className="">
        <ProtectedRoute>
          <SociosProvider>
            <ConfiguracionesProvider>
              <AdministracionProvider>
                <RRHHProvider>
                  <CarroceriasUsadasProvider>
                    <PedidosProvider>
                      <div className="container mx-auto px-6 md:px-8 xl:px-0 pb-4">
                        <Outlet />
                      </div>
                      <ModalManager />
                    </PedidosProvider>
                  </CarroceriasUsadasProvider>
                </RRHHProvider>
              </AdministracionProvider>
            </ConfiguracionesProvider>
          </SociosProvider>
        </ProtectedRoute>
      </div>
    </main>
  );
}
