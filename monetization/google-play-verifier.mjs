import { createSign } from 'node:crypto';

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');

export async function verifyOneTimePurchase({ packageName, productId, purchaseToken, serviceAccount, fetchImpl = fetch }) {
  if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(packageName)) throw new Error('Invalid package name');
  if (!/^[a-zA-Z0-9_.]+$/.test(productId) || !purchaseToken || purchaseToken.length > 4096) throw new Error('Invalid purchase request');
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) throw new Error('Service account credentials required');
  const now = Math.floor(Date.now() / 1000);
  const signingInput = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: serviceAccount.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const signer = createSign('RSA-SHA256'); signer.update(signingInput); signer.end();
  const assertion = `${signingInput}.${signer.sign(serviceAccount.private_key).toString('base64url')}`;
  const oauth = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!oauth.ok) throw new Error(`Google OAuth failed (${oauth.status})`);
  const { access_token: accessToken } = await oauth.json();
  if (!accessToken) throw new Error('Google OAuth returned no token');
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/productsv2/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await fetchImpl(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Google Play purchase lookup failed (${response.status})`);
  const receipt = await response.json();
  const matching = receipt.productLineItem?.filter(item => item.productId === productId) ?? [];
  if (receipt.purchaseStateContext?.purchaseState !== 'PURCHASED' || matching.length !== 1 || receipt.productLineItem?.length !== 1) {
    throw new Error('Purchase not completed or product mismatch');
  }
  return { productId, orderId: receipt.orderId ?? null, acknowledgmentState: receipt.acknowledgementState ?? null };
}
