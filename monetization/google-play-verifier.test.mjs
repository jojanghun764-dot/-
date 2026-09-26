import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { test } from 'node:test';
import { verifyOneTimePurchase } from './google-play-verifier.mjs';

const privateKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
const args = { packageName: 'com.sproutexpedition.game', productId: 'sprout_starter_01', purchaseToken: 'example-token', serviceAccount: { client_email: 'test@example.iam.gserviceaccount.com', private_key: privateKey } };
const mock = receipt => async (url, options) => {
  if (url.includes('oauth2.googleapis.com')) return { ok: true, json: async () => ({ access_token: 'fake' }) };
  assert.equal(options.headers.authorization, 'Bearer fake');
  assert.match(url, /purchases\/productsv2\/tokens\/example-token$/);
  return { ok: true, json: async () => receipt };
};

test('accepts only a completed exact product', async () => {
  const result = await verifyOneTimePurchase({ ...args, fetchImpl: mock({ purchaseStateContext: { purchaseState: 'PURCHASED' }, productLineItem: [{ productId: args.productId }], orderId: 'order' }) });
  assert.equal(result.orderId, 'order');
});
test('rejects pending and mismatched purchases', async () => {
  for (const [state, productId] of [['PENDING', args.productId], ['PURCHASED', 'another_product']]) {
    await assert.rejects(verifyOneTimePurchase({ ...args, fetchImpl: mock({ purchaseStateContext: { purchaseState: state }, productLineItem: [{ productId }] }) }), /not completed or product mismatch/);
  }
});
