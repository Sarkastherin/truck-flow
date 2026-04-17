import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  getAllSheets,
  type SheetCellValue,
} from "~/backend/Database/apiGoogleSheets";
import { getDataInJSONFormat } from "~/backend/Database/helperTransformData";
import { useAuth } from "~/context/AuthContext";
import type { Provincia, SocioComercial, Localidades } from "~/types/socios";
import { useUser } from "./UserContext";
import {
  getCompleteSheetRange,
  SHEET_ID_SOCIOS,
  SHEET_NAMES_SOCIOS,
} from "~/backend/Database/SheetsConfig";
import { type DirtyMap } from "~/utils/prepareUpdatePayload";
import { useGlobal, type CreateGlobalMethod } from "./GlobalContext";
type SociosContextType = {
  getSociosData: () => Promise<void>;
  socios: SocioComercial[];
  isReady: boolean;
  isLoading: boolean;
  provincias: Provincia[] | null;
  localidades: Localidades[] | null;
  createNewSocio: CreateGlobalMethod<SocioComercial>;
  updateSocio: UpdateConfigMethod<SocioComercial>;
  removeSocio: ToggleConfigMethod;
  reactivateSocio: ToggleConfigMethod;
  isCUITRegistered: (cuit: string, tipoSocio: string) => boolean;
};

type HeadersType = {
  socios_comerciales: SheetCellValue[];
};
type BaseConfigEntity = {
  id: string;
  active: boolean;
};
type CrudResponse = {
  success: boolean;
  message: string;
  error: string | null;
};
type UpdateConfigMethod<T extends BaseConfigEntity> = (
  existingEntity: T,
  dirtyFields: DirtyMap<T>,
) => Promise<CrudResponse>;
type ToggleConfigMethod = (entityId: string) => Promise<CrudResponse>;
const SociosContext = createContext<SociosContextType | undefined>(undefined);

export const SociosProvider = ({ children }: { children: React.ReactNode }) => {
  const SHEETS = useMemo(() => getCompleteSheetRange(SHEET_NAMES_SOCIOS), []);
  const { auth } = useAuth();
  const { activeUser } = useUser();
  const { createGlobalEntityCrud } = useGlobal();
  const [socios, setSocios] = useState<SocioComercial[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [provincias, setProvincias] = useState<Provincia[] | null>(null);
  const [localidades, setLocalidades] = useState<Localidades[] | null>(null);
  const [paramsFromSheets, setParamsFromSheets] = useState<{
    headers: HeadersType;
    values: Record<string, SheetCellValue[][]>;
  } | null>(null);
  const getSociosData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getAllSheets(SHEET_ID_SOCIOS, SHEETS);
      if (error) {
        throw new Error(
          `Error al obtener los datos de la hoja de usuarios: ${error.message}`,
        );
      }
      if (!data || data.length === 0) {
        console.warn("No se encontraron datos en la hoja de usuarios.");
        setSocios([]);
        setIsReady(true);
        return;
      }
      setParamsFromSheets({
        headers: {
          socios_comerciales: data[0]?.[0] || null,
        },
        values: {
          socios_comerciales: data[0] || [],
        },
      });
      const normalizedSocios = getDataInJSONFormat<SocioComercial>(data[0]);
      setSocios(normalizedSocios);
      setIsReady(true);
    } catch (error) {
      setIsReady(false);
      console.error("Error fetching user data:", error);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [SHEETS]);
  const fetchProvincias = useCallback(async () => {
    try {
      const data = await fetch("/provincias.json")
        .then((res) => res.json())
        .then((data) => {
          return data.provincias;
        });
      setProvincias(data);
    } catch (error) {
      console.error("Error fetching provincias:", error);
    }
  }, []);
  const fetchLocalidades = useCallback(async () => {
    try {
      const data = await fetch(`/localidades.json`)
        .then((res) => res.json())
        .then((data) => {
          return data.localidades;
        });
      setLocalidades(data);
    } catch (error) {
      console.error("Error fetching localidades:", error);
    }
  }, []);
  const {
    create: createNewSocio,
    update: updateSocio,
    remove: removeSocio,
    reactivate: reactivateSocio,
  } = createGlobalEntityCrud<SocioComercial>(
    "socios_comerciales",
    "socio comercial",
    paramsFromSheets,
    SHEET_ID_SOCIOS,
    SHEET_NAMES_SOCIOS.socios_comerciales,
    getSociosData,
  );
  const isCUITRegistered = useCallback(
    (cuit: string, tipoSocio: string) => {
      return socios.some(
        (socio) => socio.cuit_cuil === cuit && socio.tipo === tipoSocio,
      );
    },
    [socios],
  );
  useEffect(() => {
    if (auth) {
      void getSociosData();
      void fetchProvincias();
      void fetchLocalidades();
      return;
    }
    setSocios([]);
    setIsReady(false);
    setIsLoading(false);
  }, [auth, fetchLocalidades, fetchProvincias, getSociosData]);
  return (
    <SociosContext.Provider
      value={{
        getSociosData,
        socios,
        isReady,
        isLoading,
        provincias,
        localidades,
        createNewSocio,
        updateSocio,
        removeSocio,
        reactivateSocio,
        isCUITRegistered,
      }}
    >
      {children}
    </SociosContext.Provider>
  );
};
export const useSociosComercial = () => {
  const context = useContext(SociosContext);
  if (context === undefined) {
    throw new Error("useSociosComercial must be used within a SociosProvider");
  }
  return context;
};
