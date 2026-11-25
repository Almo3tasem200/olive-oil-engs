# El Mohandeseen Olive Oil — Phase 2 UX and Architecture

**Status:** Phase 2 design draft  
**Authorization:** Proceeding on the user’s “yes” to Phase 2. Unresolved business rules stay configurable and unpublished.  
**Next gate:** Owner review before implementation.

This refines the Phase 1 PRD into a navigation model, interaction flows, responsive wireframes, provisional design direction, data model, and application architecture. It does not assume missing product photos, delivery policy, contacts, or integration credentials.

## 1. Key decisions

| Topic | Decision | Rationale |
|---|---|---|
| Catalog | Each size/package is an independently managed SKU. | The 500 ml, 1 L, and 12 L items have separate prices and availability. |
| Customer accounts | Registration/sign-in with a separate session from admin access; authentication is required to complete checkout and orders are linked to the signed-in customer. | The owner requested visible sign-in/sign-up and customer sign-in before completing checkout. |
| Money | Store integer piastres; compute price, delivery, and total on the server at quote and submission. | Avoid rounding errors, browser price manipulation, and changed historical orders. |
| Delivery | Enabled admin delivery zones define coverage and fees. | Current policy is unknown. Historical free delivery is not published by default. |
| Payment | COD only, behind an admin toggle. No online gateway. | Matches the brief without implying a provider is active. |
| Sales reporting | Show order value separately from collected sales; mark COD collected only when an admin confirms receipt. | An order total is not proof of payment. Owner should approve the metric labels. |
| Notifications | Save order and admin inbox notification in the same transaction. External email/WhatsApp runs from a retryable outbox. | Messaging failure must not lose an order. No recipient or credentials were supplied. |
| Inventory | MVP availability is a manual on/off flag. Stock tracking waits for stock/restock rules. | No counts or inventory policy were supplied. |
| Confirmation | Order number is a reference, not authorization. Confirmation access requires an unguessable token. | Prevent access by guessing order numbers. |

## 2. Sitemap

The root page is Arabic (language tag ar-EG, RTL). English uses /en/ (language tag en, LTR). A language switch stays on the corresponding page where translated, otherwise it links to the matching catalog or home page.

~~~mermaid
flowchart TD
  HOME[Home /] --> LIST[Products /products]
  HOME --> FAQ[FAQ /faq]
  HOME --> DELIVERY[Delivery /delivery]
  HOME --> CONTACT[Contact /contact]
  HOME --> CUSTLOGIN[Customer sign-in /account/login]
  HOME --> CUSTSIGNUP[Customer sign-up /account/signup]
  CUSTLOGIN --> ACCOUNT[Customer account /account]
  CUSTSIGNUP --> ACCOUNT
  LIST --> DETAIL[Product detail /products/:slug]
  DETAIL --> CART[Cart /cart]
  DETAIL --> CHECKOUT[Checkout /checkout]
  CART --> CHECKOUT
  CHECKOUT --> CONFIRM[Order confirmation /order-confirmation/:token]
  HOME --> LEGAL[Privacy /privacy and terms /terms]
  LOGIN[Admin sign-in /admin/sign-in] --> DASH[Overview /admin]
  DASH --> ORDERS[Orders /admin/orders]
  ORDERS --> ORDER[Order detail /admin/orders/:id]
  DASH --> PRODUCTS[Products /admin/products]
  DASH --> DELIVERYADMIN[Delivery /admin/delivery]
  DASH --> SETTINGS[Settings /admin/settings]
  DASH --> AUDIT[Audit /admin/audit]
~~~

| Page | Purpose |
|---|---|
| Home | Brand, factual hero, featured sizes, verified product information, ordering steps, configured delivery, FAQs, approved contacts. Hide unverified/empty sections. |
| Catalog | Three products with size, package, price comparison and quantity/add controls. Unavailable items cannot be ordered. |
| Product detail | Approved real photos, localized name, capacity, plastic package, current price, approved description, availability and buy/add actions. |
| Cart | Items, quantity/remove controls, subtotal and honest delivery-fee status. Never guess a fee. |
| Checkout | Two short steps: delivery details, then full review. Show final total before submit. |
| Confirmation | Order reference, items, amount due, COD note if enabled, approved contact route. No personal data in URL. |
| Admin | New-order queue, status counts, search/filter, order details/timeline/notes, products, delivery, settings. |

## 3. Journeys and layouts

### Customer

1. Arrive on the Arabic home page from search or social media.
2. Compare capacities, plastic packages, availability, and database prices.
3. Add a chosen quantity to cart or buy now. Browser storage holds product IDs/quantities only; product data refreshes from the server.
4. Enter name, mobile, governorate/city, configured service area, full address, building number, optional apartment/floor, landmark, optional notes, and optional contact preference.
5. If an area is not configured or served, explain that delivery cannot be confirmed. Do not accept an order with an invented fee.
6. Review items, quantities, subtotal, delivery, discount (zero in MVP), and total. If price/availability changed, explain it and require review.
7. Submit once; server revalidates and recalculates. Show order reference and private confirmation.

### Admin

1. Sign in; new orders and recent activity appear first.
2. Search/filter by reference, name, phone, date, or status.
3. Open an order to see delivery details, item/price snapshots, payment state, notes, and status history.
4. Confirm/cancel under allowed transitions; contact customer through a configured channel; add an internal note.
5. Change product price/availability or delivery rules from the dashboard without a code change.

Default status path:

~~~text
NEW → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
  └──────────────┴────────────┴────────┴────→ CANCELLED
~~~

For MVP, cancel through PROCESSING. Cancellation after SHIPPED depends on the owner’s return/refusal policy. Every status change records old/new status, actor, time, and optional note. The server enforces transitions.

### Mobile home, around 390 px wide

~~~text
┌──────────────────────────────┐
│ [menu] [approved logo] [ع EN]│
├──────────────────────────────┤
│ زيت زيتون المهندسين          │
│ اختار الحجم المناسب واطلب     │
│ بسهولة                       │
│ [تسوق الآن] [اطلب الآن]       │
│ [approved product photo]     │
├──────────────────────────────┤
│ المنتجات                     │
│ [500 ml image]               │
│ السعة • العبوة • السعر       │
│ [الكمية] [أضف للسلة]         │
│ [1 L card]       [12 L card] │
├──────────────────────────────┤
│ طريقة الطلب • التوصيل • FAQ  │
│ يظهر المحتوى المعتمد فقط     │
├──────────────────────────────┤
│ اتصال • فيسبوك • الخصوصية    │
└──────────────────────────────┘
       [سلة ثابتة عند وجود عناصر]
~~~

Desktop layout: header/navigation across the top; factual brand title and approved product photo side by side; three product cards in a row; verified details, ordering steps, and configured delivery below.

Checkout is a two-step mobile form: contact/address first, then products, subtotal, configured delivery, total, COD state, and final submit. Area choices come from configured zones.

## 4. Provisional visual system

The brief suggests olive green, gold, cream, and white. Since logo and packaging photos are missing, these are starting values only; compare with real assets and verify contrast before implementation.

| Token | Provisional value | Use |
|---|---|---|
| olive-950 | #263326 | Main text on light surfaces, footer, primary button |
| olive-800 | #3D5138 | Secondary brand surfaces |
| olive-600 | #65764D | Decorative accents; avoid small text until checked |
| olive-100 | #E8EBDD | Soft card background |
| cream-50 | #FAF8F1 | Main warm background |
| gold-500 | #B5964E | Decorative lines only, not essential controls |
| ink | #20251F | Body copy |
| white | #FFFFFF | Cards and text on dark controls |

- Arabic font: Noto Sans Arabic or another legible licensed family, self-hosted after review, with a compatible Latin fallback. Avoid calligraphy in forms/prices.
- 16 px base mobile body; Arabic line height near 1.6; headings from 24 px mobile to 40–48 px desktop.
- Four-pixel spacing scale; content max around 1200 px; 16–20 px mobile gutters.
- Product grid: one column mobile, two tablet, three desktop.
- Touch targets at least 44×44 px; persistent labels, visible focus, reduced-motion support, and state cues beyond color.
- Use logical CSS properties for RTL. Phone/email/order reference/SKU should be isolated LTR.
- Neutral hero draft: “زيت زيتون المهندسين — اختار الحجم المناسب واطلب زيت الزيتون بسهولة”. Longer suggested copy needs owner approval.
- Publish no origin, grade, health, shelf-life, certification, review, delivery-time, discount, or free-delivery claims until verified. Product copy can state olive oil, capacity, and plastic package only.

## 5. Proposed data model

| Entity | Purpose and important fields |
|---|---|
| AdminUser | UUID, unique email, name, password hash, role (OWNER/MANAGER/FULFILLMENT), active and timestamps. Private owner setup; no public signup. |
| AdminSession | Admin FK, unique token hash, expiry/revocation timestamps. Raw session token is never stored. |
| CustomerAccount | Optional customer identity with unique email, name, Argon2id password hash, active flag, and timestamps. Separate from staff accounts. |
| CustomerSession | Customer FK, unique token hash, expiry/revocation timestamps. Raw session token is never stored. |
| Product | UUID, unique SKU/slug, Arabic/English names/descriptions, capacity/unit, plastic package type, integer piastre price, active/available and timestamps. |
| ProductImage | Product FK, storage key, localized alt text, sort order, primary flag. Image bytes live in object storage. |
| DeliveryZone | Arabic/English governorate/city/area, normalized code, fee in piastres, optional free threshold, active flag. |
| StoreSettings | Singleton with bilingual business name, logo key, public phone/WhatsApp, social URLs, address/hours/delivery text, COD toggle, EGP and timestamps. No secrets. |
| Order | Unique reference/idempotency key/confirmation-token hash, optional customer-account FK plus contact/address snapshots, optional zone FK and zone/fee snapshot, subtotal/discount/delivery/total in piastres, payment/order status and timestamps. |
| OrderItem | Order FK, nullable product FK, SKU/name/capacity/package/price snapshots, positive quantity and line total. |
| OrderStatusHistory | Order FK, old/new status, optional admin actor, reason/note, timestamp; append-only. |
| OrderNote | Order/admin FKs, internal note/time; append-only and never customer-visible. |
| Notification | Optional order FK, channel/type/status, attempts, next-attempt time, redacted error/provider reference. |
| AuditLog | Admin actor, action/entity, redacted before/after values, time, request correlation ID. Never log secrets or tokens. |

Customer details remain immutable order snapshots. Orders are linked to the customer signed in at checkout. Account APIs expose only that customer's order number, status, amount, and date. Discounts are zero and unavailable in MVP. Inventory quantities require atomic reservation, expiry, and restock policy; a stock field alone cannot prevent overselling.

~~~mermaid
erDiagram
  ADMIN_USER ||--o{ ADMIN_SESSION : owns
  CUSTOMER_ACCOUNT ||--o{ CUSTOMER_SESSION : owns
  CUSTOMER_ACCOUNT o|--o{ ORDER : places_while_signed_in
  ADMIN_USER ||--o{ ORDER_STATUS_HISTORY : changes
  ADMIN_USER ||--o{ ORDER_NOTE : writes
  ADMIN_USER ||--o{ AUDIT_LOG : performs
  PRODUCT ||--o{ PRODUCT_IMAGE : has
  PRODUCT ||--o{ ORDER_ITEM : snapshot_source
  DELIVERY_ZONE ||--o{ ORDER : selected_for
  ORDER ||--|{ ORDER_ITEM : contains
  ORDER ||--o{ ORDER_STATUS_HISTORY : history
  ORDER ||--o{ ORDER_NOTE : internal_notes
  ORDER ||--o{ NOTIFICATION : creates
~~~

Add unique constraints for admin email, SKU/slug, order reference, idempotency key, token hash, and area code. Index order time/status, reference, normalized phone, product slug/availability. Check money is nonnegative, quantities/capacity positive, and statuses valid. Restrict deletion of products/zones referenced by orders; archive instead. Store timestamps in UTC.

## 6. Pricing and order creation

~~~text
subtotal = sum(current database price × requested quantity)
discount = 0 for MVP
delivery = configured fee for selected active zone
total = subtotal - approved discount + delivery
~~~

The browser cannot set authoritative money. The server validates product IDs, quantities, availability, zone, COD setting, and address. On submit:

1. Validate request, phone, required address, item/quantity limits, idempotency key, and rate limit.
2. Reject unavailable products or unserved areas with a useful correction message.
3. Calculate using integer piastres.
4. In one transaction create order/item snapshots, initial NEW history, and internal admin notification.
5. Retrying the same idempotency key returns the same order.
6. External notification worker retries separately with bounded backoff and redacted logs.

If stock tracking is later enabled, reserve stock atomically and define expiry/restock behavior before activation.

## 7. Architecture and security

- Web: Next.js App Router, React, TypeScript, Tailwind CSS.
- Backend: one server-rendered app for store/admin; no separate NestJS service for MVP. The domain is compact, so one deployable app lowers operational burden.
- Database: PostgreSQL with Prisma ORM and versioned migrations. Optional customer account sessions are separate from staff sessions.
- Use Server Components for suitable reads; Client Components only for cart controls, form state, and browser storage.
- A server-only data access layer and domain services own auth, pricing, quotes, orders, delivery, notifications, and reporting. Pages contain no pricing rules or broad direct database access.
- Route Handlers serve quote/order and admin API operations. Server Actions may handle same-origin forms, but each is treated as a reachable endpoint and validates input/authorization.
- Object storage/CDN for approved images; durable database outbox and scheduled notification worker.
- Hosting provider, region, domain, and storage vendor remain open until budget, account, privacy, and deployment constraints are known.

~~~mermaid
flowchart LR
  CB[Customer browser] --> NEXT[Next.js storefront]
  AB[Admin browser] --> NEXT
  NEXT --> DAL[Server-only DAL and domain services]
  DAL --> PG[(Managed PostgreSQL)]
  NEXT --> CDN[Approved image storage / CDN]
  PG --> Q[Notification outbox]
  Q --> WORKER[Scheduled retry worker]
  WORKER --> EXT[Optional official WhatsApp / email]
  PG --> ADM[Admin order inbox]
~~~

Use the DAL directly for server-rendered reads instead of an extra internal HTTP request. Cache public catalog briefly or invalidate after price/availability edits. Never shared-cache checkout, quote, admin, confirmation, or personal order data.

Security:

- Select a maintained Next.js-compatible authentication/session library during implementation; prefer database-backed admin sessions.
- Hash passwords with Argon2id, tuned for the selected host; store hashes only and provision the first owner privately.
- Roles: OWNER manages staff/settings; MANAGER manages products/delivery/orders; FULFILLMENT views required order details and advances allowed statuses. Start with one owner.
- Enforce authorization near every protected read/write, not only by hiding links; return minimal DTOs.
- Rate-limit login and order endpoints. Use secure HTTP-only SameSite cookies, TLS, CSP, and same-origin/CSRF safeguards for cookie-authenticated mutations.
- Validate upload contents/type/size/dimensions. Keep provider credentials in host secret storage, never store settings, database exports, client bundles, or logs.
- Retain customer data only under owner-approved policy; audit access and sensitive admin changes.

## 8. SEO, accessibility, and performance

- Arabic home at /, English at /en; correct locale/direction, canonical/hreflang, and localized metadata.
- Generate sitemap/robots from active content. Product structured data uses database price/availability and no unverified claims.
- Open Graph uses approved images once supplied; no generated packaging.
- Responsive image sizes and lazy loading below first view. No speed guarantee until measured with real assets/hosting.
- Keyboard navigation, visible focus, labels, announced cart/errors, RTL/LTR review, touch targets, and contrast verification before release.

## 9. Owner review before implementation

These may remain configurable/unpublished during development, but production launch needs:

1. Approved logo/product photos and confirmation of current prices/tax treatment.
2. Delivery zones, fees, free-delivery/minimum rules, and timing claims.
3. COD decision and approval of the collected-sales metric.
4. Business phone/WhatsApp, social links, hours, notification recipient/provider credentials.
5. Review provisional colors/font against brand assets; approve Arabic/English copy.
6. Inventory, cancellation/returns, privacy, and data-retention rules.
7. Hosting/domain constraints and production provider/region choice.

## 10. Technical references checked

- Next.js: [App Router](https://nextjs.org/docs/app), [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Data Security](https://nextjs.org/docs/app/guides/data-security), [Authentication](https://nextjs.org/docs/app/guides/authentication). This design follows the server-only DAL/minimal DTO pattern and authorizes close to protected data.
- Prisma: [Transactions and runtime](https://www.prisma.io/docs/orm/reference/transactions-and-runtime). Pin a compatible version at implementation; this design is not tied to a specific API version.
- PostgreSQL: [Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html), [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html).
- OWASP: [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), recommending adaptive password hashing such as Argon2id over plaintext or fast general-purpose hashes.
