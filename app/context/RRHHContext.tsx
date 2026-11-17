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
  MvtoEmpleadosPayload,
  CtaCteEmpleados,
} from "~/types/rrhh";
import type { Fichada, Liquidacion, Reporte, LiquidacionHistorial, LiquidacionHistorialInput } from "~/types/liquidaciones";
import { HORAS_SEMANALES_DEFAULT } from "~/utils/liquidacionCalculos";
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
  CUDMvtoEmpleados: (
    movimientos: MvtoEmpleadosPayload[],
    deletedIds: string[],
  ) => Promise<CrudGlobalResponse>;
  /* Liquidaciones */
  liquidaciones: Liquidacion[];
  createNewLiquidacion: CreateGlobalMethod<Liquidacion>;
  updateLiquidacion: UpdateGlobalMethod<Liquidacion>;
  removeLiquidacion: ToggleConfigMethod;
  reactivateLiquidacion: ToggleConfigMethod;
  /* Fichadas */
  CUDFichadas: (
    fichadas: Fichada[],
    deletedIds: string[],
  ) => Promise<CrudGlobalResponse>;
  /* Reportes */
  CUDReportes: (
    reportes: Reporte[],
    deletedIds: string[],
  ) => Promise<CrudGlobalResponse>;
  /* Historial */
  historial: LiquidacionHistorial[];
  CUDHistorial: (
    rows: LiquidacionHistorialInput[],
    liquidacionId: string,
  ) => Promise<CrudGlobalResponse>;
  removeHistorialByLiquidacion: (
    liquidacionId: string,
  ) => Promise<CrudGlobalResponse>;
};

type HeadersType = {
  nomina: SheetCellValue[];
  premios: SheetCellValue[];
  mvto_empleados: SheetCellValue[];
  liquidaciones: SheetCellValue[];
  fichadas: SheetCellValue[];
  reportes: SheetCellValue[];
  historial:SheetCellValue[];
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
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [historial, setHistorial] = useState<LiquidacionHistorial[]>([])
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
          reportes: data[5]?.[0] || null,
          historial: data[6]?.[0]||null
          //
        },
        values: {
          nomina: data[0] || [],
          premios: data[1] || [],
          mvto_empleados: data[2] || [],
          liquidaciones: data[3] || [],
          fichadas: data[4] || [],
          reportes: data[5] || [],
          historial: data[6] || []
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
      const reportesData = getDataInJSONFormat<Reporte>(data[5]);
      const historialData = getDataInJSONFormat<LiquidacionHistorial>(data[6]);
      const employeesWithHoraTrabajo = employeesData.map((emp) => {
        const valorHoraRegular = emp.valor_salario_semanal
          ? emp.valor_salario_semanal / HORAS_SEMANALES_DEFAULT
          : 0;
        return { ...emp, valor_hora_regular: valorHoraRegular };
      });
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
      const combinedData = liquidacionesData.map((liq) => {
        const fichadas =
          fichadasData.filter((fich) => fich.liquidacion_id === liq.id) || [];
        const reportes = reportesData.filter(
          (rep) => rep.liquidacion_id === liq.id,
        );
        return {
          ...liq,
          fichada: fichadas,
          reporte: reportes,
        };
      });
      setEmployees(employeesWithHoraTrabajo);
      setPremios(premiosData);
      setSaldoEmpleados(ctasCorrientesArray);
      setLiquidaciones(combinedData);
      setHistorial(historialData)
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
  const CUDSueldosEntities = useCallback(
    async <T extends { id?: string }>(
      entities: T[],
      deletedIds: string[],
      sheetKey: "fichadas" | "reportes" | "mvto_empleados" | "historial",
      entityLabel: string,
      successMessage: string,
    ) => {
      const needsFreshRows =
        deletedIds.length > 0 || entities.some((ent) => Boolean(ent.id));
      if (needsFreshRows) {
        // Vuelve a leer el Sheet para ubicar las filas por id con datos
        // actuales (evita escribir fuera del grid si la hoja cambió externamente)
        paramsFromSheetsRef.current = null;
        await getSueldosData();
        if (!paramsFromSheetsRef.current) {
          return {
            success: false,
            message: `No se pudo actualizar ${entityLabel}`,
            error: "No se pudieron leer los datos actuales del Sheet",
          };
        }
      }
      return cudGlobalFieldsArrayEntities({
        entities,
        deletedIds,
        sheetKey,
        entityLabel,
        paramsFromSheets: paramsFromSheetsRef.current ?? paramsFromSheets,
        sheetId: SHEET_ID_SUELDOS,
        sheetName: SHEET_NAMES_SUELDOS[sheetKey],
        successMessage,
        onGetData: getSueldosData,
        activeUser: activeUser!!,
        nameColId: "id",
      });
    },
    [cudGlobalFieldsArrayEntities, getSueldosData, paramsFromSheets],
  );
  const CUDFichadas = useCallback(
    (fichadas: Fichada[], deletedIds: string[]) =>
      CUDSueldosEntities(
        fichadas,
        deletedIds,
        "fichadas",
        "fichada",
        "Fichadas actualizados exitosamente",
      ),
    [CUDSueldosEntities],
  );
  const CUDReportes = useCallback(
    (reportes: Reporte[], deletedIds: string[]) =>
      CUDSueldosEntities(
        reportes,
        deletedIds,
        "reportes",
        "reporte",
        "Reportes actualizados exitosamente",
      ),
    [CUDSueldosEntities],
  );
  const CUDMvtoEmpleados = useCallback(
    (movimientos: MvtoEmpleadosPayload[], deletedIds: string[]) =>
      CUDSueldosEntities(
        movimientos,
        deletedIds,
        "mvto_empleados",
        "movimiento de empleado",
        "Movimientos guardados exitosamente",
      ),
    [CUDSueldosEntities],
  );
  const CUDHistorial = useCallback(
    async (
      rows: LiquidacionHistorialInput[],
      liquidacionId: string,
    ): Promise<CrudGlobalResponse> => {
      // Refresca para leer el estado actual de la hoja historial
      // (guard anti-duplicado: si la liquidación ya fue archivada, no reescribe)
      paramsFromSheetsRef.current = null;
      await getSueldosData();
      const params = paramsFromSheetsRef.current as ParamsFromSheetsData | null;
      if (!params) {
        return {
          success: false,
          message: "No se pudo guardar el historial",
          error: "No se pudieron leer los datos actuales del Sheet",
        };
      }
      const headersHistorial = params.headers.historial ?? [];
      const colLiq = headersHistorial.findIndex(
        (h) => String(h).trim().toLowerCase() === "liquidacion_id",
      );
      if (colLiq === -1) {
        return {
          success: false,
          message: "No se pudo guardar el historial",
          error: "La hoja historial no tiene la columna liquidacion_id",
        };
      }
      const yaExiste = (params.values.historial ?? [])
        .slice(1)
        .some((row) => row[colLiq] === liquidacionId);
      if (yaExiste) {
        return {
          success: true,
          message: "El historial de la liquidación ya estaba guardado",
          error: null,
        };
      }
      return CUDSueldosEntities(
        rows,
        [],
        "historial",
        "registro de historial",
        "Historial guardado exitosamente",
      );
    },
    [CUDSueldosEntities, getSueldosData],
  );
  const removeHistorialByLiquidacion = useCallback(
    async (liquidacionId: string): Promise<CrudGlobalResponse> => {
      // Refresca para leer el estado actual de la hoja historial
      paramsFromSheetsRef.current = null;
      await getSueldosData();
      const params = paramsFromSheetsRef.current as ParamsFromSheetsData | null;
      if (!params) {
        return {
          success: false,
          message: "No se pudo eliminar el historial",
          error: "No se pudieron leer los datos actuales del Sheet",
        };
      }
      const headersHistorial = params.headers.historial ?? [];
      const colId = headersHistorial.findIndex(
        (h) => String(h).trim().toLowerCase() === "id",
      );
      const colLiq = headersHistorial.findIndex(
        (h) => String(h).trim().toLowerCase() === "liquidacion_id",
      );
      if (colId === -1 || colLiq === -1) {
        return {
          success: false,
          message: "No se pudo eliminar el historial",
          error:
            "La hoja historial no tiene las columnas id / liquidacion_id",
        };
      }
      const idsToDelete = (params.values.historial ?? [])
        .slice(1)
        .filter(
          (row) =>
            row[colLiq] === liquidacionId &&
            row[colId] !== undefined &&
            row[colId] !== null &&
            row[colId] !== "",
        )
        .map((row) => String(row[colId]));
      if (idsToDelete.length === 0) {
        return {
          success: true,
          message: "No había registros de historial para eliminar",
          error: null,
        };
      }
      return CUDSueldosEntities(
        [],
        idsToDelete,
        "historial",
        "registro de historial",
        "Historial eliminado exitosamente",
      );
    },
    [CUDSueldosEntities, getSueldosData],
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
        CUDMvtoEmpleados,
        liquidaciones,
        createNewLiquidacion,
        updateLiquidacion,
        removeLiquidacion,
        reactivateLiquidacion,
        CUDFichadas,
        CUDReportes,
        historial,
        CUDHistorial,
        removeHistorialByLiquidacion,
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
