# Simba Supermarket Demo

Simba is a multilingual e-commerce demo focused on grocery browsing, cart and checkout flow, and a market rep dashboard for order handling.

## Implemented features

- Product browsing with category pages, product detail pages, related products, and responsive product cards
- Search by product name, category, unit, and product description
- Polished empty states for cart, search results, category pages, and order confirmation
- Working cart flow:
  - add item
  - remove item
  - increase or decrease quantity
  - automatic subtotal, delivery fee, and total calculation
- Working checkout flow:
  - customer name
  - phone number
  - delivery location
  - payment method
  - Mobile Money option
  - order summary
  - confirmation page after order placement
- Working local order service using `localStorage`
- Market Rep dashboard with:
  - all customer orders
  - customer and order search
  - status filtering
  - full order details
  - persistent order status updates
- Multi-language UI for English, Kinyarwanda, French, Swahili, and Turkish
- Responsive buyer and dashboard layouts

## Checkout flow

1. The customer browses products and adds items to the cart.
2. The cart calculates:
   - subtotal
   - delivery fee
   - total
3. On checkout, the customer enters delivery details and chooses a payment method.
4. If `Mobile Money` is selected, a MoMo number is collected.
5. Clicking `Place order` validates stock and creates a saved order.
6. The app redirects to the confirmation page with the created order.

## How orders are stored

- If no real backend is connected, the app stores orders in `localStorage`.
- Orders are saved under a browser key managed by `src/lib/order-store.ts`.
- Stock is also persisted locally so order placement and dashboard changes feel realistic.
- Existing legacy local orders are migrated automatically to the current order shape.

## Market Rep dashboard

The Market Rep dashboard is available at `/dashboard`.

Each order shows:

- order ID
- customer name
- phone number
- delivery location
- items ordered
- total amount
- payment method
- current status
- date and time

Statuses supported:

- Pending
- Accepted
- Preparing
- Out for Delivery
- Delivered
- Cancelled

Status updates are saved in `localStorage`, so refreshing the page does not reset them.

## Demo backend note

This project supports Supabase when configured, but the order workflow does not depend on an external backend for demo use.

If Supabase is not connected:

- checkout still works
- orders are still created
- dashboard still updates orders
- persistence is handled with `localStorage`

This acts as the demo backend for grading and offline evaluation.

## Run the project

```sh
npm install
npm run build
npm run dev
```

## Optional backend setup

The app can use Supabase when environment variables are configured. To enable that path:

1. Run `supabase/schema.sql` in your Supabase SQL editor.
2. Copy `.env.example` to `.env.local`.
3. Fill in the Supabase and Google values.
4. Seed products and branch inventory:

```sh
npm run backend:seed
```

See `supabase/README.md` for the full Supabase setup.
