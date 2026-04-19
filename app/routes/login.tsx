import { useEffect } from "react";
import type { Route } from "./+types/home";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { LogoComponent } from "~/components/LogoComponent";
import PaintRollerIcon from "~/components/PaintRollerIcon";
import { Button, Card } from "flowbite-react";
import pkg from "../../package.json";
const appVersion = pkg.version;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Autenticación" },
    { name: "description", content: "Página de autenticación" },
  ];
}

export default function Login() {
  const { getAuth, auth, errorMessage } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (auth) {
      navigate("/");
    }
  }, [auth]);

  return (
    <div className="min-h-screen relative">
      {/* Hero Background - Overlay más sutil */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/cover.webp")' }}
      >
        {/* Overlay más sutil para mejor contraste */}
        <div className="absolute inset-0 bg-linear-to-br from-black/50 via-black/60 to-black/70"></div>
      </div>
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="relative w-full max-w-md bg-white/10 dark:bg-white/10 dark:border-gray-400 backdrop-blur-sm shadow-lg rounded-xl p-6">
          <div className="mb-8 text-center">
            {/* Logo con mejor contraste */}
            <div className="w-16 h-16 backdrop-blur-sm bg-white/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/40 shadow-lg">
              <PaintRollerIcon size={38} color="#ffffff" />
            </div>

            {/* Título */}
            <h1 className="px-2 pb-4 scale-180">
              <LogoComponent noTheme />
            </h1>

            <p className="text-white text-lg font-light">
              Organiza tus procesos de manera eficiente
            </p>
          </div>
          <Button color="violet" className="w-full" onClick={getAuth}>
            Iniciar sesión con Google
          </Button>
          {errorMessage && (
            <p className="text-sm font-medium text-center text-white bg-red-600 rounded-md py-2">{`${errorMessage?.includes("gapi") ? "Comprueba tu conexión" : errorMessage}`}</p>
          )}
          <p className="text-sm text-center text-white ">
            Versión: {appVersion}
          </p>
        </Card>
        <div className="absolute bottom-4 w-full border-t border-white/20 pt-2">
          <div className="flex  gap-4 justify-center text-sm text-center text-white">
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </a>
            <span> | </span>
            <a href="/terms.html" target="_blank" rel="noopener noreferrer">
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
