import {
  createContext,
  useCallback,
  useContext,
  useState,
  useMemo,
  useRef,
} from "react";
import {
  getAllSheets,
  type SheetCellValue,
} from "~/backend/Database/apiGoogleSheets";
import { getDataInJSONFormat } from "~/backend/Database/helperTransformData";
import {
  getCompleteSheetRange,
  SHEET_ID_SUELDOS,
  SHEET_NAMES_SUELDOS,
} from "~/backend/Database/SheetsConfig";
import {
  useGlobal,
  type CreateGlobalMethod,
  type CrudGlobalResponse,
  type UpdateGlobalMethod,
} from "./GlobalContext";
import { useUser } from "~/context/UserContext";
import type {
  Employee,
  Premios,
  MvtoEmpleados,
  CtaCteEmpleados,
} from "~/types/rrhh";
import type { Fichada, Liquidacion } from "~/types/liquidaciones"
type RRHHContextType = {
  getSueldosData: () => Promise<void>;
  isReady: boolean;
  isLoading: boolean;
  /* Employees */
  employees: Employee[];
  createNewEmployee: CreateGlobalMethod<Employee>;
  updateEmployee: UpdateGlobalMethod<Employee>;
  removeEmployee: ToggleConfigMethod;
  reactivateEmployee: ToggleConfigMethod;
  isDNIRegistered: (dni: string | number) => boolean;
  /* Premios */
  premios: Premios[];
  createNewPremios: CreateGlobalMethod<Premios>;
  updatePremios: UpdateGlobalMethod<Premios>;
  removePremios: ToggleConfigMethod;
  reactivatePremios: ToggleConfigMethod;
  /* MvtoEmpleados */
  saldoEmpleados: CtaCteEmpleados[];
  createNewMvtoEmpleado: CreateGlobalMethod<MvtoEmpleados>;
  updateMvtoEmpleado: UpdateGlobalMethod<MvtoEmpleados>;
  removeMvtoEmpleado: ToggleConfigMethod;
  reactivateMvtoEmpleado: ToggleConfigMethod;
  /* Liquidaciones */
  liquidaciones: Liquidacion[]
  createNewLiquidacion: CreateGlobalMethod<Liquidacion>;
  updateLiquidacion: UpdateGlobalMethod<Liquidacion>;
  removeLiquidacion: ToggleConfigMethod;
  reactivateLiquidacion: ToggleConfigMethod;
  /* Fichadas */
  CUDFichadas: (fichadas: Fichada[], deletedIds: string[]) => Promise<CrudGlobalResponse>
  
};

type HeadersType = {
  nomina: SheetCellValue[];
  premios: SheetCellValue[];
  mvto_empleados: SheetCellValue[];
  liquidaciones: SheetCellValue[];
  fichadas: SheetCellValue[];
  //reportes: SheetCellValue[];
  //
};
type ParamsFromSheetsData = {
  headers: HeadersType;
  values: Record<string, SheetCellValue[][]>;
};
type ToggleConfigMethod = (entityId: string) => Promise<CrudGlobalResponse>;
const RRHHContext = createContext<RRHHContextType | undefined>(undefined);

export const RRHHProvider = ({ children }: { children: React.ReactNode }) => {
  const { activeUser } = useUser();
  const SHEETS = useMemo(() => getCompleteSheetRange(SHEET_NAMES_SUELDOS), []);
  const { createGlobalEntityCrud, cudGlobalFieldsArrayEntities } = useGlobal();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [premios, setPremios] = useState<Premios[]>([]);
  const [saldoEmpleados, setSaldoEmpleados] = useState<CtaCteEmpleados[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])

  const [paramsFromSheets, setParamsFromSheets] =
    useState<ParamsFromSheetsData | null>(null);
  const paramsFromSheetsRef = useRef<ParamsFromSheetsData | null>(null);
  const getSueldosData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getAllSheets(SHEET_ID_SUELDOS, SHEETS);
      if (error) {
        throw new Error(
          `Error al obtener los datos de la hoja sueldos: ${error.message}`,
        );
      }

      if (!data || data.length === 0) {
        console.warn("No se encontraron datos en la hoja nomina.");
        setEmployees([]);
        setPremios([]);
        setSaldoEmpleados([]);
        setIsReady(true);
        return;
      }
      const nextParams: ParamsFromSheetsData = {
        headers: {
          nomina: data[0]?.[0] || null,
          premios: data[1]?.[0] || null,
          mvto_empleados: data[2]?.[0] || null,
          liquidaciones: data[3]?.[0] || null,
          fichadas: data[4]?.[0] || null,
          //reportes: data[4]?.[0] || null,
          //
        },
        values: {
          nomina: data[0] || [],
          premios: data[1] || [],
          mvto_empleados: data[2] || [],
          liquidaciones: data[3] || [],
          fichadas: data[4] || [],
          //reportes: data[4] || [],
          //
        },
      };
      setParamsFromSheets(nextParams);
      paramsFromSheetsRef.current = nextParams;
      const employeesData = getDataInJSONFormat<Employee>(data[0]);
      const premiosData = getDataInJSONFormat<Premios>(data[1]);
      const mvtoEmpleadosData = getDataInJSONFormat<MvtoEmpleados>(data[2]);
      const liquidacionesData = getDataInJSONFormat<Liquidacion>(data[3]);
      const fichadasData = getDataInJSONFormat<Fichada>(data[4]);
      const ctasCorrientes = mvtoEmpleadosData.reduce(
        (acc, cta) => {
          const key = cta.empleado_id;
          if (!acc[key]) {
            acc[key] = { debe: 0, haber: 0, isClosed: false };
          }
          acc[key].debe += Number(cta.debe) || 0;
          acc[key].haber += Number(cta.haber) || 0;
          acc[key].isClosed = acc[key].debe - acc[key].haber === 0;
          return acc;
        },
        {} as Record<
          string,
          { debe: number; haber: number; isClosed: boolean }
        >,
      );
      let ctasCorrientesArray: CtaCteEmpleados[] = [];
      const ctasCorrientesData = Object.entries(ctasCorrientes);
      ctasCorrientesData.forEach(([empleado_id, saldo]) => {
        const empleado = employeesData.find((s) => s.id === empleado_id);
        if (!empleado) {
          console.warn(
            `No se encontró un empleado para el empleado_id: ${empleado_id}`,
          );
          return;
        }
        const movimientos = mvtoEmpleadosData.filter(
          (m) => m.empleado_id === empleado_id,
        );

        ctasCorrientesArray.push({
          empleado,
          debe: saldo.debe,
          haber: saldo.haber,
          isClosed: saldo.isClosed,
          movimientos,
          active: true,
        });
      });
      const combinedLiqData = liquidacionesData.map((liq)=> {
        const fichadas = fichadasData.filter((fich)=> fich.liquidacion_id=== liq.id)||[];
        return {
          ...liq,
          fichada: fichadas
        }
      })
      //const normalizedreportes = getDataInJSONFormat<Employee>(data[4]);
      //const normalizedLiquidaciones = getDataInJSONFormat<Employee>(data[5]);
      setEmployees(employeesData);
      setPremios(premiosData);
      setSaldoEmpleados(ctasCorrientesArray);
      setLiquidaciones(combinedLiqData)
      //setFichadas(fichadasData);
      setIsReady(true);
    } catch (error) {
      setIsReady(false);
      console.error("Error fetching user data:", error);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [SHEETS]);
  const {
    create: createNewEmployee,
    update: updateEmployee,
    remove: removeEmployee,
    reactivate: reactivateEmployee,
  } = createGlobalEntityCrud<Employee>(
    "nomina",
    "nomina",
    paramsFromSheets,
    SHEET_ID_SUELDOS,
    SHEET_NAMES_SUELDOS.nomina,
    getSueldosData,
    activeUser!!,
    "id",
  );
  const {
    create: createNewPremios,
    update: updatePremios,
    remove: removePremios,
    reactivate: reactivatePremios,
  } = createGlobalEntityCrud<Premios>(
    "premios",
    "premios",
    paramsFromSheets,
    SHEET_ID_SUELDOS,
    SHEET_NAMES_SUELDOS.premios,
    getSueldosData,
    activeUser!!,
    "id",
  );
  const {
    create: createNewMvtoEmpleado,
    update: updateMvtoEmpleado,
    remove: removeMvtoEmpleado,
    reactivate: reactivateMvtoEmpleado,
  } = createGlobalEntityCrud<MvtoEmpleados>(
    "mvto_empleados",
    "mvto_empleados",
    paramsFromSheets,
    SHEET_ID_SUELDOS,
    SHEET_NAMES_SUELDOS.mvto_empleados,
    getSueldosData,
    activeUser!!,
    "id",
  );
  const {
    create: createNewLiquidacion,
    update: updateLiquidacion,
    remove: removeLiquidacion,
    reactivate: reactivateLiquidacion,
  } = createGlobalEntityCrud<Liquidacion>(
    "liquidaciones",
    "liquidaciones",
    paramsFromSheets,
    SHEET_ID_SUELDOS,
    SHEET_NAMES_SUELDOS.liquidaciones,
    getSueldosData,
    activeUser!!,
    "id",
  );
  const CUDFichadas = useCallback(
    async (fichadas: Fichada[], deletedIds: string[]) => {
      const needsFreshRows =
        deletedIds.length > 0 || fichadas.some((fich) => Boolean(fich.id));
      if (needsFreshRows) {
        // Vuelve a leer el Sheet para ubicar las filas por id con datos
        // actuales (evita escribir fuera del grid si la hoja cambió externamente)
        paramsFromSheetsRef.current = null;
        await getSueldosData();
        if (!paramsFromSheetsRef.current) {
          return {
            success: false,
            message: "No se pudo actualizar las fichadas",
            error: "No se pudieron leer los datos actuales del Sheet",
          };
        }
      }
      return cudGlobalFieldsArrayEntities({
        entities: fichadas,
        deletedIds,
        sheetKey: "fichadas",
        entityLabel: "fichada",
        paramsFromSheets: paramsFromSheetsRef.current ?? paramsFromSheets,
        sheetId: SHEET_ID_SUELDOS,
        sheetName: SHEET_NAMES_SUELDOS.fichadas,
        successMessage: "Fichadas actualizados exitosamente",
        onGetData: getSueldosData,
        activeUser: activeUser!!,
        nameColId: "id",
      });
    },
    [cudGlobalFieldsArrayEntities, getSueldosData, paramsFromSheets],
  );
  const isDNIRegistered = useCallback(
    (dni: string | number) => {
      return employees.some((employee) => employee.dni === dni);
    },
    [employees],
  );
  return (
    <RRHHContext.Provider
      value={{
        getSueldosData,
        isReady,
        isLoading,
        employees,
        createNewEmployee,
        updateEmployee,
        removeEmployee,
        reactivateEmployee,
        isDNIRegistered,
        premios,
        createNewPremios,
        updatePremios,
        removePremios,
        reactivatePremios,
        saldoEmpleados,
        createNewMvtoEmpleado,
        updateMvtoEmpleado,
        removeMvtoEmpleado,
        reactivateMvtoEmpleado,
        liquidaciones,
        createNewLiquidacion,
        updateLiquidacion,
        removeLiquidacion,
        reactivateLiquidacion,
        CUDFichadas
      }}
    >
      {children}
    </RRHHContext.Provider>
  );
};
export const useRRHH = () => {
  const context = useContext(RRHHContext);
  if (context === undefined) {
    throw new Error("useRRHH must be used within a RRHHProvider");
  }
  return context;
};
