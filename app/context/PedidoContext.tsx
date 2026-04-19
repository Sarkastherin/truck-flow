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
  updateManySheets,
  type SheetCellValue,
} from "~/backend/Database/apiGoogleSheets";
import { getDataInJSONFormat } from "~/backend/Database/helperTransformData";
import type {
  FormasPago,
  Pedido,
  PedidoFormValues,
  Documentos,
  DocumentosFormValues,
  Camion,
  Carroceria,
  TrabajoChasis,
  OrdenesTrabajo,
} from "~/types/pedido";
import type { DirtyMap } from "~/utils/prepareUpdatePayload";
import { useSociosComercial } from "./SociosComercialesContext";
import { useUser } from "./UserContext";
import { findRowById } from "~/backend/Database/helperTransformData";
import {
  SHEET_ID_PEDIDO,
  SHEET_NAMES_PEDIDOS,
  getCompleteSheetRange,
} from "~/backend/Database/SheetsConfig";
import {
  createFolderIfNotExists,
  deleteFileFromDrive,
} from "~/backend/Database/apiDrive";
import type { FileTypeActions } from "~/components/FileInputComponent";
import {
  useGlobal,
  type CreateGlobalResponse,
  type CrudGlobalResponse,
} from "./GlobalContext";
type PedidoDirtyFields = DirtyMap<PedidoFormValues>;

type Response = {
  error: string | null;
  success: boolean;
  message: string | null;
};

type PedidoContextType = {
  getPedidosData: () => Promise<void>;
  pedidos: Pedido[] | null;
  createNewPedido: (newPedido: Pedido) => Promise<CreateGlobalResponse<Pedido>>;
  updatePedido: (
    existingPedido: Pedido,
    dirtyFields: PedidoDirtyFields,
    deletedFormasPago: string[],
  ) => Promise<Response>;
  createNewCamion: (
    newCamion: Camion & { documentos: Documentos[] },
    idPedido: string,
    numeroPedido: string,
    files?: FileTypeActions<Documentos>,
  ) => Promise<Response>;
  updateCamion: (
    existingCamion: Camion,
    dirtyFields: DirtyMap<Camion>,
    idPedido: string,
    numeroPedido: string,
    files?: FileTypeActions<Documentos>,
  ) => Promise<Response>;
  createNewCarroceria: (
    newCarroceria: Carroceria & { documentos: Documentos[] },
    idPedido: string,
    numeroPedido: string,
    files?: FileTypeActions<Documentos>,
  ) => Promise<Response>;
  updateCarroceria: (
    existingCarroceria: Carroceria,
    dirtyFields: DirtyMap<Carroceria>,
    idPedido: string,
    numeroPedido: string,
    files?: FileTypeActions<Documentos>,
  ) => Promise<Response>;
  CUDTrabajosChasis: (
    data: TrabajoChasis[],
    deletedIds: string[],
  ) => Promise<CrudGlobalResponse>;
  createNewOrdenTrabajo: (
    newOrdenTrabajo: OrdenesTrabajo,
    file: File | Blob,
    fileName: string,
    nextStatus: string,
  ) => Promise<Response>;
  deleteOrdenTrabajo: (
    idOrdenTrabajo: string,
    numeroPedido: string,
  ) => Promise<Response>;
  closeOrdenTrabajo: (
    data: OrdenesTrabajo,
    pedidoId: string,
    closeStatus?: string,
  ) => Promise<Response>;
  deletePedido: (idPedido: string) => Promise<Response>;
  updateCamionBase: (
    existingCamion: Camion,
    dirtyFields: DirtyMap<Camion>,
  ) => Promise<Response>;
  updateCarroceriaBase: (
    existingCarroceria: Carroceria,
    dirtyFields: DirtyMap<Carroceria>,
  ) => Promise<Response>;
};
type HeadersType = {
  pedidos: SheetCellValue[] | null;
  formas_pago: SheetCellValue[] | null;
  camiones: SheetCellValue[] | null;
  carroceria: SheetCellValue[] | null;
  trabajo_chasis: SheetCellValue[] | null;
  ordenes_trabajo: SheetCellValue[] | null;
  documentos: SheetCellValue[] | null;
};
const PedidoContext = createContext<PedidoContextType | undefined>(undefined);
export const PedidosProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    uploadFiles,
    createGlobalEntityCrud,
    cudGlobalFieldsArrayEntities,
    assertReady,
  } = useGlobal();
  const SHEETS = useMemo(() => getCompleteSheetRange(SHEET_NAMES_PEDIDOS), []);
  const { socios } = useSociosComercial();
  const { activeUser } = useUser();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [paramsFromSheets, setParamsFromSheets] = useState<{
    headers: HeadersType;
    values: Record<string, SheetCellValue[][]>;
  } | null>(null);
  const getPedidosData = useCallback(async () => {
    try {
      if (!socios || socios.length === 0) return;
      const { data, error } = await getAllSheets(SHEET_ID_PEDIDO, SHEETS);
      if (error) {
        throw new Error(
          `Error al obtener los datos de la hoja de pedidos: ${error.message}`,
        );
      }
      if (!data || data.length === 0) {
        console.warn("No se encontraron datos en la hoja de pedidos.");
        return;
      }
      setParamsFromSheets({
        headers: {
          pedidos: data[0]?.[0] || null,
          formas_pago: data[1]?.[0] || null,
          camiones: data[2]?.[0] || null,
          carroceria: data[3]?.[0] || null,
          trabajo_chasis: data[4]?.[0] || null,
          ordenes_trabajo: data[5]?.[0] || null,
          documentos: data[6]?.[0] || null,
        },
        values: {
          pedidos: data[0] || [],
          formas_pago: data[1] || [],
          camiones: data[2] || [],
          carroceria: data[3] || [],
          trabajo_chasis: data[4] || [],
          ordenes_trabajo: data[5] || [],
          documentos: data[6] || [],
        },
      });

      const pedidosData = getDataInJSONFormat(data[0]);
      const formasPagoData = getDataInJSONFormat(data[1]);
      const camionesData = getDataInJSONFormat(data[2]);
      const carroceriaData = getDataInJSONFormat(data[3]);
      const trabajoChasisData = getDataInJSONFormat(data[4]);
      const ordenesTrabajoData = getDataInJSONFormat(data[5]);
      const documentosData = getDataInJSONFormat(data[6]);

      const combinedData = pedidosData.map((pedido) => {
        const cliente =
          socios.find((socio) => socio.id === pedido.cliente_id) || null;
        const formasPagoForThisPedido =
          formasPagoData.filter((forma) => forma.pedido_id === pedido.id) || [];
        const camionForThisPedido =
          camionesData.find((camion) => camion.pedido_id === pedido.id) || {};
        const carroceriaForThisPedido =
          carroceriaData.find(
            (carroceria) => carroceria.pedido_id === pedido.id,
          ) || {};
        const trabajoChasisForThisPedido =
          trabajoChasisData.filter(
            (trabajo) => trabajo.pedido_id === pedido.id,
          ) || [];
        const ordenesTrabajoForThisPedido =
          ordenesTrabajoData.filter((wo) => wo.pedido_id === pedido.id) || [];
        const documentosForThisPedido =
          documentosData.filter((doc) => doc.pedido_id === pedido.id) || [];
        return {
          ...pedido,
          cliente: cliente,
          formas_pago: formasPagoForThisPedido,
          camion: camionForThisPedido,
          carroceria: carroceriaForThisPedido,
          trabajo_chasis: trabajoChasisForThisPedido,
          ordenes_trabajo: ordenesTrabajoForThisPedido,
          documentos: documentosForThisPedido,
        } as Pedido;
      });
      setPedidos(
        combinedData.sort((a, b) => {
          //ordenear por numero de pedido desc
          const numA = parseInt(a.numero_pedido.slice(4));
          const numB = parseInt(b.numero_pedido.slice(4));
          return numB - numA;
        }),
      );
    } catch (error) {
      console.error("Error fetching orders data:", error);
      return;
    }
  }, [socios]);
  const generatePedidoNumber = () => {
    if (!pedidos) {
      return;
    }
    if (pedidos.length === 0) {
      return "PED-0001";
    }
    try {
      const lastPedido = pedidos.reduce((prev, current) => {
        const prevNum = parseInt(prev.numero_pedido.slice(4));
        const currentNum = parseInt(current.numero_pedido.slice(4));
        return currentNum > prevNum ? current : prev;
      });
      if (!lastPedido) {
        throw new Error("No se pudo determinar el último número de pedido.");
      }
      const lastPedidoNumber = parseInt(lastPedido.numero_pedido.slice(4));
      const newPedidoNumber = lastPedidoNumber + 1;
      return `PED-${String(newPedidoNumber).padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating new pedido number:", error);
      return;
    }
  };
  const { create: createPedidoBase, update: updatePedidoBase } =
    createGlobalEntityCrud<Pedido>(
      "pedidos",
      "pedido",
      paramsFromSheets,
      SHEET_ID_PEDIDO,
      SHEET_NAMES_PEDIDOS.pedidos,
      getPedidosData,
    );
  const { create: createCamionBase, update: updateCamionBase } =
    createGlobalEntityCrud<Camion>(
      "camiones",
      "camion",
      paramsFromSheets,
      SHEET_ID_PEDIDO,
      SHEET_NAMES_PEDIDOS.camiones,
      getPedidosData,
    );
  const { create: createCarroceriaBase, update: updateCarroceriaBase } =
    createGlobalEntityCrud<Carroceria>(
      "carroceria",
      "carroceria",
      paramsFromSheets,
      SHEET_ID_PEDIDO,
      SHEET_NAMES_PEDIDOS.carroceria,
      getPedidosData,
    );
  const {
    create: createOrdenTrabajoBase,
    update: updateOrdenTrabajoBase,
    deleteEntity: deleteOrdenTrabajoBase,
  } = createGlobalEntityCrud<OrdenesTrabajo>(
    "ordenes_trabajo",
    "orden_trabajo",
    paramsFromSheets,
    SHEET_ID_PEDIDO,
    SHEET_NAMES_PEDIDOS.ordenes_trabajo,
    getPedidosData,
  );

  /* PEDIDO */
  const CUDFormasPago = useCallback(
    async (data: FormasPago[], deletedIds: string[]) => {
      return cudGlobalFieldsArrayEntities({
        entities: data,
        deletedIds,
        sheetKey: "formas_pago",
        entityLabel: "forma de pago",
        paramsFromSheets,
        sheetId: SHEET_ID_PEDIDO,
        sheetName: SHEET_NAMES_PEDIDOS.formas_pago,
        successMessage: "Formas de pago actualizadas exitosamente",
        onGetData: getPedidosData,
      });
    },
    [cudGlobalFieldsArrayEntities, getPedidosData, paramsFromSheets],
  );
  const createNewPedido = useCallback(
    async (newPedido: Pedido) => {
      try {
        const { cliente, formas_pago, ...pedidoData } = newPedido;
        const numeroPedido = generatePedidoNumber();
        if (!numeroPedido) {
          throw new Error("No se pudo generar un número de pedido válido.");
        }
        const payloadPedidoData = {
          ...pedidoData,
          numero_pedido: numeroPedido,
        };
        const { data, error } = await createPedidoBase(
          payloadPedidoData as Pedido,
        );
        if (error || !data) {
          throw new Error(
            `Error al crear el pedido: ${error || "Error desconocido"}`,
          );
        }
        const idNewPedido = data.id!;
        /* AGREGANDO FORMAS DE PAGO */
        if (formas_pago && formas_pago.length > 0) {
          const formasPagoWithPedidoId = formas_pago.map((forma) => ({
            ...forma,
            pedido_id: idNewPedido,
          }));
          await CUDFormasPago(formasPagoWithPedidoId, []);
        }
        await getPedidosData();
        return {
          success: true,
          message: "Pedido creado exitosamente",
          data: data as Pedido,
          error: null,
        };
      } catch (error) {
        console.error("Error al crear un nuevo pedido:", error);
        return {
          success: false,
          message: "Error al crear el pedido",
          data: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [
      paramsFromSheets,
      activeUser,
      getPedidosData,
      createPedidoBase,
      CUDFormasPago,
    ],
  );
  const updatePedido = useCallback(
    async (
      existingPedido: Pedido,
      dirtyFields: PedidoDirtyFields,
      deletedFormasPago: string[],
    ) => {
      const { formas_pago } = existingPedido;
      try {
        const { error } = await updatePedidoBase(existingPedido, dirtyFields);
        if (error) {
          throw new Error(error);
        }
        if (formas_pago && formas_pago.length > 0) {
          const formasPagoWithPedidoId = formas_pago.map((forma) => ({
            ...forma,
            pedido_id: existingPedido.id,
          }));
          await CUDFormasPago(formasPagoWithPedidoId, deletedFormasPago);
        }
        await getPedidosData();
        return {
          success: true,
          message: "Pedido actualizado exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al actualizar el pedido:", error);
        return {
          success: false,
          message: "Error al actualizar el pedido",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [
      activeUser,
      paramsFromSheets,
      getPedidosData,
      updatePedidoBase,
      CUDFormasPago,
    ],
  );
  const CUDDocumentos = useCallback(
    async (documentos: Documentos[], deletedIds: string[]) => {
      return cudGlobalFieldsArrayEntities({
        entities: documentos,
        deletedIds,
        sheetKey: "documentos",
        entityLabel: "documento",
        paramsFromSheets,
        sheetId: SHEET_ID_PEDIDO,
        sheetName: SHEET_NAMES_PEDIDOS.documentos,
        successMessage: "Documentos actualizados exitosamente",
        onGetData: getPedidosData,
      });
    },
    [cudGlobalFieldsArrayEntities, getPedidosData, paramsFromSheets],
  );
  const managerFilesDocumentos = useCallback(
    async (
      files: FileTypeActions<Documentos>,
      numeroPedido: string,
      idPedido: string,
      tipoDocumento: "camion" | "carroceria",
    ) => {
      const uploadedDocuments: DocumentosFormValues[] = [];
      const removedDocuments = files.remove ?? [];
      const removedIds = removedDocuments
        .map((doc) => doc.id)
        .filter((id): id is string => Boolean(id));
      // Subir archivos a Drive y crear registro en Documentos
      try {
        if (files.add) {
          const folder = await createFolderIfNotExists("Documentos de Pedidos");
          const folderId = await createFolderIfNotExists(
            `Pedido ${numeroPedido}`,
            folder.id,
          );
          await Promise.all(
            Array.from(files.add).map(async (file) => {
              const { data, error } = await uploadFiles(file, folderId.id);
              if (error) {
                throw new Error(
                  `Error al subir el archivo ${file.name}: ${error}`,
                );
              }
              uploadedDocuments.push({
                url: data.url || "",
                nombre: data.nombre || "",
                pedido_id: idPedido,
                tipo_documento: tipoDocumento,
              });
            }),
          );
        }
        const documentosResult = await CUDDocumentos(
          uploadedDocuments as Documentos[],
          removedIds,
        );
        if (!documentosResult.success) {
          throw new Error(
            documentosResult.error ||
              "Error al actualizar el registro de documentos",
          );
        }
        if (files.remove) {
          await Promise.all(
            removedDocuments.map(async (doc) => {
              if (doc.url) {
                const { error } = await deleteFileFromDrive(doc.url);
                if (error) {
                  throw new Error(
                    `Error al eliminar el archivo ${doc.nombre} de Drive: ${error}`,
                  );
                }
              }
            }),
          );
        }
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
    [paramsFromSheets, activeUser, uploadFiles, CUDDocumentos],
  );
  /* CAMION */
  const createNewCamion = useCallback(
    async (
      newCamion: Camion & { documentos: Documentos[] },
      idPedido: string,
      numeroPedido: string,
      files?: FileTypeActions<Documentos>,
    ) => {
      try {
        const { documentos, ...camionData } = newCamion;
        console.log("Datos del nuevo camión a crear:", camionData);
        const { data, error } = await createCamionBase(camionData);

        if (error || !data) {
          throw new Error(
            `Error al crear el camión: ${error || "Error desconocido"}`,
          );
        }
        if (files) {
          await managerFilesDocumentos(files, numeroPedido, idPedido, "camion");
        }
        await getPedidosData();
        return {
          success: true,
          message: "Camión creado exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al crear un nuevo camion:", error);
        return {
          success: false,
          message: "Error al crear el camión",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [
      paramsFromSheets,
      activeUser,
      getPedidosData,
      createCamionBase,
      managerFilesDocumentos,
    ],
  );
  const updateCamion = useCallback(
    async (
      existingCamion: Camion,
      dirtyFields: DirtyMap<Camion>,
      idPedido: string,
      numeroPedido: string,
      files?: FileTypeActions<Documentos>,
    ) => {
      try {
        const { error } = await updateCamionBase(existingCamion, dirtyFields);
        if (error) {
          throw new Error(`Error al actualizar el camión: ${error}`);
        }
        if (files) {
          await managerFilesDocumentos(files, numeroPedido, idPedido, "camion");
        }
        await getPedidosData();
        return {
          success: true,
          message: "Camión actualizado exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al actualizar el camión:", error);
        return {
          success: false,
          message: "Error al actualizar el camión",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [paramsFromSheets, activeUser, getPedidosData],
  );
  /* CARROCERIA */
  const createNewCarroceria = useCallback(
    async (
      newCarroceria: Carroceria & { documentos: Documentos[] },
      idPedido: string,
      numeroPedido: string,
      files?: FileTypeActions<Documentos>,
    ) => {
      try {
        const { documentos, ...carroceriaData } = newCarroceria;
        const { error } = await createCarroceriaBase(carroceriaData);

        if (error) {
          throw new Error(`Error al insertar la nueva carroceria: ${error}`);
        }
        if (files) {
          await managerFilesDocumentos(
            files,
            numeroPedido,
            idPedido,
            "carroceria",
          );
        }
        await getPedidosData();
        return {
          success: true,
          message: "Carrocería creada exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al crear una nueva carroceria:", error);
        return {
          success: false,
          message: "Error al crear la carroceria",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [paramsFromSheets, activeUser, getPedidosData],
  );
  const updateCarroceria = useCallback(
    async (
      existingCarroceria: Carroceria,
      dirtyFields: DirtyMap<Carroceria>,
      idPedido: string,
      numeroPedido: string,
      files?: FileTypeActions<Documentos>,
    ) => {
      try {
        const { error } = await updateCarroceriaBase(
          existingCarroceria,
          dirtyFields,
        );

        if (error) {
          throw new Error(`Error al actualizar la carroceria: ${error}`);
        }
        if (files) {
          await managerFilesDocumentos(
            files,
            numeroPedido,
            idPedido,
            "carroceria",
          );
        }
        await getPedidosData();
        return {
          success: true,
          message: "Carrocería actualizada exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al actualizar la carroceria:", error);
        return {
          success: false,
          message: "Error al actualizar la carroceria",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [paramsFromSheets, activeUser, getPedidosData],
  );

  /* TRABAJO EN CHASIS */
  const CUDTrabajosChasis = useCallback(
    async (data: TrabajoChasis[], deletedIds: string[]) => {
      return cudGlobalFieldsArrayEntities({
        entities: data,
        deletedIds,
        sheetKey: "trabajo_chasis",
        entityLabel: "trabajo en chasis",
        paramsFromSheets,
        sheetId: SHEET_ID_PEDIDO,
        sheetName: SHEET_NAMES_PEDIDOS.trabajo_chasis,
        successMessage: "Trabajos en chasis actualizados exitosamente",
        onGetData: getPedidosData,
      });
    },
    [cudGlobalFieldsArrayEntities, getPedidosData, paramsFromSheets],
  );
  /* ORDENES */
  const managerFileOrdenesTrabajo = useCallback(
    async (file: File | Blob, fileName: string, tipoOrden: string) => {
      try {
        const currentYear = new Date().getFullYear();
        const mainFolder = await createFolderIfNotExists("Órdenes de Trabajo");
        const yearFolder = await createFolderIfNotExists(
          currentYear.toString(),
          mainFolder.id,
        );
        const tipoFormateado =
          tipoOrden.charAt(0).toUpperCase() + tipoOrden.slice(1);
        const typeFolder = await createFolderIfNotExists(
          tipoFormateado,
          yearFolder.id,
        );
        if (!typeFolder.id) {
          throw new Error("El ID de la carpeta final no es válido");
        }
        const result = await uploadFiles(file, typeFolder.id, fileName);
        return result;
      } catch (error) {
        console.error(
          "Error al gestionar el archivo de órdenes de trabajo:",
          error,
        );
        return {
          success: false,
          message: "Error al gestionar el archivo de órdenes de trabajo",
          data: { url: "", nombre: "" },
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [],
  );
  const createNewOrdenTrabajo = useCallback(
    async (
      newOrdenTrabajo: OrdenesTrabajo,
      file: File | Blob,
      fileName: string,
      nextStatus: string,
    ) => {
      try {
        const { data, error: errorFile } = await managerFileOrdenesTrabajo(
          file,
          fileName,
          newOrdenTrabajo.tipo_orden,
        );
        if (errorFile) {
          throw new Error(
            `Error al subir el archivo de la orden de trabajo: ${errorFile}`,
          );
        }
        if (!data.url) {
          throw new Error("No se obtuvo la URL del archivo subido");
        }
        const payloadOrdenTrabajo = {
          ...newOrdenTrabajo,
          url_archivo: data.url,
        };
        const { error } = await createOrdenTrabajoBase(payloadOrdenTrabajo);

        if (error) {
          throw new Error(error);
        }
        // Actualizar status del pedido a  en_produccion
        await updateStatusPedido(newOrdenTrabajo.pedido_id, nextStatus);

        await getPedidosData();
        return {
          success: true,
          message: "Orden de trabajo creada exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al crear una nueva orden de trabajo:", error);
        return {
          success: false,
          message: "Error al crear la orden de trabajo",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [paramsFromSheets, activeUser, managerFileOrdenesTrabajo, getPedidosData],
  );
  const deleteOrdenTrabajo = useCallback(
    async (id: string, urlArchivo: string) => {
      try {
        const deleteResult = await deleteFileFromDrive(urlArchivo);
        const { error } = await deleteOrdenTrabajoBase(id);

        if (error) {
          throw new Error(`Error al eliminar el archivo de Drive: ${error}`);
        }
        await getPedidosData();
        return {
          success: true,
          message: "Orden de trabajo eliminada exitosamente",
          error: deleteResult.error
            ? `Error al eliminar el archivo de Drive: ${deleteResult.error}`
            : null,
        };
      } catch (error) {
        console.error("Error al eliminar la orden de trabajo:", error);
        return {
          success: false,
          message: "Error al eliminar la orden de trabajo",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [getPedidosData, paramsFromSheets, activeUser],
  );
  const closeOrdenTrabajo = useCallback(
    // Solo actualiza la fecha de finalización, el status y el comentario. No se puede actualizar el archivo ni el tipo de orden.
    async (data: OrdenesTrabajo, pedidoId: string, closeStatus?: string) => {
      try {
        const { error } = await updateOrdenTrabajoBase(data, {
          fecha_finalizado: true,
          status: true,
          notas: true,
        });
        if (error) {
          throw new Error(`Error al actualizar la orden de trabajo: ${error}`);
        }
        if (closeStatus) {
          await updateStatusPedido(pedidoId, closeStatus);
        }
        await getPedidosData();
        return {
          success: true,
          message: "Orden de trabajo actualizada exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al actualizar la orden de trabajo:", error);
        return {
          success: false,
          message: "Error al actualizar la orden de trabajo",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [getPedidosData, paramsFromSheets, activeUser, updateOrdenTrabajoBase],
  );
  const updateStatusPedido = useCallback(
    async (idPedido: string, newStatus: string) => {
      try {
        const { error } = await updatePedidoBase(
          { id: idPedido, status: newStatus } as Pedido,
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
  const deletePedido = useCallback(
    async (idPedido: string) => {
      try {
        const deletePayload = [];
        const { headers, values } = assertReady(
          "eliminar pedido",
          paramsFromSheets,
        );
        const rowPedido = findRowById(
          idPedido,
          SHEET_NAMES_PEDIDOS.pedidos,
          values,
        );
        if (!rowPedido) {
          throw new Error("No se encontró el pedido a eliminar.");
        }
        const dimensionPedido = headers.pedidos?.map(() => "");
        const deleteRangePedido = {
          range: `${SHEET_NAMES_PEDIDOS.pedidos}!A${rowPedido}:ZZZ${rowPedido}`,
          values: [dimensionPedido || []],
        };
        deletePayload.push(deleteRangePedido);
        const rowFormasPago = findRowById(
          idPedido,
          SHEET_NAMES_PEDIDOS.formas_pago,
          values,
        );
        if (rowFormasPago) {
          const dimensionFormasPago = headers.formas_pago?.map(() => "");
          const deleteRangeFormasPago = {
            range: `${SHEET_NAMES_PEDIDOS.formas_pago}!A${rowFormasPago}:ZZZ${rowFormasPago}`,
            values: [dimensionFormasPago || []],
          };
          deletePayload.push(deleteRangeFormasPago);
        }

        const rowCamiones = findRowById(
          idPedido,
          SHEET_NAMES_PEDIDOS.camiones,
          values,
        );
        if (rowCamiones) {
          const dimensionCamiones = headers.camiones?.map(() => "");
          const deleteRangeCamiones = {
            range: `${SHEET_NAMES_PEDIDOS.camiones}!A${rowCamiones}:ZZZ${rowCamiones}`,
            values: [dimensionCamiones || []],
          };
          deletePayload.push(deleteRangeCamiones);
        }
        const rowCarrocerias = findRowById(
          idPedido,
          SHEET_NAMES_PEDIDOS.carroceria,
          values,
        );
        if (rowCarrocerias) {
          const dimensionCarrocerias = headers.carroceria?.map(() => "");
          const deleteRangeCarrocerias = {
            range: `${SHEET_NAMES_PEDIDOS.carroceria}!A${rowCarrocerias}:ZZZ${rowCarrocerias}`,
            values: [dimensionCarrocerias || []],
          };
          deletePayload.push(deleteRangeCarrocerias);
        }
        const rowDocumentos = findRowById(
          idPedido,
          SHEET_NAMES_PEDIDOS.documentos,
          values,
        );
        if (rowDocumentos) {
          const dimensionDocumentos = headers.documentos?.map(() => "");
          const deleteRangeDocumentos = {
            range: `${SHEET_NAMES_PEDIDOS.documentos}!A${rowDocumentos}:ZZZ${rowDocumentos}`,
            values: [dimensionDocumentos || []],
          };
          deletePayload.push(deleteRangeDocumentos);
        }
        const rowTrabajosChasis = findRowById(
          idPedido,
          SHEET_NAMES_PEDIDOS.trabajo_chasis,
          values,
        );
        if (rowTrabajosChasis) {
          const dimensionTrabajosChasis = headers.trabajo_chasis?.map(() => "");
          const deleteRangeTrabajosChasis = {
            range: `${SHEET_NAMES_PEDIDOS.trabajo_chasis}!A${rowTrabajosChasis}:ZZZ${rowTrabajosChasis}`,
            values: [dimensionTrabajosChasis || []],
          };
          deletePayload.push(deleteRangeTrabajosChasis);
        }
        const rowOrdenesTrabajo = findRowById(
          idPedido,
          SHEET_NAMES_PEDIDOS.ordenes_trabajo,
          values,
        );
        if (rowOrdenesTrabajo) {
          const dimensionOrdenesTrabajo = headers.ordenes_trabajo?.map(
            () => "",
          );
          const deleteRangeOrdenesTrabajo = {
            range: `${SHEET_NAMES_PEDIDOS.ordenes_trabajo}!A${rowOrdenesTrabajo}:ZZZ${rowOrdenesTrabajo}`,
            values: [dimensionOrdenesTrabajo || []],
          };
          deletePayload.push(deleteRangeOrdenesTrabajo);
        }
        const { error } = await updateManySheets(
          SHEET_ID_PEDIDO,
          deletePayload,
        );
        if (error) {
          throw new Error(`Error al eliminar el pedido: ${error.message}`);
        }
        await getPedidosData();
        return {
          success: true,
          message: "Pedido eliminado exitosamente",
          error: null,
        };
      } catch (error) {
        console.error("Error al eliminar el pedido:", error);
        return {
          success: false,
          message: "Error al eliminar el pedido",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [paramsFromSheets, activeUser, getPedidosData],
  );

  return (
    <PedidoContext.Provider
      value={{
        getPedidosData,
        pedidos,
        createNewPedido,
        updatePedido,
        createNewCamion,
        updateCamion,
        createNewCarroceria,
        updateCarroceria,
        CUDTrabajosChasis,
        createNewOrdenTrabajo,
        deleteOrdenTrabajo,
        closeOrdenTrabajo,
        deletePedido,
        updateCamionBase,
        updateCarroceriaBase
      }}
    >
      {children}
    </PedidoContext.Provider>
  );
};
export const usePedido = () => {
  const context = useContext(PedidoContext);
  if (context === undefined) {
    throw new Error("usePedido must be used within an PedidosProvider");
  }
  return context;
};
