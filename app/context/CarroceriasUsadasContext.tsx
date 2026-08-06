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
import type { PedidoFormValues } from "~/types/pedido";
import type { DirtyMap } from "~/utils/prepareUpdatePayload";
import { useSociosComercial } from "./SociosComercialesContext";
import { useUser } from "./UserContext";
import {
  SHEET_ID_INVENTARIO,
  SHEET_NAMES_INVENTARIO,
  getCompleteSheetRange,
} from "~/backend/Database/SheetsConfig";
import {
  useGlobal,
  type CreateGlobalMethod,
  type CrudGlobalResponse,
  type UpdateGlobalMethod,
} from "./GlobalContext";
import type {
  CarroceriaUsadaData,
  Fotos,
  PrestamoCarroceria,
} from "~/types/carroceria-usada";
import { useAuth } from "./AuthContext";
type CarroceriasUsadasDirtyFields = DirtyMap<PedidoFormValues>;

type Response = {
  error: string | null;
  success: boolean;
  message: string | null;
};

type CarroceriasUsadasContextType = {
  getCarroceriasUsadasData: () => Promise<void>;
  carroceriasUsadas: CarroceriaUsadaData[] | null;
  createNewCarroceriaUsada: (newCarroceria: CarroceriaUsadaData) => Promise<CrudGlobalResponse & { data: CarroceriaUsadaData | null }>;
  updateCarroceriaUsadaBase: UpdateGlobalMethod<CarroceriaUsadaData>;
  changeStatusCarroceriaUsada: (
    idCarroceriaUsada: string,
    newStatus: string,
  ) => Promise<Response>;
  CUDFotos: (
    fotos: Fotos[],
    deletedIds: string[],
  ) => Promise<CrudGlobalResponse>;
  createPrestamoBase: CreateGlobalMethod<PrestamoCarroceria>;
  updatePrestamoBase: UpdateGlobalMethod<PrestamoCarroceria>;
};
type HeadersType = {
  inventario: SheetCellValue[] | null;
  fotos: SheetCellValue[] | null;
  prestamo: SheetCellValue[] | null;
};
const CarroceriasUsadasContext = createContext<
  CarroceriasUsadasContextType | undefined
>(undefined);
export const CarroceriasUsadasProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { auth } = useAuth();
  const {
    uploadFiles,
    createGlobalEntityCrud,
    cudGlobalFieldsArrayEntities,
    assertReady,
  } = useGlobal();
  const SHEETS = useMemo(
    () => getCompleteSheetRange(SHEET_NAMES_INVENTARIO),
    [],
  );
  const { socios } = useSociosComercial();
  const { activeUser } = useUser();
  const [carroceriasUsadas, setCarroceriasUsadas] = useState<
    CarroceriaUsadaData[] | null
  >(null);
  const [paramsFromSheets, setParamsFromSheets] = useState<{
    headers: HeadersType;
    values: Record<string, SheetCellValue[][]>;
  } | null>(null);
  const getCarroceriasUsadasData = useCallback(async () => {
    try {
      if (!socios || socios.length === 0) return;
      const { data, error } = await getAllSheets(SHEET_ID_INVENTARIO, SHEETS);
      if (error) {
        throw new Error(
          `Error al obtener los datos de la hoja de inventario: ${error.message}`,
        );
      }
      if (!data || data.length === 0) {
        console.warn("No se encontraron datos en la hoja de inventario.");
        return;
      }
      setParamsFromSheets({
        headers: {
          inventario: data[0]?.[0] || null,
          fotos: data[1]?.[0] || null,
          prestamo: data[2]?.[0] || null,
        },
        values: {
          inventario: data[0] || [],
          fotos: data[1] || [],
          prestamo: data[2] || [],
        },
      });

      const inventarioData = getDataInJSONFormat(data[0]);
      const fotosData = getDataInJSONFormat(data[1]);
      const prestamoData = getDataInJSONFormat(data[2]);

      const combinedData = inventarioData.map((carroceria) => {
        const cliente =
          socios.find((socio) => socio.id === carroceria.duenno_id) || null;
        const fotos = fotosData.filter(
          (foto) => foto.carroceria_usada_id === carroceria.id,
        );
        const prestamo = prestamoData.find(
          (prestamo) => prestamo.carroceria_usada_id === carroceria.id,
        );
        return {
          ...carroceria,
          duenno: cliente,
          fotos,
          prestamo,
        } as CarroceriaUsadaData;
      });
      setCarroceriasUsadas(
        combinedData.sort((a, b) => {
          //ordenear por número de carrocería desc
          const numA = parseInt(a.numero_carroceria.slice(4));
          const numB = parseInt(b.numero_carroceria.slice(4));
          return numB - numA;
        }),
      );
    } catch (error) {
      console.error("Error fetching orders data:", error);
      return;
    }
  }, [socios]);
  const generateCarroceriaNumber = () => {
    if (!carroceriasUsadas) {
      return;
    }
    if (carroceriasUsadas.length === 0) {
      return "USA-0001";
    }
    try {
      const lastCarroceria = carroceriasUsadas.reduce((prev, current) => {
        const prevNum = parseInt(prev.numero_carroceria.slice(4));
        const currentNum = parseInt(current.numero_carroceria.slice(4));
        return currentNum > prevNum ? current : prev;
      });
      if (!lastCarroceria) {
        throw new Error(
          "No se pudo determinar el último número de carrocería. ",
        );
      }
      if(!lastCarroceria.numero_carroceria) {
        return "USA-0001";
      }
      const lastCarroceriaNumber = parseInt(
        lastCarroceria.numero_carroceria.slice(4),
      );
      const newCarroceriaNumber = lastCarroceriaNumber + 1;
      return `USA-${String(newCarroceriaNumber).padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating new carroceria number:", error);
      return;
    }
  };
  
  const {
    create: createCarroceriaUsadaBase,
    update: updateCarroceriaUsadaBase,
  } = createGlobalEntityCrud<CarroceriaUsadaData>(
    "inventario",
    "Carroceria Usada",
    paramsFromSheets,
    SHEET_ID_INVENTARIO,
    SHEET_NAMES_INVENTARIO.inventario,
    getCarroceriasUsadasData,
    activeUser!!,
    "id"
  );
  const createNewCarroceriaUsada = useCallback(
    async (newCarroceria: CarroceriaUsadaData) => {
      try {
        const numeroCarroceria = generateCarroceriaNumber();
        if (!numeroCarroceria) {
          throw new Error("No se pudo generar el número de carrocería.");
        }
        const payload = {
          ...newCarroceria,
          numero_carroceria: numeroCarroceria,
        };
        const {data, error} = await createCarroceriaUsadaBase(payload);
        if (error || !data) {
          throw new Error(`Error al crear la nueva carrocería usada: ${error}`);
        }
        return {
          success: true,
          message: "Carrocería usada creada exitosamente",
          error: null,
          data,
        };
      } catch (error) {
        console.error("Error al crear la nueva carrocería usada:", error);
        return {
          success: false,
          message: "Error al crear la nueva carrocería usada",
          error: error instanceof Error ? error.message : String(error),
          data: null,
        };
      }
    },
    [paramsFromSheets, activeUser, getCarroceriasUsadasData, createCarroceriaUsadaBase, carroceriasUsadas],
  );
  const { create: createPrestamoBase, update: updatePrestamoBase } =
    createGlobalEntityCrud<PrestamoCarroceria>(
      "prestamo",
      "Prestamo",
      paramsFromSheets,
      SHEET_ID_INVENTARIO,
      SHEET_NAMES_INVENTARIO.prestamo,
      getCarroceriasUsadasData,
      activeUser!!,
      "id"
    );
  const CUDFotos = useCallback(
    async (fotos: Fotos[], deletedIds: string[]) => {
      return cudGlobalFieldsArrayEntities({
        entities: fotos,
        deletedIds,
        sheetKey: "fotos",
        entityLabel: "Foto",
        paramsFromSheets,
        sheetId: SHEET_ID_INVENTARIO,
        sheetName: SHEET_NAMES_INVENTARIO.fotos,
        successMessage: "Fotos actualizadas correctamente",
        onGetData: getCarroceriasUsadasData,
        activeUser: activeUser!!,
        nameColId: "id"
      });
    },
    [paramsFromSheets, getCarroceriasUsadasData],
  );
  const changeStatusCarroceriaUsada = useCallback(
    async (idCarroceriaUsada: string, newStatus: string) => {
      try {
        const { error } = await updateCarroceriaUsadaBase(
          { id: idCarroceriaUsada, status: newStatus } as CarroceriaUsadaData,
          { status: true },
        );

        if (error) {
          throw new Error(`Error al actualizar el status del pedido: ${error}`);
        }
        return {
          success: true,
          message: "Status del pedido actualizado exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al actualizar el status del pedido:", error);
        return {
          success: false,
          message: "Error al actualizar el status del pedido",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [paramsFromSheets, activeUser],
  );
  useEffect(() => {
    if (auth) void getCarroceriasUsadasData();
  }, [auth, getCarroceriasUsadasData]);
  return (
    <CarroceriasUsadasContext.Provider
      value={{
        getCarroceriasUsadasData,
        carroceriasUsadas,
        updateCarroceriaUsadaBase,
        changeStatusCarroceriaUsada,
        CUDFotos,
        createPrestamoBase,
        updatePrestamoBase,
        createNewCarroceriaUsada
      }}
    >
      {children}
    </CarroceriasUsadasContext.Provider>
  );
};
export const useCarroceriasUsadas = () => {
  const context = useContext(CarroceriasUsadasContext);
  if (context === undefined) {
    throw new Error(
      "useCarroceriasUsadas must be used within a CarroceriasUsadasProvider",
    );
  }
  return context;
};
