# GoCart — Full-Stack E-Commerce Platform

A production-ready, full-stack e-commerce web application featuring high-fidelity product catalog browsing, debounced search and filtering, user authentication, customer profile & address management, synchronized shopping bag, wishlist, coupon promotions, checkout with sandbox card payments and Cash on Delivery, order tracking with real-time cancellation inventory restoration, and a dedicated role-protected Administrator Operations Console.

---

## 1. Key Features

### Customer Storefront
- **Modern Responsive Design**: Follows strict e-commerce design discipline, zero-pill metadata typography, and high-contrast accessibility.
- **Dynamic Catalog & Filtering**:
  - Department filtering (Audio & Electronics, Apparel & Goods, Home & Living, Grooming & Wellness).
  - Multi-attribute search by name, brand, SKU, and description.
  - Price range slider, in-stock toggle, and sorting (Featured, Price Asc/Desc, Highest Rated, Newest).
  - Server-side pagination and item count summaries.
- **Product Details & Verified Reviews**:
  - Image gallery with zoom preview and thumbnail selector.
  - Technical craftsmanship specifications.
  - Star ratings and customer reviews with automatic "Verified Purchase" badges based on customer order history.
  - Instant buy and quantity steppers with real-time stock limits.
- **Interactive Shopping Bag & Wishlist**:
  - Slide-over drawer with item quantity steppers, subtotal, and complimentary shipping progress bar ($50 threshold).
  - Wishlist toggle on product cards with one-click "Move to Bag".
  - Persistent cart state for logged-in users with guest cart merging upon sign in.
- **Promotional Coupons**:
  - Real-time coupon validation (`WELCOME10`, `GOCART20`, `SUPER50`, `FREESHIP`) with percentage or fixed discount calculations, minimum spend rules, and usage counters.
- **Checkout & Payment Processing**:
  - Address book selection or new delivery address creation with field validation.
  - Payment options: Credit/Debit Card (sandbox simulation with Luhn check) or Cash on Delivery (COD).
  - Celebratory confetti on order placement and downloadable/printable order receipt with tracking reference.
- **User Account Portal**:
  - View past orders with fulfillment status tracking timeline (Placed -> Confirmed -> Processing -> Shipped -> Delivered).
  - Self-service order cancellation for eligible orders (status `Pending` or `Confirmed`) with automatic inventory restoration.
  - Multiple shipping address management (add, delete, default).
  - Profile management and secure password change.

### Administrator Operations Console (`/admin`)
- **Executive Telemetry Dashboard**:
  - Real-time KPIs: Settled Revenue ($), Total Orders, Verified Clients, Active Products, and Low Stock alerts.
  - Top-selling products table with units sold and revenue figures.
  - Revenue distribution bar breakdown by department.
  - Recent orders feed with quick status links.
- **Catalog & Inventory Manager**:
  - Full CRUD for products: title, price, original MSRP, stock, SKU, department, brand, specifications, and images.
  - Image file uploads via Express multer endpoint (`/api/upload`) saving to `/uploads`.
  - Live stock tracking and availability toggles.
- **Order Fulfillment & Logistics**:
  - Filter orders by status (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled).
  - Update fulfillment status, payment status, and assign carrier name and tracking number.
- **Department Taxonomy Manager**:
  - Create and edit categories with cover images and descriptions.
  - Guarded deletion preventing category removal if active products belong to it.
- **Campaign Coupons Manager**:
  - Provision discount codes, configure discount type (% or $), minimum order threshold, max discount cap, usage limits, and expiration dates.
- **Customer Directory**:
  - Inspect client order counts, lifetime spend, registration date, and toggle account standing (active/suspended).
- **Reputation Moderation**:
  - Audit customer reviews across all products and purge inappropriate submissions, which triggers automatic recalculation of the product's aggregate rating score and review count.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js v22, Express 4.x, TypeScript with `tsx`.
- **Database**: Persistent JSON database engine (`src/server/db.ts`) with ACID atomic temp-file write-and-rename mechanics, seed data bootstrapping, and referential integrity.
- **Authentication**: JWT tokens (7-day validity) and bcrypt password hashing (10 salt rounds).
- **File Storage**: Static uploads managed via Multer with file type validation (`/uploads`).
- **Build & Dev Tool**: Vite 8 with full-stack middleware integration in development mode.

---

## 3. Seed Credentials & Pre-Configured Data

The database automatically initializes upon first boot with:

### User Accounts
| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@gocart.com` | `Admin@123456` |
| **Customer** | `customer@gocart.com` | `Customer@123456` |

*Note: The Sign In dialog includes one-click "Quick Test Credentials" buttons for rapid testing.*

### Active Promotional Codes
| Coupon Code | Discount | Minimum Order | Details |
|---|---|---|---|
| `WELCOME10` | 10% OFF | $40 | Max discount $30 |
| `GOCART20` | 20% OFF | $100 | Max discount $60 |
| `SUPER50` | $50 OFF | $250 | Fixed discount |
| `FREESHIP` | Free Delivery | $50 | Waives $10 shipping |

---

## 4. API Endpoints Reference

### Authentication & Account
- `POST /api/auth/register` — Register a new customer account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve authenticated user profile
- `PUT /api/auth/profile` — Update name, phone, avatar
- `POST /api/auth/change-password` — Change password with old password verification

### Address Book
- `GET /api/addresses` — List saved addresses
- `POST /api/addresses` — Add shipping address
- `PUT /api/addresses/:id` — Update address
- `DELETE /api/addresses/:id` — Remove address

### Catalog & Reviews
- `GET /api/categories` — List all categories with product counts
- `GET /api/products` — Filter products (`q`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `page`, `limit`)
- `GET /api/products/:id` — Get product detail, related items, and reviews
- `GET /api/reviews/:productId` — Get reviews for a product
- `POST /api/reviews` — Submit customer review (verified purchase checked against order history)

### Cart & Wishlist
- `GET /api/cart` — Get user cart with live stock revalidation
- `POST /api/cart/sync` — Synchronize cart items with server
- `GET /api/wishlist` — Get saved wishlist items
- `POST /api/wishlist/toggle` — Toggle product in/out of wishlist

### Orders & Checkout
- `POST /api/coupons/validate` — Validate promo code and calculate discount
- `POST /api/orders` — Create order with authoritative server price calculation & stock deduction
- `POST /api/orders/:id/pay` — Process payment (sandbox card verification)
- `GET /api/orders` — List authenticated user's order history
- `GET /api/orders/:id` — Get single order details
- `POST /api/orders/:id/cancel` — Cancel order and automatically restore product stock

### Admin Operations (`role: admin` required)
- `GET /api/admin/metrics` — Overview revenue, order counts, product counts, customer counts, top items
- `POST /api/admin/products` — Create new product
- `PUT /api/admin/products/:id` — Update existing product
- `DELETE /api/admin/products/:id` — Delete product
- `POST /api/admin/categories` — Create department
- `PUT /api/admin/categories/:id` — Update department
- `DELETE /api/admin/categories/:id` — Delete department (with product assignment safety check)
- `GET /api/admin/orders` — List all orders with status/query filters
- `PUT /api/admin/orders/:id/status` — Update order status, payment status, tracking number
- `GET /api/admin/customers` — List registered customers with lifetime spend
- `PATCH /api/admin/customers/:id/status` — Suspend or activate customer account
- `GET /api/admin/coupons` — List all discount coupons
- `POST /api/admin/coupons` — Create coupon
- `PUT /api/admin/coupons/:id` — Edit coupon
- `DELETE /api/admin/coupons/:id` — Delete coupon
- `GET /api/admin/reviews` — List all customer reviews
- `DELETE /api/admin/reviews/:id` — Delete review and recalculate product rating
- `POST /api/upload` — Multipart image upload (stores in `/uploads`)

---

## 5. Running the Application

### Development
```bash
npm run dev
```
Starts the full-stack server on `http://localhost:3000` with Express API routes and Vite development middleware.

### Production Build & Launch
```bash
npm run build
npm start
```
Compiles client assets with Vite into `dist/` and runs the production Express server on port `3000`.

### Type Check & Linting
```bash
npm run lint
```
Runs TypeScript verification (`tsc --noEmit`).

---

## 6. Security Features

1. **Role-Based Authorization**: Administrative routes and APIs (`/api/admin/*`, `/api/upload`) strictly verify `role === 'admin'` from validated JWT payloads.
2. **Authoritative Calculation**: Subtotals, shipping tiers, discounts, taxes, and final totals are calculated exclusively by the backend; client-provided prices and totals are never trusted.
3. **Inventory Race Prevention**: Stock quantities are checked and decremented on order confirmation, and safely restored when orders are cancelled.
4. **Password Hashing**: Passwords are encrypted using bcrypt with salt rounds before being stored. Plaintext passwords never touch disk or logs.
5. **Sanitized File Uploads**: Image uploads are restricted to supported mime types (`jpg`, `png`, `webp`, `gif`, `svg`) and a 5MB size limit.
