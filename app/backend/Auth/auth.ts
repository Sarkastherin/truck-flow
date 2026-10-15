import { setSessionStatus } from "~/utils/authEvents";

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

const SILENT_REFRESH_TIMEOUT_MS = 6000;
const USERINFO_TIMEOUT_MS = 5000;
const REFRESH_RETRY_DELAYS_MS = [0, 2000, 5000];

let tokenClient: TokenClient | null = null;
let gapiInited = false;
let gisInited = false;
let tokenMonitorInterval: ReturnType<typeof setInterval> | null = null;
let onTokenRefreshCallback: AuthOptions["onTokenRefresh"] | null = null;
let visibilityHandlerAttached = false;
let gapiInitPromise: Promise<void> | null = null;
let gisInitPromise: Promise<void> | null = null;
let activeRefreshCycle: Promise<boolean> | null = null;

function gapiLoaded(apiKey: string): Promise<void> {
  if (!gapiInitPromise) {
    gapiInitPromise = new Promise((resolve) => {
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
  return gapiInitPromise;
}

function gisLoaded(clientId: string): Promise<void> {
  if (!gisInitPromise) {
    gisInitPromise = new Promise((resolve) => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: "",
      });
      gisInited = true;
      resolve();
    });
  }
  return gisInitPromise;
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

function requestToken(
  prompt: "" | "consent",
  timeoutMs?: number,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!tokenClient || !gapiInited || !gisInited) {
      reject(new Error("Cliente no inicializado"));
      return;
    }

    let settled = false;
    const timer = timeoutMs
      ? setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("Timeout solicitando token de acceso"));
          }
        }, timeoutMs)
      : null;

    tokenClient.callback = async (response: TokenClientResponse) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);

      if (response.error !== undefined) {
        console.error("Error obteniendo token:", response.error);
        reject(new Error(String(response.error)));
        return;
      }

      const responseToken = response as unknown as GoogleAccessToken;
      const token = responseToken.access_token
        ? responseToken
        : gapi.client.getToken();
      if (!token || !token.access_token) {
        reject(new Error("No se pudo obtener el token"));
        return;
      }

      token.created_at = Date.now();
      gapi.client.setToken(token);
      localStorage.setItem("google_auth_token", JSON.stringify(token));
      setSessionStatus("valid");

      if (onTokenRefreshCallback) {
        onTokenRefreshCallback(token);
      }

      resolve(true);
    };

    tokenClient.requestAccessToken({ prompt });
  });
}

async function refreshTokenSilently(): Promise<boolean> {
  return requestToken("", SILENT_REFRESH_TIMEOUT_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runRefreshCycle(): Promise<boolean> {
  if (activeRefreshCycle) return activeRefreshCycle;

  activeRefreshCycle = (async () => {
    setSessionStatus("refreshing");
    try {
      for (const delay of REFRESH_RETRY_DELAYS_MS) {
        if (delay > 0) await sleep(delay);
        try {
          await refreshTokenSilently();
          return true;
        } catch (error) {
          console.warn("Renovación silenciosa fallida, reintentando...", error);
        }
      }
      return false;
    } finally {
      activeRefreshCycle = null;
    }
  })();

  return activeRefreshCycle;
}

async function resolveCycleOutcome(ok: boolean): Promise<boolean> {
  if (ok) {
    console.log("Token renovado automáticamente");
    return true;
  }

  const currentToken = readStoredToken();
  if (currentToken && isTokenValid(currentToken)) {
    setSessionStatus("valid");
    return true;
  }

  console.error(
    "No se pudo renovar el token y ya expiró; la sesión está caída.",
  );
  setSessionStatus("expired");
  return false;
}

async function refreshIfNeeded(): Promise<void> {
  const savedToken = readStoredToken();
  if (!savedToken || !needsTokenRefresh(savedToken)) return;

  console.log("Token necesita renovación, renovando automáticamente...");
  const ok = await runRefreshCycle();
  await resolveCycleOutcome(ok);
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "visible") {
    void refreshIfNeeded();
  }
}

function startTokenMonitoring(): void {
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
  }

  tokenMonitorInterval = setInterval(refreshIfNeeded, 5 * 60 * 1000);

  if (!visibilityHandlerAttached) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshIfNeeded);
    visibilityHandlerAttached = true;
  }
}

function stopTokenMonitoring(): void {
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
    tokenMonitorInterval = null;
  }

  if (visibilityHandlerAttached) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", refreshIfNeeded);
    visibilityHandlerAttached = false;
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

async function handleAuthClick(): Promise<boolean> {
  if (!gapiInited || !gisInited || !tokenClient) {
    throw new Error("Cliente no inicializado");
  }

  const parsedToken = readStoredToken();
  if (parsedToken) {
    gapi.client.setToken(parsedToken);

    if (isTokenValid(parsedToken)) {
      return true;
    }
  }

  // 1er intento: silencioso (sin popup) si hay sesión de Google y consent previo.
  try {
    await requestToken("", SILENT_REFRESH_TIMEOUT_MS);
    return true;
  } catch (silentError) {
    console.warn(
      "Renovación silenciosa no disponible, solicitando consentimiento...",
      silentError,
    );
  }

  // Fallback: popup de consentimiento (solo primera vez o sesión de Google caída).
  await requestToken("consent");
  return true;
}

async function getUserEmail(): Promise<string | null> {
  try {
    const accessToken = gapi.client.getToken()?.access_token;
    if (!accessToken) {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), USERINFO_TIMEOUT_MS);

    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { email?: string };
      return data.email ?? null;
    } finally {
      clearTimeout(timer);
    }
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
      setSessionStatus("valid");
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
    setSessionStatus("checking");

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

const renewSession = async (): Promise<boolean> => {
  try {
    const ok = await runRefreshCycle();
    if (ok) {
      console.log("Sesión renovada por el usuario");
      return true;
    }
    console.error("No se pudo renovar la sesión de forma silenciosa");
    setSessionStatus("expired");
    return false;
  } catch (error) {
    console.error("Error renovando la sesión:", error);
    setSessionStatus("expired");
    return false;
  }
};

const forceTokenRefresh = async (): Promise<boolean> => renewSession();

export default Auth;
export {
  Logout,
  checkTokenStatus,
  forceTokenRefresh,
  renewSession,
  getUserEmail,
};
