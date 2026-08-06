type GoogleAccessToken = {
  access_token: string;
  expires_in: number;
  created_at: number;
  [key: string]: unknown;
};

export type SheetCellValue = string | number | boolean | null;
export type SheetRows = SheetCellValue[][];

type GoogleApiErrorDetail = {
  code?: number;
  message?: string;
  status?: string;
};

type GoogleApiError = {
  status?: number;
  result?: {
    error?: GoogleApiErrorDetail;
  };
};

type ProcessedGoogleApiError = {
  code: number;
  message: string;
  status: string;
  raw: any;
};

type BatchGetResponse = {
  status: number;
  result: {
    valueRanges?: Array<{
      values?: SheetRows;
    }>;
  };
};

type GetAllSheetsSuccess = {
  data: SheetRows[] | undefined;
  error: null;
  status: number;
};

type GetAllSheetsFailure = {
  data: null;
  error: ProcessedGoogleApiError;
  status: number;
};
// Lo que devuelve Google tras un batchUpdate de valores
export interface GoogleBatchUpdateResponse {
  spreadsheetId: string;
  totalUpdatedRows: number;
  totalUpdatedColumns: number;
  totalUpdatedCells: number;
  totalUpdatedSheets: number;
  responses: Array<{
    spreadsheetId: string;
    updatedRange: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
  }>;
}

export interface BatchUpdateResult {
  data: GoogleBatchUpdateResponse | null;
  error: ProcessedGoogleApiError | null;
  status: number;
}
export interface GoogleAppendResponse {
  status: number;
  result: {
    spreadsheetId: string;
    tableRange: string;
    updates: {
      spreadsheetId: string;
      updatedRange: string;
      updatedRows: number;
      updatedColumns: number;
      updatedCells: number;
      // updatedData puede venir si includeValuesInResponse es true
      updatedData?: {
        range: string;
        majorDimension: string;
        values: any[][];
      };
    };
  };
}
export interface InsertDataResult {
  data: GoogleAppendResponse["result"] | null;
  error: ProcessedGoogleApiError | null;
  status: number;
}
export type GetAllSheetsResult = GetAllSheetsSuccess | GetAllSheetsFailure;

declare const gapi: {
  load: (name: "client", callback: () => void) => void;
  client: {
    init: (config: {
      apiKey: string;
      discoveryDocs: string[];
    }) => Promise<void>;
    getToken: () => GoogleAccessToken | null;
    setToken: (token: GoogleAccessToken | null) => void;
    sheets: {
      spreadsheets: {
        values: {
          batchGet: (params: {
            spreadsheetId: string;
            dateTimeRenderOption: string;
            majorDimension: string;
            ranges: string[];
            valueRenderOption: string;
          }) => Promise<BatchGetResponse>;
          append: (params: {
            spreadsheetId: string;
            range: string;
            includeValuesInResponse: boolean;
            insertDataOption: string;
            responseDateTimeRenderOption: string;
            responseValueRenderOption: string;
            valueInputOption: string;

            resource: {
              majorDimension: string;
              values: any[];
            };
          }) => Promise<GoogleAppendResponse>;
          // ... dentro de values:
          batchUpdate: (params: {
            spreadsheetId: string;
            resource: {
              valueInputOption: string;
              data: { range: string; values: any[][] }[];
            };
          }) => Promise<{ status: number; result: GoogleBatchUpdateResponse }>; // Agregamos el envoltorio result
        };
      };
    };
  };
};

export const getAllSheets = async (
  spreadsheetId: string,
  ranges: string[],
): Promise<GetAllSheetsResult> => {
  try {
    const respuesta = await gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      dateTimeRenderOption: "FORMATTED_STRING",
      majorDimension: "ROWS",
      ranges: ranges,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const dataRange = respuesta.result.valueRanges?.map((range) => range.values || [])
    return {
      data: dataRange,
      error: null,
      status: respuesta.status,
    };
  } catch (err: unknown) {
    // Extraemos la información útil del error de Google
    const googleError = err as GoogleApiError;
    const errorDetail = googleError.result?.error || {};

    const processedError: ProcessedGoogleApiError = {
      code: errorDetail.code || googleError.status || 500,
      message: errorDetail.message || "Error desconocido en la API",
      status: errorDetail.status || "UNKNOWN",
      raw: err,
    };

    console.error("Error procesado:", processedError);

    return {
      data: null,
      error: processedError,
      status: processedError.code,
    };
  }
};
export const insertDataToSheet = async (
  spreadsheetId: string,
  range: string,
  values: any[],
): Promise<InsertDataResult> => {
  try {
    // La respuesta de gapi.client es de tipo 'gapi.client.Response<gapi.client.sheets.AppendValuesResponse>'
    const respuesta = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      includeValuesInResponse: true,
      insertDataOption: "INSERT_ROWS",
      responseDateTimeRenderOption: "FORMATTED_STRING",
      responseValueRenderOption: "FORMATTED_VALUE",
      valueInputOption: "USER_ENTERED",
      resource: {
        majorDimension: "ROWS",
        values: [values],
      },
    });

    return {
      data: respuesta.result,
      error: null,
      status: respuesta.status,
    };
  } catch (err: unknown) {
    const googleError = err as GoogleApiError;
    const errorDetail = googleError.result?.error || {};

    const processedError: ProcessedGoogleApiError = {
      code: errorDetail.code || googleError.status || 500,
      message: errorDetail.message || "Error al insertar datos en la API",
      status: errorDetail.status || "UNKNOWN",
      raw: err,
    };

    console.error("Error en inserción procesado:", processedError);

    return {
      data: null,
      error: processedError,
      status: processedError.code as number, // Forzamos a número para coherencia
    };
  }
};
export const insertManyDataToSheet = async (
  spreadsheetId: string,
  range: string,
  values: any[][],
): Promise<InsertDataResult> => {
  try {
    // La respuesta de gapi.client es de tipo 'gapi.client.Response<gapi.client.sheets.AppendValuesResponse>'
    const respuesta = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      includeValuesInResponse: true,
      insertDataOption: "INSERT_ROWS",
      responseDateTimeRenderOption: "FORMATTED_STRING",
      responseValueRenderOption: "FORMATTED_VALUE",
      valueInputOption: "USER_ENTERED",
      resource: {
        majorDimension: "ROWS",
        values: values,
      },
    });

    return {
      data: respuesta.result,
      error: null,
      status: respuesta.status,
    };
  } catch (err: unknown) {
    const googleError = err as GoogleApiError;
    const errorDetail = googleError.result?.error || {};

    const processedError: ProcessedGoogleApiError = {
      code: errorDetail.code || googleError.status || 500,
      message: errorDetail.message || "Error al insertar datos en la API",
      status: errorDetail.status || "UNKNOWN",
      raw: err,
    };

    console.error("Error en inserción procesado:", processedError);

    return {
      data: null,
      error: processedError,
      status: processedError.code as number, // Forzamos a número para coherencia
    };
  }
};
export const updateManySheets = async (
  spreadsheetId: string,
  updates: { range: string; values: any[][] }[],
): Promise<BatchUpdateResult> => {
  try {
    const respuesta = await gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });

    return {
      data: respuesta.result, // Ahora TS sabe que result existe
      error: null,
      status: respuesta.status,
    };
  } catch (err: unknown) {
    // ... (el resto del catch se queda igual)
    const googleError = err as GoogleApiError;
    const errorDetail = googleError.result?.error || {};

    const processedError: ProcessedGoogleApiError = {
      code: errorDetail.code || googleError.status || 500,
      message: errorDetail.message || "Error en la actualización masiva",
      status: errorDetail.status || "UNKNOWN",
      raw: err,
    };

    return {
      data: null,
      error: processedError,
      status: processedError.code as number,
    };
  }
};
