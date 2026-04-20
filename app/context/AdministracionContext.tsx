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
import {
  getCompleteSheetRange,
  SHEET_ID_CTAS_CORRIENTES,
  SHEET_NAMES_CTAS_CORRIENTES,
} from "~/backend/Database/SheetsConfig";
import { type DirtyMap } from "~/utils/prepareUpdatePayload";
import {
  useGlobal,
  type CreateGlobalMethod,
  type CreateGlobalResponse,
} from "./GlobalContext";
import type {
  Movimientos,
  Cheque,
  ChequeConSociosYMovimiento,
  Documento,
  CtaCte,
  MovimientoDetalle,
  MovimientoFormValues,
  DocumentoFormValues,
} from "~/types/cuentas-corrientes";
import { useSociosComercial } from "./SociosComercialesContext";
import { useUser } from "./UserContext";
import { createFolderIfNotExists } from "~/backend/Database/apiDrive";
import type { FileTypeActions } from "~/components/FileInputComponent";
import { deleteFileFromDrive } from "~/backend/Database/apiDrive";

type CrudResponse = {
  success: boolean;
  message: string;
  error: string | null;
};

export type BancosProps = {
  value: string;
  label: string;
};

type AdministracionContextType = {
  getAdministracionData: () => Promise<void>;
  ctasCorrientesData: CtaCte[];
  cheques: ChequeConSociosYMovimiento[];
  getBancos: () => Promise<BancosProps[] | null>;
  bancos: BancosProps[] | null;
  createMovimiento: (
    dataForm: MovimientoDetalle,
    files: FileList | null,
  ) => Promise<CreateGlobalResponse<Movimientos>>;
  updateMovimientoAndDocumentos: (
    dataForm: MovimientoDetalle,
    dirtyFields: DirtyMap<MovimientoFormValues>,
    files: FileTypeActions<Documento>,
  ) => Promise<CrudResponse>;
  updateCheque: (
    cheque: Cheque,
    dirtyFields: DirtyMap<Cheque>,
  ) => Promise<CrudResponse>;
  createNewMovimiento: CreateGlobalMethod<MovimientoDetalle>;
  isCHEQUERegistered: (numeroCheque: number, cliente_id: string) => boolean;
};
type HeadersType = {
  movimientos: SheetCellValue[] | null;
  cheques: SheetCellValue[] | null;
  documentos: SheetCellValue[] | null;
};
const AdministracionContext = createContext<
  AdministracionContextType | undefined
>(undefined);
export const AdministracionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { createGlobalEntityCrud, cudGlobalFieldsArrayEntities, uploadFiles } =
    useGlobal();
  const SHEETS = useMemo(
    () => getCompleteSheetRange(SHEET_NAMES_CTAS_CORRIENTES),
    [],
  );
  const { socios } = useSociosComercial();
  const { activeUser } = useUser();

  const { auth } = useAuth();
  const [ctasCorrientesData, setCtasCorrientesData] = useState<CtaCte[]>([]);
  const [bancos, setBancos] = useState<BancosProps[] | null>(null);
  const [cheques, setCheques] = useState<ChequeConSociosYMovimiento[]>([]);
  const [paramsFromSheets, setParamsFromSheets] = useState<{
    headers: HeadersType;
    values: Record<string, SheetCellValue[][]>;
  } | null>(null);
  const getAdministracionData = useCallback(async () => {
    if (!socios || socios.length === 0) return;
    try {
      const { data, error } = await getAllSheets(
        SHEET_ID_CTAS_CORRIENTES,
        SHEETS,
      );
      if (error) {
        throw new Error(
          `Error al obtener los datos de la hoja de cuentas corrientes: ${error.message}`,
        );
      }
      if (!data || data.length === 0) {
        console.warn(
          "No se encontraron datos en la hoja de cuentas corrientes.",
        );
        return;
      }
      setParamsFromSheets({
        headers: {
          movimientos: data[0]?.[0] || null,
          cheques: data[1]?.[0] || null,
          documentos: data[2]?.[0] || null,
        },
        values: {
          movimientos: data[0] || [],
          cheques: data[1] || [],
          documentos: data[2] || [],
        },
      });

      const movimientosData: Movimientos[] = getDataInJSONFormat(data[0]);
      const chequesData: Cheque[] = getDataInJSONFormat(data[1]);
      const documentosData: Documento[] = getDataInJSONFormat(data[2]);

      const ctasCorrientes = movimientosData.reduce(
        (acc, cta) => {
          const key = cta.cliente_id;
          if (!acc[key]) {
            acc[key] = { debe: 0, haber: 0, isClosed: false };
          }
          acc[key].debe += Number(cta.debe) || 0;
          acc[key].haber += Number(cta.haber) || 0;
          acc[key].isClosed = acc[key].debe - acc[key].haber === 0;
          return acc;
        },
        {} as Record<string, { debe: number; haber: number; isClosed: boolean }>,
      );
      let ctasCorrientesArray: CtaCte[] = [];
      const ctasCorrientesData = Object.entries(ctasCorrientes);
      ctasCorrientesData.forEach(([cliente_id, saldo]) => {
        const cliente = socios.find((s) => s.id === cliente_id);
        if (!cliente) {
          console.warn(
            `No se encontró un socio comercial para el cliente_id: ${cliente_id}`,
          );
          return;
        }
        const movimientos = movimientosData.filter(
          (m) => m.cliente_id === cliente_id,
        );
        const movimientosConChequesYDocumentos: (Movimientos & {
          cheques: Cheque[];
          documentos: Documento[];
        })[] = movimientos.map((mov) => {
          const cheques = chequesData.filter((c) => c.movimiento_id === mov.id);
          const documentos = documentosData.filter(
            (d) => d.movimiento_id === mov.id,
          );
          return {
            ...mov,
            cheques,
            documentos,
          };
        });

        ctasCorrientesArray.push({
          cliente,
          debe: saldo.debe,
          haber: saldo.haber,
          isClosed: saldo.isClosed,
          movimientos: movimientosConChequesYDocumentos,
        });
      });
      const chequesConSociosYMovimiento = chequesData.map((cheque) => {
        const movimiento = movimientosData.find(
          (mov) => mov.id === cheque.movimiento_id,
        );
        if (!movimiento) {
          console.warn(
            `No se encontró un movimiento para el movimiento_id: ${cheque.movimiento_id} del cheque con id: ${cheque.id}`,
          );
          return;
        }
        const cliente = socios.find((s) => s.id === movimiento?.cliente_id);
        if (!cliente) {
          console.warn(
            `No se encontró un socio comercial para el cliente_id: ${movimiento?.cliente_id} del cheque con id: ${cheque.id}`,
          );
          return;
        }
        const proveedor = socios.find((s) => s.id === cheque.proveedor_id);
        return {
          ...cheque,
          movimiento,
          cliente,
          proveedor,
        };
      });
      if (chequesConSociosYMovimiento) {
        setCheques(chequesConSociosYMovimiento as ChequeConSociosYMovimiento[]);
      }

      setCtasCorrientesData(ctasCorrientesArray);
    } catch (error) {
      console.error("Error fetching orders data:", error);
      return;
    }
  }, [socios]);
  const fetchBancos = async () => {
    try {
      const data = await fetch("/bancos.json").then((res) => res.json());
      return data;
    } catch (error) {
      console.error("Error fetching bancos:", error);
      return [];
    }
  };
  const getBancos = useCallback(async () => {
    if (!bancos) {
      const data = await fetchBancos();
      setBancos(data);
      return data;
    }
    return bancos;
  }, [bancos]);
  useEffect(() => {
    if (auth && socios.length > 0 && activeUser) {
      void getAdministracionData();
      void getBancos();
    }
  }, [auth, getAdministracionData, getBancos, socios, activeUser]);
  const { create: createNewMovimiento, update: updateMovimiento } =
    createGlobalEntityCrud<Movimientos>(
      "movimientos",
      "movimiento",
      paramsFromSheets,
      SHEET_ID_CTAS_CORRIENTES,
      SHEET_NAMES_CTAS_CORRIENTES.movimientos,
      getAdministracionData,
    );
  const {
    create: createNewCheque,
    update: updateCheque,
    remove: deleteCheque,
    reactivate: reactivateCheque,
  } = createGlobalEntityCrud<Cheque>(
    "cheques",
    "cheque",
    paramsFromSheets,
    SHEET_ID_CTAS_CORRIENTES,
    SHEET_NAMES_CTAS_CORRIENTES.cheques,
    getAdministracionData,
  );

  const CUDCheques = useCallback(
    async (cheques: Cheque[], deletedIds: string[]) => {
      return cudGlobalFieldsArrayEntities({
        entities: cheques,
        deletedIds,
        sheetKey: "cheques",
        entityLabel: "cheque",
        paramsFromSheets,
        sheetId: SHEET_ID_CTAS_CORRIENTES,
        sheetName: SHEET_NAMES_CTAS_CORRIENTES.cheques,
        successMessage: "Cheques actualizados exitosamente",
        onGetData: getAdministracionData,
      });
    },
    [cudGlobalFieldsArrayEntities, getAdministracionData, paramsFromSheets],
  );
  const CUDDocumentos = useCallback(
    async (documentos: Documento[], deletedIds: string[]) => {
      return cudGlobalFieldsArrayEntities({
        entities: documentos,
        deletedIds,
        sheetKey: "documentos",
        entityLabel: "documento",
        paramsFromSheets,
        sheetId: SHEET_ID_CTAS_CORRIENTES,
        sheetName: SHEET_NAMES_CTAS_CORRIENTES.documentos,
        successMessage: "Documentos actualizados exitosamente",
        onGetData: getAdministracionData,
      });
    },
    [cudGlobalFieldsArrayEntities, getAdministracionData, paramsFromSheets],
  );
  const createMovimiento = useCallback(
    async (dataForm: MovimientoDetalle, files: FileList | null) => {
      try {
        const { cheques, documentos, ...movimientoData } = dataForm;
        // 1. guardar movimiento sin cheques ni documentos para obtener el ID
        const { data, error } = await createNewMovimiento(movimientoData);
        if (error || !data) {
          throw new Error(error || "Error desconocido al crear el movimiento");
        }
        const movimientoId = data?.id;
        if (!movimientoId) {
          throw new Error("No se obtuvo el ID del movimiento creado");
        }
        if (cheques && cheques.length > 0) {
          const chequesConMovimientoId = cheques.map((cheque) => ({
            ...cheque,
            movimiento_id: movimientoId,
          }));
          await CUDCheques(chequesConMovimientoId, []);
        }
        if (files && files.length > 0) {
          let filesAdd: DocumentoFormValues[] = [];
          const folder = await createFolderIfNotExists(
            "Documentos de Ctas Ctes",
          );
          await Promise.all(
            Array.from(files).map(async (file) => {
              const { data, error } = await uploadFiles(file, folder.id);
              if (error) {
                throw new Error(
                  `Error al subir el archivo ${file.name}: ${error}`,
                );
              }
              filesAdd.push({
                url: data.url || "",
                nombre: data.nombre || "",
                movimiento_id: movimientoId,
                tipo_documento: "movimiento",
              });
            }),
          );
          const documentosConMovimientoId = filesAdd.map((documento) => ({
            ...documento,
            movimiento_id: movimientoId,
          }));
          await CUDDocumentos(documentosConMovimientoId as Documento[], []);
        }
        return {
          success: true,
          message: "Movimiento creado exitosamente",
          data: data,
          error: null,
        };
      } catch (error) {
        console.error("Error creating movimiento:", error);
        return {
          success: false,
          message: "Error al crear el movimiento",
          data: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [
      paramsFromSheets,
      createNewMovimiento,
      CUDCheques,
      CUDDocumentos,
      getAdministracionData,
    ],
  );
  const updateMovimientoAndDocumentos = useCallback(
    async (
      dataForm: MovimientoDetalle,
      dirtyFields: DirtyMap<MovimientoFormValues>,
      files: FileTypeActions<Documento>,
    ) => {
      try {
        const { cheques, documentos, ...movimientoData } = dataForm;
        const { error } = await updateMovimiento(movimientoData, dirtyFields);
        if (error) {
          throw new Error(error);
        }
        if (files) {
          await managerFilesDocumentos(files, movimientoData.id);
        }
        return {
          success: true,
          message: "Movimiento actualizado exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error updating movimiento:", error);
        return {
          success: false,
          message: "Error al actualizar el movimiento",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [paramsFromSheets, updateMovimiento, getAdministracionData],
  );
  const managerFilesDocumentos = useCallback(
    async (files: FileTypeActions<Documento>, movimientoId: string) => {
      const uploadedDocuments: DocumentoFormValues[] = [];
      const removedDocuments = files.remove ?? [];
      const removedIds = removedDocuments
        .map((doc) => doc.id)
        .filter((id): id is string => Boolean(id));
      try {
        if (files.add) {
          const folder = await createFolderIfNotExists(
            "Documentos de Ctas Ctes",
          );
          await Promise.all(
            Array.from(files.add).map(async (file) => {
              const { data, error } = await uploadFiles(file, folder.id);
              if (error) {
                throw new Error(
                  `Error al subir el archivo ${file.name}: ${error}`,
                );
              }
              uploadedDocuments.push({
                url: data.url || "",
                nombre: data.nombre || "",
                movimiento_id: movimientoId,
                tipo_documento: "movimiento",
              });
            }),
          );
        }
        const documentosResult = await CUDDocumentos(
          uploadedDocuments as Documento[],
          removedIds,
        );

        if (!documentosResult.success) {
          throw new Error(
            documentosResult.error ||
              "Error al actualizar el registro de documentos",
          );
        }

        await Promise.all(
          removedDocuments.map(async (doc) => {
            if (!doc.url) {
              return;
            }
            const { error } = await deleteFileFromDrive(doc.url);
            if (error) {
              throw new Error(
                `Error al eliminar el archivo ${doc.nombre} de Drive: ${error}`,
              );
            }
          }),
        );
      } catch (error) {
        if (uploadedDocuments.length > 0) {
          await Promise.allSettled(
            uploadedDocuments.map(async (documento) => {
              if (!documento.url) {
                return;
              }
              await deleteFileFromDrive(documento.url);
            }),
          );
        }
        throw error;
      }
    },
    [uploadFiles, CUDDocumentos],
  );
  const isCHEQUERegistered = useCallback(
    (numeroCheque: number, cliente_id: string) => {
      return cheques.some(
        (cheque) =>
          cheque.numero === numeroCheque &&
          cheque.cliente.id === cliente_id &&
          cheque.status !== "anulado" &&
          cheque.status !== "rechazado",
      );
    },
    [cheques],
  );
  return (
    <AdministracionContext.Provider
      value={{
        getAdministracionData,
        ctasCorrientesData,
        cheques,
        getBancos,
        bancos,
        createMovimiento,
        updateMovimientoAndDocumentos,
        updateCheque,
        createNewMovimiento,
        isCHEQUERegistered,
      }}
    >
      {children}
    </AdministracionContext.Provider>
  );
};
export const useAdministracion = () => {
  const context = useContext(AdministracionContext);
  const { socios } = useSociosComercial();
  if (context === undefined) {
    throw new Error(
      "useAdministracion must be used within an AdministracionProvider",
    );
  }
  return context;
};
