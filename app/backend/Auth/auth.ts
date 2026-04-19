const SCOPES =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";
const DISCOVERY_DOC_GMAIL =
  "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest";
const DISCOVERY_DOC_SHEET =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";
const DISCOVERY_DOC_DRIVE =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

type GoogleAccessToken = {
  access_token: string;
  expires_in: number;
  created_at: number;
  [key: string]: unknown;
};

type TokenClientResponse = {
  error?: unknown;
};

type TokenClient = {
  callback: "" | ((response: TokenClientResponse) => void | Promise<void>);
  requestAccessToken: (options: { prompt: "" | "consent" }) => void;
};

type AuthOptions = {
  onTokenRefresh?: (token: GoogleAccessToken) => void;
  autoRefresh?: boolean;
};

export type AuthResult = {
  success: boolean;
  email: string | null;
  error: string | null;
};

export type TokenStatus = {
  valid: boolean;
  needsRefresh: boolean;
  timeUntilExpiry: number;
  token?: GoogleAccessToken;
};

declare const gapi: {
  load: (name: "client", callback: () => void) => void;
  client: {
    init: (config: {
      apiKey: string;
      discoveryDocs: string[];
    }) => Promise<void>;
    getToken: () => GoogleAccessToken | null;
    setToken: (token: GoogleAccessToken | null) => void;
  };
};

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback:
          | ""
          | ((response: TokenClientResponse) => void | Promise<void>);
      }) => TokenClient;
    };
  };
};

let tokenClient: TokenClient | null = null;
let gapiInited = false;
let gisInited = false;
let tokenMonitorInterval: ReturnType<typeof setInterval> | null = null;
let onTokenRefreshCallback: AuthOptions["onTokenRefresh"] | null = null;

function gapiLoaded(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey,
        discoveryDocs: [
          DISCOVERY_DOC_GMAIL,
          DISCOVERY_DOC_SHEET,
          DISCOVERY_DOC_DRIVE,
        ],
      });
      gapiInited = true;
      resolve();
    });
  });
}

function gisLoaded(clientId: string): Promise<void> {
  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: "",
    });
    gisInited = true;
    resolve();
  });
}

function isTokenValid(token: GoogleAccessToken | null): boolean {
  if (!token || !token.expires_in || !token.created_at) {
    return false;
  }

  const expiresInMs = token.expires_in * 1000;
  const expiresAt = token.created_at + expiresInMs;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return expiresAt - now > fiveMinutes;
}

function needsTokenRefresh(token: GoogleAccessToken | null): boolean {
  if (!token || !token.expires_in || !token.created_at) {
    return true;
  }

  const expiresInMs = token.expires_in * 1000;
  const expiresAt = token.created_at + expiresInMs;
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  return expiresAt - now <= tenMinutes;
}

async function refreshTokenSilently(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!tokenClient || !gapiInited || !gisInited) {
      reject(new Error("Cliente no inicializado"));
      return;
    }

    tokenClient.callback = async (response: TokenClientResponse) => {
      if (response.error !== undefined) {
        console.error("Error renovando token:", response.error);
        reject(response.error);
        return;
      }

      const token = gapi.client.getToken();
      if (!token) {
        reject(new Error("No se pudo obtener el token renovado"));
        return;
      }

      token.created_at = Date.now();
      localStorage.setItem("google_auth_token", JSON.stringify(token));

      if (onTokenRefreshCallback) {
        onTokenRefreshCallback(token);
      }

      console.log("Token renovado automáticamente");
      resolve(true);
    };

    tokenClient.requestAccessToken({ prompt: "" });
  });
}

function startTokenMonitoring(): void {
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
  }

  tokenMonitorInterval = setInterval(
    async () => {
      try {
        const savedToken = readStoredToken();
        if (savedToken && needsTokenRefresh(savedToken)) {
          console.log(
            "Token necesita renovación, renovando automáticamente...",
          );
          await refreshTokenSilently();
        }
      } catch (error) {
        console.error("Error en el monitoreo automático del token:", error);
      }
    },
    5 * 60 * 1000,
  );
}

function stopTokenMonitoring(): void {
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
    tokenMonitorInterval = null;
  }
}

function readStoredToken(): GoogleAccessToken | null {
  const savedToken = localStorage.getItem("google_auth_token");
  if (!savedToken) {
    return null;
  }

  try {
    return JSON.parse(savedToken) as GoogleAccessToken;
  } catch {
    localStorage.removeItem("google_auth_token");
    return null;
  }
}

function checkExistingAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    const parsedToken = readStoredToken();
    if (parsedToken && isTokenValid(parsedToken)) {
      gapi.client.setToken(parsedToken);
      resolve(true);
      return;
    }

    resolve(false);
  });
}

function handleAuthClick(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!gapiInited || !gisInited || !tokenClient) {
      reject(new Error("Cliente no inicializado"));
      return;
    }

    tokenClient.callback = async (response: TokenClientResponse) => {
      if (response.error !== undefined) {
        reject(response.error);
        return;
      }

      const token = gapi.client.getToken();
      if (token) {
        token.created_at = Date.now();
        localStorage.setItem("google_auth_token", JSON.stringify(token));
      }
      resolve(true);
    };

    const parsedToken = readStoredToken();
    if (parsedToken) {
      gapi.client.setToken(parsedToken);

      if (isTokenValid(parsedToken)) {
        resolve(true);
        return;
      }
    }

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

async function getUserEmail(): Promise<string | null> {
  try {
    const accessToken = gapi.client.getToken()?.access_token;
    if (!accessToken) {
      return null;
    }

    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { email?: string };
    return data.email ?? null;
  } catch (error) {
    console.error("Error al obtener el email:", error);
    return null;
  }
}

const Auth = async (
  apiKey: string,
  clientId: string,
  options: AuthOptions = {},
): Promise<AuthResult> => {
  try {
    const gapi = await gapiLoaded(apiKey);
    const gis = await gisLoaded(clientId);

    if (typeof options.onTokenRefresh === "function") {
      onTokenRefreshCallback = options.onTokenRefresh;
    }

    const existingAuth = await checkExistingAuth();
    if (existingAuth) {
      if (options.autoRefresh !== false) {
        startTokenMonitoring();
      }
      const email = await getUserEmail();
      return { success: true, email, error: null };
    }

    const authResult = await handleAuthClick();
    if (authResult) {
      if (options.autoRefresh !== false) {
        startTokenMonitoring();
      }
      const email = await getUserEmail();
      return { success: true, email, error: null };
    }

    return {
      success: false,
      email: null,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      email: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const Logout = (): boolean => {
  try {
    stopTokenMonitoring();
    onTokenRefreshCallback = null;

    if (typeof gapi !== "undefined" && gapi.client) {
      gapi.client.setToken(null);
    }

    localStorage.removeItem("google_auth_token");

    return true;
  } catch (error) {
    console.error("Error during logout", error);
    return false;
  }
};

const checkTokenStatus = (): TokenStatus => {
  try {
    const parsedToken = readStoredToken();
    if (!parsedToken) {
      return { valid: false, needsRefresh: true, timeUntilExpiry: 0 };
    }

    const valid = isTokenValid(parsedToken);
    const needsRefresh = needsTokenRefresh(parsedToken);

    let timeUntilExpiry = 0;
    if (parsedToken.expires_in && parsedToken.created_at) {
      const expiresAt = parsedToken.created_at + parsedToken.expires_in * 1000;
      timeUntilExpiry = Math.max(0, expiresAt - Date.now());
    }

    return {
      valid,
      needsRefresh,
      timeUntilExpiry,
      token: parsedToken,
    };
  } catch (error) {
    console.error("Error checking token status:", error);
    return { valid: false, needsRefresh: true, timeUntilExpiry: 0 };
  }
};

const forceTokenRefresh = async (): Promise<boolean> => {
  try {
    await refreshTokenSilently();
    return true;
  } catch (error) {
    console.error("Error forzando renovación del token:", error);
    return false;
  }
};

export default Auth;
export { Logout, checkTokenStatus, forceTokenRefresh };
