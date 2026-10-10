const assert = require('node:assert/strict');
const { moduleAt } = require('./test-makkhan-pass2.cjs');
const product = moduleAt('lib/gigcard/purchase.ts', {});
assert.equal(product.GIGCARD_PRICE_PAISE, 9900);

async function main() {
  for (const scenario of ['paused', 'invalid-order', 'cancel', 'failed', 'mismatch', 'unverified', 'verified']) {
    let opened = 0, requests = [], scripts = 0;
    class Checkout {
      constructor(options) { this.options = options }
      on(name, callback) { this.failed = callback }
      open() {
        opened++;
        if (scenario === 'cancel') return this.options.modal.ondismiss();
        if (scenario === 'failed') return this.failed();
        void this.options.handler({ razorpay_order_id: scenario === 'mismatch' ? 'order_wrong' : 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: 'fixture-only' });
      }
    }
    const client = moduleAt('lib/gigcard/checkout-client.ts', { './purchase': product }, {
      window: { Razorpay: Checkout },
      document: { createElement() { scripts++; throw Error('must not load provider script') } },
      fetch: async (url, options) => {
        assert.equal(url, '/api/gigcard/checkout');
        const body = JSON.parse(options.body); requests.push(body);
        if (scenario === 'paused') return Response.json({ error: 'Payments paused' }, { status: 503 });
        if (body.operation === 'create') return Response.json({ order_id: 'order_test', key_id: 'rzp_test_fixture', amount: scenario === 'invalid-order' ? 1 : 9900, currency: 'INR', card_id: 'card_fixture' });
        return Response.json({ verified: scenario === 'verified', card_id: 'card_fixture' });
      },
    });
    if (scenario === 'verified') assert.equal(await client.beginCardCheckout('png','card_fixture'), 'verified');
    else if (scenario === 'cancel') assert.equal(await client.beginCardCheckout('share','card_fixture'), 'cancelled');
    else await assert.rejects(client.beginCardCheckout('pdf','card_fixture'));
    if (['paused', 'invalid-order'].includes(scenario)) assert.equal(opened, 0);
    if (scenario === 'mismatch') assert.equal(requests.length, 1);
    assert.equal(scripts, 0);
    assert.ok(requests.every(body => !('amount' in body)), 'client must not set purchase price');
  }
  console.log('PASS GigCard checkout pause, fixed-price order validation, cancellation/failure, order mismatch and server verification requirement. No real provider calls.');
}
main().catch(error => { console.error(error); process.exitCode = 1 });
