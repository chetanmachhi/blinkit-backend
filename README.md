# Blinkit Backend (modular monolith)

One repo, one `npm install`, one process, one port, one deploy, with each
domain kept in its own folder so it can be split into a microservice later.

```
src/
├── server.ts            # Monolith entry: boots every module on one port
├── app.ts               # Mounts the modules (order matters, see comments)
├── config/env.ts        # Platform config (PORT, MONGO_URI, CORS)
├── shared/              # Models, enums, utils, middlewares, HTTP bootstrap
│                        #   (formerly the separate shared-models package)
└── modules/
    ├── customer/        # /api/*              -> customer-app
    ├── store/           # /api/v1/store/*     -> store-web (store admin panel)
    └── delivery/        # /api/v1/delivery/*  -> delivery-app (riders)
```

Rules that keep the split cheap:

- A module imports only from `../../shared` and from its own folder, never from another module.
- Each module has its own `config/env.ts`, `index.ts` (router + base path), `app.ts` and `server.ts`.
- `shared/` is the only common code. When splitting, copy it along (or publish it as a package).

## Run

```bash
npm install
npm run dev            # everything on PORT (default 3000)
```

Health check: `GET /health` lists the mounted modules.

### Run one module on its own (the future microservice)

```bash
npm run dev:customer   # uses CUSTOMER_PORT or PORT
npm run dev:store      # uses STORE_PORT or PORT
npm run dev:delivery   # uses DELIVERY_PORT or PORT
```

### Split a module out later

1. Copy `src/modules/<name>` plus `src/shared` into a new repo.
2. Use `src/modules/<name>/server.ts` as that repo's entry point.
3. Delete the module from `src/app.ts` here.

## Seeds

```bash
npm run seed           # store + catalog + admin (customer module)
npm run seed:store     # store owner/staff logins for store-web
npm run seed:demo      # historical demo orders
npm run seed:riders    # demo riders (also created automatically on boot)
```

Demo riders (`SEED_DEMO_RIDERS=true`): phones `9000000001` and `9000000002`,
with the password from `DEMO_RIDER_PASSWORD` (default `Rider@123`).

## Delivery flow

1. Customer places an order (customer-app).
2. Store accepts it, and optionally marks it packing (store-web).
3. The rider sees it under **New**, taps **Accept**, and the order is assigned to that rider.
   - Or the store assigns a rider: `POST /api/v1/store/orders/:orderId/assign-rider { riderId }`
     (rider list: `GET /api/v1/store/riders`).
4. Rider taps **Picked up**: the status becomes `out_for_delivery`.
5. Rider taps **Delivered**: the status becomes `delivered`, and cash-on-delivery orders are marked paid.

### Delivery API (`/api/v1/delivery`)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{ phone, password }` returns `{ accessToken, rider }` |
| GET | `/me` | rider profile |
| PATCH | `/me/availability` | `{ isOnline }` |
| GET | `/me/summary` | today's deliveries and cash collected |
| GET | `/orders/available` | accepted orders with no rider |
| GET | `/orders/active` | my in-progress orders |
| GET | `/orders/history` | my delivered/cancelled orders |
| GET | `/orders/:orderId` | detail (mine or still open) |
| POST | `/orders/:orderId/accept` | self-assign (atomic, first rider wins) |
| POST | `/orders/:orderId/release` | give back before pickup |
| POST | `/orders/:orderId/pickup` | sets status to out_for_delivery |
| POST | `/orders/:orderId/deliver` | sets status to delivered |
