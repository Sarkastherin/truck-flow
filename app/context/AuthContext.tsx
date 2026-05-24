import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  useMemo,
} from "react";
import Auth, { Logout } from "../backend/Auth/auth";
import { getAllSheets } from "~/backend/Database/apiGoogleSheets";
import {
  SHEET_ID_USUARIOS,
  SHEET_NAMES_USUARIOS,
  getCompleteSheetRange,
} from "~/backend/Database/SheetsConfig";
import { getDataInJSONFormat } from "~/backend/Database/helperTransformData";
import type { UsersTable } from "~/types/users";
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
};
type AuthProviderProps = {
  children: ReactNode;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      } else {
        setAuth(false);
        setEmail(null);
        setErrorMessage(authResult.error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  const logout = useCallback(() => {
    const logoutResult = Logout();
    if (logoutResult) {
      setAuth(false);
      setEmail(null);
    }
  }, []);
  useEffect(() => {
    if (auth === null) {
      void getAuth();
    }
  }, [auth, getAuth]);
    return (
    <AuthContext.Provider value={{ auth, isLoading, getAuth, logout, email, errorMessage }}>
      {isLoading || auth === null ? <div>Cargando autenticación...</div> : children}
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
