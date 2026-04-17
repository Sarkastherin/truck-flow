import { NavBar } from "~/components/Navbar";
import ProtectedRoute from "~/components/ProtectedRoute";
import { Outlet } from "react-router";
import ModalManager from "~/components/modals/ModalManager";
import { PedidosProvider } from "~/context/PedidoContext";
import { ConfiguracionesProvider } from "~/context/ConfiguracionesContext";
import { AdministracionProvider } from "~/context/AdministracionContext";
import { GlobalProvider } from "~/context/GlobalContext";
import {
  SociosProvider,
  useSociosComercial,
} from "~/context/SociosComercialesContext";
import { LoadingComponent } from "~/components/LoadingComponent";

function ProvidersAfterSocios({ children }: { children: React.ReactNode }) {
  const { isReady, isLoading } = useSociosComercial();

  if (isLoading || !isReady) {
    return <LoadingComponent message="Cargando socios comerciales..." />;
  }

  return (
    <ConfiguracionesProvider>
      <AdministracionProvider>
        <PedidosProvider>{children}</PedidosProvider>
      </AdministracionProvider>
    </ConfiguracionesProvider>
  );
}

export default function Layout() {
  return (
    <main className="min-h-screen w-full flex flex-col gap-4 text-gray-800 dark:text-white bg-white dark:bg-gray-900">
      <NavBar />
      <div className="">
        <ProtectedRoute>
          <GlobalProvider>
            <SociosProvider>
              <ProvidersAfterSocios>
                    <div className="container mx-auto px-6 lg:px-0">
                      <Outlet />
                    </div>
                    <ModalManager />
              </ProvidersAfterSocios>
            </SociosProvider>
          </GlobalProvider>
        </ProtectedRoute>
      </div>
    </main>
  );
}
