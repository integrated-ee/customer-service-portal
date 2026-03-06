import { ConfidentialClientApplication } from '@azure/msal-node';

const TENANT_ID = process.env.BC_TENANT_ID!;
const CLIENT_ID = process.env.BC_CLIENT_ID!;
const CLIENT_SECRET = process.env.BC_CLIENT_SECRET!;

export const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
  },
});

export async function acquireToken(scope: string): Promise<string> {
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: [scope],
  });
  if (!result) throw new Error(`Failed to acquire token for ${scope}`);
  return result.accessToken;
}
