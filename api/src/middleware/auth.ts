import { HttpResponseInit } from '@azure/functions';
import * as jose from 'jose';
import { UserInfo } from '../types/index.js';

const TENANT_ID = process.env.ENTRA_TENANT_ID!;
const CLIENT_ID = process.env.ENTRA_CLIENT_ID!;
const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID!;

let jwks: ReturnType<typeof jose.createRemoteJWKSet>;

function getJwks() {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`)
    );
  }
  return jwks;
}

export async function authenticateRequest(authHeader: string | null): Promise<UserInfo | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);

  try {
    const { payload } = await jose.jwtVerify(token, getJwks(), {
      issuer: [
        `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
        `https://sts.windows.net/${TENANT_ID}/`,
      ],
      audience: [CLIENT_ID, `api://${CLIENT_ID}`],
    });

    const groups = (payload.groups as string[]) || [];
    const isAdmin = groups.includes(ADMIN_GROUP_ID);

    return {
      email: (payload.preferred_username as string) || (payload.email as string) || '',
      name: (payload.name as string) || '',
      isAdmin,
    };
  } catch (err) {
    console.error('Auth error:', err);
    // Decode token to inspect claims without verification
    try {
      const parts = token.split('.');
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      console.error('Token aud:', claims.aud, 'iss:', claims.iss, 'expected aud:', `api://${CLIENT_ID}`);
    } catch { /* ignore decode errors */ }
    return null;
  }
}

export function unauthorizedResponse(): HttpResponseInit {
  return { status: 401, jsonBody: { error: 'Unauthorized' } };
}
