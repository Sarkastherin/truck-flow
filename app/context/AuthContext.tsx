import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  useMemo,
} from "react";
import Auth, {
  Logout,
  renewSession,
  getUserEmail,
} from "../backend/Auth/auth";
import { getAllSheets } from "~/backend/Database/apiGoogleSheets";
import {
  SHEET_ID_USUARIOS,
  SHEET_NAMES_USUARIOS,
  getCompleteSheetRange,
} from "~/backend/Database/SheetsConfig";
import { getDataInJSONFormat } from "~/backend/Database/helperTransformData";
import {
  getSessionStatus,
  setSessionStatus,
  subscribeSessionStatus,
  type SessionStatus,
} from "~/utils/authEvents";
import type { UsersTable } from "~/types/users";
import {useNavigate} from "react-router";
const apiKey =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_KEY_DEV
    : import.meta.env.VITE_API_KEY;

const clientId =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_CLIENT_ID_DEV
    : import.meta.env.VITE_CLIENT_ID;

type AuthContextType = {
  auth: boolean | null;
  email: string | null;
  isLoading: boolean;
  getAuth: () => Promise<void>;
  logout: () => void;
  errorMessage: string | null;
  sessionStatus: SessionStatus;
  renewSession: () => Promise<boolean>;
};
type AuthProviderProps = {
  children: ReactNode;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionStatus, setLocalSessionStatus] = useState<SessionStatus>(
    getSessionStatus,
  );

  useEffect(() => {
    return subscribeSessionStatus(setLocalSessionStatus);
  }, []);

  const authGoogle = async () => {
    const authResult = await Auth(apiKey, clientId);
    return authResult;
  };
  const getAuth = useCallback(async () => {
    console.log("Iniciando proceso de autenticación...");
    setIsLoading(true);
    try {
      const authResult = await authGoogle();
      if (authResult && authResult.success) {
        setAuth(true);
        setEmail(authResult.email);
        setErrorMessage(null);
      } else {
        setAuth(false);
        setEmail(null);
        setErrorMessage(authResult.error);
      }
    } catch (error) {
      console.error("Error inesperado de autenticación:", error);
      setAuth(false);
      setEmail(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Error de autenticación",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  const logout = useCallback(() => {
    const logoutResult = Logout();
    if (logoutResult) {
      setAuth(false);
      setEmail(null);
      setErrorMessage(null);
      setSessionStatus("checking");
    }
  }, []);
  const handleRenewSession = useCallback(async (): Promise<boolean> => {
    const renewed = await renewSession();
    if (!renewed) {
      return false;
    }

    // Restaurar identidad con el token nuevo sin tocar isLoading,
    // para no desmontar el contenido que el usuario tiene en pantalla.
    const freshEmail = await getUserEmail();
    if (freshEmail) {
      setEmail(freshEmail);
      setErrorMessage(null);
      return true;
    }

    // El userinfo sigue fallando tras renovar: reinicio limpio.
    console.error(
      "Sesión renovada pero no se pudo obtener el email; recargando la aplicación.",
    );
    window.location.reload();
    return true;
  }, []);
    return (
    <AuthContext.Provider
      value={{
        auth,
        isLoading,
        getAuth,
        logout,
        email,
        errorMessage,
        sessionStatus,
        renewSession: handleRenewSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
