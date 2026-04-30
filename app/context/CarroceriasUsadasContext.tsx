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
  createCarroceriaUsadaBase: CreateGlobalMethod<CarroceriaUsadaData>;
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
          //ordenear por fecha de creación desc
          const numA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const numB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return numB - numA;
        }),
      );
    } catch (error) {
      console.error("Error fetching orders data:", error);
      return;
    }
  }, [socios]);
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
  );
  const { create: createPrestamoBase, update: updatePrestamoBase } =
    createGlobalEntityCrud<PrestamoCarroceria>(
      "prestamo",
      "Prestamo",
      paramsFromSheets,
      SHEET_ID_INVENTARIO,
      SHEET_NAMES_INVENTARIO.prestamo,
      getCarroceriasUsadasData,
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
        createCarroceriaUsadaBase,
        updateCarroceriaUsadaBase,
        changeStatusCarroceriaUsada,
        CUDFotos,
        createPrestamoBase,
        updatePrestamoBase,
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
