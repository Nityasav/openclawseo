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

async function getAuthedClient(accessToken: string, refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });
  if (refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    } catch {
      // use existing token
    }
  }
  return oauth2Client;
}

export async function fetchGscData(
  accessToken: string,
  refreshToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  options?: { dimensions?: string[]; rowLimit?: number; searchType?: string }
) {
  const oauth2Client = await getAuthedClient(accessToken, refreshToken);
  const searchconsole = google.searchconsole({ version: "v1", auth: oauth2Client });

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: options?.dimensions ?? ["query", "page"],
      rowLimit: options?.rowLimit ?? 1000,
      type: (options?.searchType ?? "web") as "web",
    },
  });

  return response.data.rows ?? [];
}

export async function fetchGscFull(
  accessToken: string,
  refreshToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<GscFullData> {
  const oauth2Client = await getAuthedClient(accessToken, refreshToken);
  const searchconsole = google.searchconsole({ version: "v1", auth: oauth2Client });

  // Run all fetches in parallel
  const [queryRows, pageRows, deviceRows, countryRows, queryPageRows, dateTrendRows] = await Promise.all([
    // Queries
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ["query"], rowLimit: 2500, type: "web" },
    }),
    // Pages
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 1000, type: "web" },
    }),
    // Device breakdown
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ["device"], rowLimit: 10, type: "web" },
    }),
    // Country breakdown (top 50)
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ["country"], rowLimit: 50, type: "web" },
    }),
    // Query + page combined (top 500)
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ["query", "page"], rowLimit: 500, type: "web" },
    }),
    // Date trend (daily)
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ["date"], rowLimit: 90, type: "web" },
    }),
  ]);

  return {
    queries: queryRows.data.rows ?? [],
    pages: pageRows.data.rows ?? [],
    devices: deviceRows.data.rows ?? [],
    countries: countryRows.data.rows ?? [],
    queryPages: queryPageRows.data.rows ?? [],
    dateTrend: dateTrendRows.data.rows ?? [],
  };
}

export interface GscFullData {
  queries: GscRow[];
  pages: GscRow[];
  devices: GscRow[];
  countries: GscRow[];
  queryPages: GscRow[];
  dateTrend: GscRow[];
}

export interface GscRow {
  keys?: (string | null)[] | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
}

export async function listGscSites(accessToken: string, refreshToken: string) {
  const oauth2Client = await getAuthedClient(accessToken, refreshToken);
  const searchconsole = google.searchconsole({ version: "v1", auth: oauth2Client });
  const response = await searchconsole.sites.list();
  return response.data.siteEntry ?? [];
}
