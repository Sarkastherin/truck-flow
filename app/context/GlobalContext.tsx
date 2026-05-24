import { createContext, useCallback, useContext } from "react";
import {
  insertDataToSheet,
  insertManyDataToSheet,
  updateManySheets,
  type SheetCellValue,
} from "~/backend/Database/apiGoogleSheets";
import {
  findRowById,
  prepareDataToCreate,
  prepareDataToUpdate,
} from "~/backend/Database/helperTransformData";
import {
  prepareUpdatePayload,
  type DirtyMap,
} from "~/utils/prepareUpdatePayload";
import { useAuth } from "./AuthContext";
import { uploadFileToDrive } from "~/backend/Database/apiDrive";
import type { UsersTable } from "~/types/users";
export type CrudGlobalResponse = {
  success: boolean;
  message: string;
  error: string | null;
};
export type BaseGlobalEntity = {
  id: string;
  active: boolean;
};
export type CreateGlobalResponse<T extends BaseGlobalEntity> =
  CrudGlobalResponse & {
    data: T | null;
  };

type ConfigSheetKey = keyof Record<string, SheetCellValue[] | null>;
type GlobalFieldsArraySheetKey = string;
type GlobalFieldsArrayEntity = {
  id?: string;
};
type GlobalContextType = {
  assertReady: <H extends Record<string, string>>(
    operacion: string,
    paramsFromSheets: ParamsFromSheetsType<H>,
    activeUser: UsersTable,
  ) => {
    headers: Record<keyof H, SheetCellValue[] | null>;
    values: Record<string, SheetCellValue[][]>;
  };
  createGlobalEntityCrud: <T extends BaseGlobalEntity>(
    sheetKey: ConfigSheetKey,
    entityLabel: string,
    paramsFromSheets: ParamsFromSheetsType<Record<string, string>>,
    sheetId: string,
    sheetName: string,
    onGetData: () => Promise<void>,
    activeUser: UsersTable,
  ) => {
    create: (entityData: Omit<T, "id">) => Promise<CreateGlobalResponse<T>>;
    update: (
      existingEntity: T,
      dirtyFields: DirtyMap<T>,
    ) => Promise<CrudGlobalResponse>;
    remove: (entityId: string) => Promise<CrudGlobalResponse>;
    reactivate: (entityId: string) => Promise<CrudGlobalResponse>;
    deleteEntity: (entityId: string) => Promise<CrudGlobalResponse>;
  };
  cudGlobalFieldsArrayEntities: <T extends GlobalFieldsArrayEntity>({
    entities,
    deletedIds,
    sheetKey,
    entityLabel,
    paramsFromSheets,
    sheetId,
    sheetName,
    successMessage,
    onGetData,
    activeUser,
  }: {
    entities: T[];
    deletedIds: string[];
    sheetKey: GlobalFieldsArraySheetKey;
    entityLabel: string;
    paramsFromSheets: ParamsFromSheetsType<Record<string, string>>;
    sheetId: string;
    sheetName: string;
    successMessage: string;
    onGetData: () => Promise<void>;
    activeUser: UsersTable;
  }) => Promise<CrudGlobalResponse>;
  uploadFiles: (
    file: File | Blob,
    folderId?: string,
    fileName?: string,
  ) => Promise<{
    success: boolean;
    message: string;
    data: { url: string | undefined; nombre: string };
    error: string | null;
  }>;
};
export type CreateGlobalMethod<T extends BaseGlobalEntity> = (
  entityData: Omit<T, "id">,
) => Promise<CreateGlobalResponse<T>>;
export type UpdateGlobalMethod<T extends BaseGlobalEntity> = (
  existingEntity: T,
  dirtyFields: DirtyMap<T>,
) => Promise<CrudGlobalResponse>;
type ParamsFromSheetsType<H extends Record<string, string>> = {
  headers: Record<keyof H, SheetCellValue[] | null>;
  values: Record<string, SheetCellValue[][]>;
} | null;
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);
export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const assertReady = <H extends Record<string, string>>(
    operacion: string,
    paramsFromSheets: ParamsFromSheetsType<H>,
    activeUser: UsersTable,
  ) => {
    if (!paramsFromSheets?.headers || !paramsFromSheets?.values) {
      throw new Error(
        `No se pueden ${operacion}: los encabezados no están cargados.`,
      );
    }
    if (!activeUser) {
      throw new Error(`No se pueden ${operacion}: no hay un usuario activo.`);
    }
    return {
      headers: paramsFromSheets.headers,
      values: paramsFromSheets.values,
      activeUser,
    };
  };

  const createGlobalEntityCrud = <T extends BaseGlobalEntity>(
    sheetKey: ConfigSheetKey,
    entityLabel: string,
    paramsFromSheets: ParamsFromSheetsType<Record<string, string>>,
    sheetId: string,
    sheetName: string,
    onGetData: () => Promise<void>,
    activeUser: UsersTable,
  ) => {
    const rangeComplete = `${sheetName}!A:ZZZ`;
    const create = async (
      entityData: Omit<T, "id">,
    ): Promise<CreateGlobalResponse<T>> => {
      try {
        const { headers } = assertReady(
          `crear ${entityLabel}`,
          paramsFromSheets,
          activeUser,
        );
        const payload = prepareDataToCreate(
          entityData,
          activeUser.id,
          headers[sheetKey] || [],
        );
        const { data, error } = await insertDataToSheet(
          sheetId,
          rangeComplete,
          payload,
        );
        if (error) {
          throw new Error(`Error al crear ${entityLabel}: ${error.message}`);
        }
        await onGetData();
        return {
          success: true,
          message: `${entityLabel} creado exitosamente`,
          data: {
            id: data?.updates.updatedData?.values[0][0] || "unknown_id",
            ...entityData,
          } as T,
          error: null,
        };
      } catch (error) {
        console.error(`Error al crear ${entityLabel}:`, error);
        return {
          success: false,
          message: `Error al crear ${entityLabel}`,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    const update = async (
      existingEntity: T,
      dirtyFields: DirtyMap<T>,
    ): Promise<CrudGlobalResponse> => {
      try {
        const {
          headers,
          activeUser: user,
          values,
        } = assertReady(
          `actualizar ${entityLabel}`,
          paramsFromSheets,
          activeUser,
        );
        const payload = prepareUpdatePayload({
          dirtyFields,
          formData: existingEntity,
        });
        const row = findRowById(existingEntity.id, sheetName, values);
        if (row === null) {
          throw new Error(
            `No se encontro ${entityLabel} con id ${existingEntity.id}`,
          );
        }
        const updates = prepareDataToUpdate(
          payload,
          row,
          sheetName,
          headers[sheetKey] || [],
          user.id,
        );
        const { error } = await updateManySheets(sheetId, updates);
        if (error) {
          throw new Error(
            `Error al actualizar ${entityLabel}: ${error.message}`,
          );
        }
        await onGetData();
        return {
          success: true,
          message: `${entityLabel} actualizado exitosamente`,
          error: null,
        };
      } catch (error) {
        console.error(`Error al actualizar ${entityLabel}:`, error);
        return {
          success: false,
          message: `Error al actualizar ${entityLabel}`,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    const setActive = async (
      entityId: string,
      active: boolean,
    ): Promise<CrudGlobalResponse> => {
      return await update(
        {
          id: entityId,
          active,
        } as T,
        { active: true } as DirtyMap<T>,
      );
    };
    const deleteEntity = async (
      entityId: string,
    ): Promise<CrudGlobalResponse> => {
      try {
        const row = findRowById(
          entityId,
          sheetName,
          paramsFromSheets?.values || {},
        );
        if (row === null) {
          throw new Error(`No se encontro ${entityLabel} con id ${entityId}`);
        }
        const dimension =
          paramsFromSheets?.headers[sheetKey]?.map(() => "") || [];
        const deletePayload = {
          range: `${sheetName}!A${row}:ZZZ${row}`,
          values: [dimension],
        };
        const { error } = await updateManySheets(sheetId, [deletePayload]);
        if (error) {
          throw new Error(`Error al eliminar ${entityLabel}: ${error.message}`);
        }
        await onGetData();
        return {
          success: true,
          message: `${entityLabel} eliminado exitosamente`,
          error: null,
        };
      } catch (error) {
        console.error(`Error al eliminar ${entityLabel}:`, error);
        return {
          success: false,
          message: `Error al eliminar ${entityLabel}`,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    return {
      create,
      update,
      remove: async (entityId: string) => await setActive(entityId, false),
      reactivate: async (entityId: string) => await setActive(entityId, true),
      deleteEntity,
    };
  };
  const createGlobalFieldsArrayEntities = useCallback(
    async <T extends GlobalFieldsArrayEntity>(
      data: T[],
      sheetKey: GlobalFieldsArraySheetKey,
      entityLabel: string,
      paramsFromSheets: ParamsFromSheetsType<Record<string, string>>,
      sheetId: string,
      sheetName: string,
      activeUser: UsersTable,
    ) => {
      const rangeComplete = `${sheetName}!A:ZZZ`;
      const { headers } = assertReady(
        `crear ${entityLabel}`,
        paramsFromSheets,
        activeUser,
      );
      const payload = data.map((item) =>
        prepareDataToCreate(item, activeUser.id, headers[sheetKey] || []),
      );
      const { error } = await insertManyDataToSheet(
        sheetId,
        rangeComplete,
        payload,
      );
      if (error) {
        throw new Error(`Error al crear ${entityLabel}: ${error.message}`);
      }
    },
    [],
  );
  const updateGlobalFieldsArrayEntities = useCallback(
    async <T extends GlobalFieldsArrayEntity>(
      data: T[],
      sheetKey: GlobalFieldsArraySheetKey,
      entityLabel: string,
      paramsFromSheets: ParamsFromSheetsType<Record<string, string>>,
      sheetId: string,
      sheetName: string,
      activeUser: UsersTable,
    ) => {
      const {
        headers,
        values,
        activeUser: user,
      } = assertReady(`actualizar ${entityLabel}`, paramsFromSheets, activeUser);
      const updates = data
        .filter((item): item is T & { id: string } => Boolean(item.id))
        .map((item) => {
          const row = findRowById(item.id, sheetName, values);
          if (row === null) {
            throw new Error(
              `No se encontro registro de ${entityLabel} con id ${item.id}`,
            );
          }
          return prepareDataToUpdate(
            item,
            row,
            sheetName,
            headers[sheetKey] || [],
            user.id,
          );
        });
      if (updates.length === 0) {
        return;
      }
      const { error } = await updateManySheets(sheetId, updates.flat());
      if (error) {
        throw new Error(`Error al actualizar ${entityLabel}: ${error.message}`);
      }
    },
    [],
  );
  const deleteGlobalFieldsArrayEntities = useCallback(
    async (
      deletedIds: string[],
      sheetKey: GlobalFieldsArraySheetKey,
      entityLabel: string,
      paramsFromSheets: ParamsFromSheetsType<Record<string, string>>,
      sheetId: string,
      sheetName: string,
      activeUser: UsersTable,
    ) => {
      const rangeComplete = `${sheetName}!A:ZZZ`;
      const { headers, values } = assertReady(
        `eliminar ${entityLabel}`,
        paramsFromSheets,
        activeUser,
      );
      if (deletedIds.length === 0) {
        return;
      }
      const deletePayload = deletedIds.map((id) => {
        const row = findRowById(id, sheetName, values);
        if (row === null) {
          throw new Error(
            `No se encontro registro de ${entityLabel} con id ${id}`,
          );
        }
        return {
          range: `${sheetName}!A${row}:ZZZ${row}`,
          values: [headers[sheetKey]?.map(() => "") || []],
        };
      });
      const { error } = await updateManySheets(sheetId, deletePayload);
      if (error) {
        throw new Error(`Error al eliminar ${entityLabel}: ${error.message}`);
      }
    },
    [],
  );
  const cudGlobalFieldsArrayEntities = useCallback(
    async <T extends GlobalFieldsArrayEntity>({
      entities,
      deletedIds,
      sheetKey,
      entityLabel,
      paramsFromSheets,
      sheetId,
      sheetName,
      successMessage,
      onGetData,
      activeUser,
    }: {
      entities: T[];
      deletedIds: string[];
      sheetKey: GlobalFieldsArraySheetKey;
      entityLabel: string;
      paramsFromSheets: ParamsFromSheetsType<Record<string, string>>;
      sheetId: string;
      sheetName: string;
      successMessage: string;
      onGetData: () => Promise<void>;
      activeUser: UsersTable;
    }): Promise<CrudGlobalResponse> => {
      try {
        if (entities.length > 0) {
          const toCreate = entities.filter((entity) => !entity.id);
          const toUpdate = entities.filter((entity) => entity.id);
          if (toCreate.length > 0) {
            await createGlobalFieldsArrayEntities(
              toCreate,
              sheetKey,
              entityLabel,
              paramsFromSheets,
              sheetId,
              sheetName,
              activeUser,
            );
          }
          if (toUpdate.length > 0) {
            await updateGlobalFieldsArrayEntities(
              toUpdate,
              sheetKey,
              entityLabel,
              paramsFromSheets,
              sheetId,
              sheetName,
              activeUser
            );
          }
        }
        if (deletedIds.length > 0) {
          await deleteGlobalFieldsArrayEntities(
            deletedIds,
            sheetKey,
            entityLabel,
            paramsFromSheets,
            sheetId,
            sheetName,
            activeUser
          );
        }
        await onGetData();
        return {
          success: true,
          message: successMessage,
          error: null,
        };
      } catch (error) {
        console.error(`Error al actualizar ${entityLabel}:`, error);
        return {
          success: false,
          message: `Error al actualizar ${entityLabel}`,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [
      createGlobalFieldsArrayEntities,
      updateGlobalFieldsArrayEntities,
      deleteGlobalFieldsArrayEntities,
    ],
  );
  const uploadFiles = useCallback(
    async (
      file: File | Blob,
      folderId?: string,
      fileName?: string,
    ): Promise<{
      success: boolean;
      message: string;
      data: { url: string | undefined; nombre: string };
      error: string | null;
    }> => {
      try {
        const name = fileName || (file instanceof File ? file.name : "archivo");
        const response = await uploadFileToDrive(file, name, folderId);
        return {
          success: true,
          message: "Archivo subido exitosamente",
          data: { url: response.webViewLink, nombre: name },
          error: null,
        };
      } catch (error) {
        console.error("Error al subir el archivo:", error);
        return {
          success: false,
          message: "Error al subir el archivo",
          data: { url: "", nombre: "" },
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [],
  );
  return (
    <GlobalContext.Provider
      value={{
        assertReady,
        createGlobalEntityCrud,
        cudGlobalFieldsArrayEntities,
        uploadFiles,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
export const useGlobal = () => {
  const { auth } = useAuth();
  const context = useContext(GlobalContext);
  if (!auth) {
    throw new Error("useGlobal is not available while auth is false");
  }
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
};
