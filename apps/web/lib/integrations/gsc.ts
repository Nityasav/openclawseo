import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID ?? "",
    process.env.GOOGLE_CLIENT_SECRET ?? "",
    process.env.GOOGLE_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1/integrations/gsc/callback`
  );
}

export function getGscAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function fetchGscData(
  accessToken: string,
  refreshToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const searchconsole = google.searchconsole({ version: "v1", auth: oauth2Client });

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 500,
    },
  });

  return response.data.rows ?? [];
}

export async function listGscSites(accessToken: string, refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });

  // Auto-refresh token if needed
  if (refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    } catch {
      // If refresh fails, use existing access token
    }
  }

  const searchconsole = google.searchconsole({ version: "v1", auth: oauth2Client });
  const response = await searchconsole.sites.list();
  return response.data.siteEntry ?? [];
}
