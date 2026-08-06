import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAllSheets,
  type SheetCellValue,
} from "~/backend/Database/apiGoogleSheets";
import { getDataInJSONFormat } from "~/backend/Database/helperTransformData";
import { useAuth } from "~/context/AuthContext";
import { useGlobal } from "~/context/GlobalContext";
import type { UsersTable } from "~/types/users";
import {
  SHEET_ID_USUARIOS,
  SHEET_NAMES_USUARIOS,
  getCompleteSheetRange,
} from "~/backend/Database/SheetsConfig";
import type { CreateGlobalMethod, UpdateGlobalMethod, CrudGlobalResponse } from "./GlobalContext";

type ToggleConfigMethod = (entityId: string) => Promise<CrudGlobalResponse>;
type UserContextType = {
  getUsersData: () => Promise<void>;
  activeUser: UsersTable | null;
  isLoading: boolean;
  users: UsersTable[];
  createUser: CreateGlobalMethod<UsersTable>;
  updateUser: UpdateGlobalMethod<UsersTable>;
  deleteUser: ToggleConfigMethod;
  reactivateUser: ToggleConfigMethod;
};
type HeadersType = {
  usuarios: SheetCellValue[];
};
const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { createGlobalEntityCrud } = useGlobal();
  const SHEETS = useMemo(() => getCompleteSheetRange(SHEET_NAMES_USUARIOS), []);
  const { auth, email } = useAuth();
  const [users, setUsers] = useState<UsersTable[]>([]);
  //const [activeUser, setActiveUser] = useState<UsersTable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paramsFromSheets, setParamsFromSheets] = useState<{
    headers: HeadersType;
    values: Record<string, SheetCellValue[][]>;
  } | null>(null);

  const getUsersData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await getAllSheets(SHEET_ID_USUARIOS, SHEETS);
      if (error) {
        throw new Error(
          `Error al obtener los datos de la hoja de usuarios: ${error.message}`,
        );
      }
      if (!data || data.length === 0) {
        console.warn("No se encontraron datos en la hoja de usuarios.");
        setUsers([]);
        return;
      }
      setParamsFromSheets({
        headers: {
          usuarios: data[0]?.[0] || null,
        },
        values: {
          usuarios: data[0] || [],
        },
      });
      const normalizedUsers = getDataInJSONFormat<UsersTable>(data[0]);
      setUsers(normalizedUsers);
    } catch (error) {
      console.error("Error fetching user data:", error);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [SHEETS]);

  const activeUser = useMemo(() => {
    if (!email) return null;
    return users.find((item) => item.email === email) || null;
  }, [users, email]);

  useEffect(() => {
    if (auth) {
      void getUsersData();
    }
  }, [auth, getUsersData]);
 

  const {
    create: createUser,
    update: updateUser,
    remove: deleteUser,
    reactivate: reactivateUser,
  } = createGlobalEntityCrud<UsersTable>(
    "usuarios",
    "usuario",
    paramsFromSheets,
    SHEET_ID_USUARIOS,
    SHEET_NAMES_USUARIOS.usuarios,
    getUsersData,
    activeUser!!,
    "id"
  );

  return (
    <UserContext.Provider
      value={{ getUsersData, activeUser, isLoading, users, createUser, updateUser, deleteUser, reactivateUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
