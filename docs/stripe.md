# Stripe Integration

This project implements Stripe Checkout for payments.

## Required environment variables
- STRIPE_SECRET_KEY - your Stripe secret key (test key: starts with `sk_test_...`)
- STRIPE_WEBHOOK_SECRET - the signing secret for your webhook endpoint (from the Stripe dashboard or Stripe CLI)
- NEXT_PUBLIC_SITE_URL - e.g. `https://your-site.com` or `http://localhost:3000`
- NEXT_PUBLIC_CURRENCY_CODE - optional, defaults to `usd`

## Install
Run:

```
npm install
```

(We added `stripe` to `package.json`. Run the above to install it.)

## How the flow works
1. Client calls `POST /api/stripe/checkout` with { addressId, items, couponCode }.
2. Server creates DB order(s) with `paymentMethod: 'STRIPE'` and `isPaid: false` then creates a Stripe Checkout session and returns the `session.url` to the client.
3. Client redirects user to Stripe Checkout.
4. On successful payment, Stripe sends a webhook to `/api/stripe/webhook`, which verifies the signature and marks the associated Order(s) as `isPaid: true` using the `orderIds` stored in the session metadata.

## Testing webhooks locally with Stripe CLI
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward events to your local webhook:

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Use a test card in Stripe Checkout (e.g., `4242 4242 4242 4242`).

## Notes
- The webhook verification requires `STRIPE_WEBHOOK_SECRET` which is displayed by the Stripe CLI when listening or available in the Dashboard for your webhook endpoint.
- You may want to add more robust error handling and logging in production.
