interface DriveFileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
}

interface DriveFile {
  id: string;
  name: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
}

interface DriveApiResponse {
  result: DriveFile;
}

interface DriveListResponse {
  result: {
    files: DriveFile[];
  };
}

function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function getDriveFileId(fileIdOrUrl: string): string {
  const trimmedValue = fileIdOrUrl.trim();

  if (!trimmedValue) {
    throw new Error("El ID o la URL del archivo es requerido");
  }

  if (!trimmedValue.includes("/")) {
    return trimmedValue;
  }

  const filePathMatch = trimmedValue.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch?.[1]) {
    return filePathMatch[1];
  }

  try {
    const url = new URL(trimmedValue);
    const idFromParams = url.searchParams.get("id");

    if (idFromParams) {
      return idFromParams;
    }
  } catch {
    throw new Error("La URL del archivo de Drive no es valida");
  }

  throw new Error("No se pudo obtener el ID del archivo de Drive");
}

declare const gapi: {
  load: (name: "client", callback: () => void) => void;
  client: {
    request: (params: {
      path: string;
      method: string;
      params?: any;
      headers?: any;
      body?: string | ArrayBuffer | Blob;
    }) => Promise<any>;
    drive: {
      files: {
        create: (params: {
          resource: DriveFileMetadata;
          media?: {
            mimeType: string;
            body: string | Blob;
          };
          fields: string;
        }) => Promise<DriveApiResponse>;
        list: (params: {
          q?: string;
          fields: string;
          pageSize?: number;
        }) => Promise<DriveListResponse>;
      };
    };
  };
};

export async function createFolder(
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  try {
    if (!name) {
      throw new Error("El nombre de la carpeta es requerido");
    }

    // Metadatos de la carpeta
    const fileMetadata: DriveFileMetadata = {
      name: name,
      mimeType: "application/vnd.google-apps.folder",
    };

    // Si se especifica una carpeta padre, agregarla a los metadatos
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    // Crear la carpeta
    const response = await gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: "id,name,parents,createdTime,modifiedTime",
    });

    return response.result;
  } catch (error) {
    console.error("Error al crear la carpeta:", error);
    throw new Error(
      `No se pudo crear la carpeta: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
}
export async function createFolderIfNotExists(
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  try {
    // Primero buscar si la carpeta ya existe
    const existingFolder = await findFolder(name, parentId);

    if (existingFolder) {
      return existingFolder;
    }

    // Si no existe, crearla
    return await createFolder(name, parentId);
  } catch (error) {
    console.error("Error en createFolderIfNotExists:", error);
    throw error;
  }
}
export async function findFolder(
  folderName: string,
  parentId?: string,
): Promise<DriveFile | null> {
  try {
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const response = await gapi.client.drive.files.list({
      q: query,
      fields: "files(id,name,parents,createdTime,modifiedTime)",
    });
    const folders = response.result.files;
    return folders.length > 0 ? folders[0] : null;
  } catch (error) {
    console.error("Error al buscar la carpeta:", error);
    throw new Error(
      `No se pudo buscar la carpeta: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
}
export async function uploadFileToDrive(
  fileBlob: Blob,
  fileName: string,
  folderId?: string,
): Promise<DriveFile> {
  try {
    if (!fileName) {
      throw new Error("El nombre del archivo es requerido");
    }
    const normalizedFileName = fileName.trim();
    const mimeType =
      fileBlob.type || getMimeTypeFromFileName(normalizedFileName);

    // Verificar que el blob no esté vacío
    if (fileBlob.size === 0) {
      throw new Error("El archivo está vacío");
    }

    // Metadatos del archivo
    const fileMetadata: DriveFileMetadata = {
      name: normalizedFileName,
      mimeType,
    };

    // Si se especifica una carpeta padre, agregarla a los metadatos
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    // Crear un nuevo Blob con el tipo MIME correcto solo si hace falta.
    const fileBlobWithCorrectType = new Blob([fileBlob], {
      type: mimeType,
    });

    // Crear boundary para multipart según especificación de Google
    const boundary = "-------314159265358979323846";

    // Preparar metadatos limpios
    const cleanMetadata: any = {
      name: normalizedFileName,
      mimeType,
    };

    if (folderId) {
      cleanMetadata.parents = [folderId];
    }

    // Convertir el blob a base64 para incluir en el multipart string
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.readAsDataURL(fileBlobWithCorrectType);
    });

    // Crear el cuerpo multipart como string según especificación RFC 2046
    const multipartBody = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(cleanMetadata),
      "",
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      "Content-Transfer-Encoding: base64",
      "",
      base64Data,
      `--${boundary}--`,
    ].join("\r\n");

    const response = await gapi.client.request({
      path: "https://www.googleapis.com/upload/drive/v3/files",
      method: "POST",
      params: {
        uploadType: "multipart",
        fields:
          "id,name,parents,createdTime,modifiedTime,webViewLink,webContentLink,mimeType",
      },
      headers: {
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
      body: multipartBody,
    });
    // Verificar que el archivo realmente se creó
    if (!response.result || !response.result.id) {
      throw new Error(
        "La respuesta de Google Drive no contiene información del archivo",
      );
    }
    return response.result;
  } catch (error) {
    console.error("❌ Error detallado en uploadFileToDrive:", error);
    console.error("📊 Información adicional:", {
      fileName,
      folderId,
      blobSize: fileBlob?.size,
      blobType: fileBlob?.type,
    });
    throw new Error(
      `No se pudo subir el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
}

export async function deleteFileFromDrive(fileIdOrUrl: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const fileId = getDriveFileId(fileIdOrUrl);

    await gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${fileId}`,
      method: "DELETE",
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error al eliminar el archivo de Drive:", error);

    return {
      success: false,
      error: `No se pudo eliminar el archivo de Drive: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}
