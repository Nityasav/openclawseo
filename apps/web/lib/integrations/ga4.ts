import { google } from "googleapis";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics.edit",
];

export function createGA4OAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID ?? "",
    process.env.GOOGLE_CLIENT_SECRET ?? "",
    process.env.GA4_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1/integrations/ga4/callback`
  );
}

export function getGa4AuthUrl(): string {
  const oauth2Client = createGA4OAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: "ga4",
    include_granted_scopes: true,
  });
}

export async function exchangeGA4CodeForTokens(code: string) {
  const oauth2Client = createGA4OAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function listGA4Properties(accessToken: string, refreshToken: string) {
  const oauth2Client = createGA4OAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth: oauth2Client });
  const response = await analyticsAdmin.accounts.list();
  const accounts = response.data.accounts ?? [];

  const properties: Array<{ propertyId: string; displayName: string; account: string }> = [];
  for (const account of accounts) {
    const propsResponse = await analyticsAdmin.properties.list({
      filter: `parent:${account.name}`,
    });
    for (const prop of propsResponse.data.properties ?? []) {
      properties.push({
        propertyId: prop.name?.replace("properties/", "") ?? "",
        displayName: prop.displayName ?? "",
        account: account.displayName ?? "",
      });
    }
  }

  return properties;
}

export async function fetchGA4Data(
  accessToken: string,
  refreshToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const analyticsDataClient = new BetaAnalyticsDataClient({
    authClient: {
      getAccessToken: async () => ({ token: accessToken }),
    } as never,
  });

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: "date" },
      { name: "pagePath" },
      { name: "sessionSource" },
    ],
    metrics: [
      { name: "sessions" },
      { name: "bounceRate" },
      { name: "conversions" },
    ],
  });

  return response.rows ?? [];
}
