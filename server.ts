import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createServer as createViteServer } from 'vite';

import { getDatabase, saveDatabase, isMongoConnected } from './src/server/db.js';
import { authenticate, requireAuth, requireAdmin, generateToken, AuthRequest } from './src/server/auth.js';
import { Product, Address, Coupon, Order, Review, User, Category } from './src/server/types.js';

const app = express();
const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Ensure uploads folder exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, webp, gif, svg) are permitted'));
    }
  },
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticate);

// Static directory paths
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const PUBLIC_IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images');
const SRC_IMAGES_DIR = path.resolve(process.cwd(), 'src', 'assets', 'images');

// Static uploads serving
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve static images directly from public/images
app.use('/images', express.static(PUBLIC_IMAGES_DIR));

// Backward compatibility & development alias for /src/assets/images
app.use('/src/assets/images', express.static(PUBLIC_IMAGES_DIR));
if (fs.existsSync(SRC_IMAGES_DIR)) {
  app.use('/src/assets/images', express.static(SRC_IMAGES_DIR));
}

// Serve any other public root static assets
app.use(express.static(PUBLIC_DIR));

/* -------------------------------------------------------------
 * API: HEALTH CHECK
 * ----------------------------------------------------------- */
app.get('/api/health', async (_req, res) => {
  try {
    const db = await getDatabase();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: isMongoConnected(),
        type: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON fallback',
        database: 'gocart',
        cluster: 'cluster0.pq6kody.mongodb.net',
      },
      productsCount: db.products.length,
      ordersCount: db.orders.length,
      usersCount: db.users.length,
      categoriesCount: db.categories.length,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/* -------------------------------------------------------------
 * API: AUTHENTICATION
 * ----------------------------------------------------------- */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const db = await getDatabase();
    const normalizedEmail = email.trim().toLowerCase();

    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `usr_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'customer',
      phone: phone ? phone.trim() : undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await saveDatabase();

    const token = generateToken(newUser);
    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = await getDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during login.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status,
  });
});

app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const db = await getDatabase();
    const userIndex = db.users.findIndex((u) => u.id === req.user!.id);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (name) db.users[userIndex].name = name.trim();
    if (phone !== undefined) db.users[userIndex].phone = phone ? phone.trim() : undefined;
    if (avatar !== undefined) db.users[userIndex].avatar = avatar;

    await saveDatabase();
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: db.users[userIndex].id,
        name: db.users[userIndex].name,
        email: db.users[userIndex].email,
        role: db.users[userIndex].role,
        phone: db.users[userIndex].phone,
        avatar: db.users[userIndex].avatar,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const db = await getDatabase();
    const user = db.users.find((u) => u.id === req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password does not match.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await saveDatabase();

    res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * API: ADDRESSES
 * ----------------------------------------------------------- */
app.get('/api/addresses', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDatabase();
  const addresses = db.addresses.filter((a) => a.userId === req.user!.id);
  res.json(addresses);
});

app.post('/api/addresses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;
    if (!fullName || !phone || !street || !city || !state || !zipCode || !country) {
      res.status(400).json({ error: 'All address fields are required.' });
      return;
    }

    const db = await getDatabase();
    const userAddresses = db.addresses.filter((a) => a.userId === req.user!.id);

    if (isDefault) {
      userAddresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    const newAddress: Address = {
      id: `addr_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
      userId: req.user!.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      isDefault: isDefault || userAddresses.length === 0,
    };

    db.addresses.push(newAddress);
    await saveDatabase();
    res.status(201).json(newAddress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/addresses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;
    const db = await getDatabase();

    const address = db.addresses.find((a) => a.id === id && a.userId === req.user!.id);
    if (!address) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    if (isDefault) {
      db.addresses.filter((a) => a.userId === req.user!.id).forEach((a) => {
        a.isDefault = false;
      });
    }

    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (zipCode) address.zipCode = zipCode.trim();
    if (country) address.country = country.trim();
    if (isDefault !== undefined) address.isDefault = isDefault;

    await saveDatabase();
    res.json(address);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/addresses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const index = db.addresses.findIndex((a) => a.id === id && a.userId === req.user!.id);
    if (index === -1) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    const removed = db.addresses.splice(index, 1)[0];
    if (removed.isDefault) {
      const remaining = db.addresses.filter((a) => a.userId === req.user!.id);
      if (remaining.length > 0) {
        remaining[0].isDefault = true;
      }
    }

    await saveDatabase();
    res.json({ message: 'Address removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * API: CATEGORIES
 * ----------------------------------------------------------- */
app.get('/api/categories', async (_req, res) => {
  const db = await getDatabase();
  // Count active products for each category
  const categoriesWithCounts = db.categories.map((cat) => {
    const count = db.products.filter(
      (p) => p.category.toLowerCase() === cat.name.toLowerCase() && p.isAvailable
    ).length;
    return { ...cat, productCount: count };
  });
  res.json(categoriesWithCounts);
});

/* -------------------------------------------------------------
 * API: PRODUCTS
 * ----------------------------------------------------------- */
app.get('/api/products', async (req, res) => {
  try {
    const db = await getDatabase();
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      featured,
      sortBy = 'featured',
      page = '1',
      limit = '12',
    } = req.query;

    let results = [...db.products];

    // Filter available
    results = results.filter((p) => p.isAvailable);

    // Search query
    if (q && typeof q === 'string') {
      const query = q.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'all') {
      results = results.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Brand filter
    if (brand && typeof brand === 'string' && brand !== 'all') {
      results = results.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // Price range
    if (minPrice) {
      results = results.filter((p) => p.price >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      results = results.filter((p) => p.price <= parseFloat(maxPrice as string));
    }

    // Minimum rating
    if (rating) {
      results = results.filter((p) => p.rating >= parseFloat(rating as string));
    }

    // In stock only
    if (inStock === 'true') {
      results = results.filter((p) => p.stock > 0);
    }

    // Featured only
    if (featured === 'true') {
      results = results.filter((p) => p.isFeatured);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'featured':
      default:
        results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 12);
    const total = results.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      products: paginated,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const db = await getDatabase();
  const product = db.products.find(
    (p) => p.id === req.params.id || p.slug === req.params.id
  );
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  // Get related products in same category
  const related = db.products
    .filter((p) => p.category === product.category && p.id !== product.id && p.isAvailable)
    .slice(0, 4);

  // Get reviews
  const reviews = db.reviews.filter((r) => r.productId === product.id);

  res.json({
    product,
    related,
    reviews,
  });
});

/* -------------------------------------------------------------
 * API: REVIEWS
 * ----------------------------------------------------------- */
app.get('/api/reviews/:productId', async (req, res) => {
  const db = await getDatabase();
  const reviews = db.reviews.filter((r) => r.productId === req.params.productId);
  res.json(reviews);
});

app.post('/api/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      res.status(400).json({ error: 'Product ID, rating (1-5), and review comment are required.' });
      return;
    }

    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5.' });
      return;
    }

    const db = await getDatabase();
    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Check if user has bought this product
    const isVerifiedPurchase = db.orders.some(
      (ord) =>
        ord.userId === req.user!.id &&
        ord.paymentStatus === 'paid' &&
        ord.items.some((item) => item.productId === productId)
    );

    const newReview: Review = {
      id: `rev_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
      productId,
      userId: req.user!.id,
      userName: req.user!.name,
      userAvatar: req.user!.avatar,
      rating: ratingNum,
      comment: comment.trim(),
      isVerifiedPurchase,
      createdAt: new Date().toISOString(),
    };

    db.reviews.push(newReview);

    // Recalculate product rating
    const allProdReviews = db.reviews.filter((r) => r.productId === productId);
    const avgRating =
      allProdReviews.reduce((sum, r) => sum + r.rating, 0) / allProdReviews.length;
    product.rating = parseFloat(avgRating.toFixed(1));
    product.reviewCount = allProdReviews.length;

    await saveDatabase();
    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * API: CART
 * ----------------------------------------------------------- */
app.get('/api/cart', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDatabase();
  const cart = db.carts.find((c) => c.userId === req.user!.id) || {
    userId: req.user!.id,
    items: [],
    updatedAt: new Date().toISOString(),
  };

  // Populate product details & validate live stock
  const populatedItems = cart.items
    .map((item) => {
      const prod = db.products.find((p) => p.id === item.productId);
      if (!prod || !prod.isAvailable) return null;
      return {
        ...item,
        product: prod,
        quantity: Math.min(item.quantity, prod.stock),
      };
    })
    .filter(Boolean);

  res.json({
    userId: cart.userId,
    items: populatedItems,
    updatedAt: cart.updatedAt,
  });
});

app.post('/api/cart/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Items must be an array.' });
      return;
    }

    const db = await getDatabase();
    let cart = db.carts.find((c) => c.userId === req.user!.id);
    if (!cart) {
      cart = {
        userId: req.user!.id,
        items: [],
        updatedAt: new Date().toISOString(),
      };
      db.carts.push(cart);
    }

    // Merge or replace items safely
    const validItems: Array<{ productId: string; quantity: number }> = [];
    for (const item of items) {
      const prod = db.products.find((p) => p.id === item.productId && p.isAvailable);
      if (prod && item.quantity > 0) {
        validItems.push({
          productId: prod.id,
          quantity: Math.min(item.quantity, prod.stock),
        });
      }
    }

    cart.items = validItems;
    cart.updatedAt = new Date().toISOString();
    await saveDatabase();

    res.json({ message: 'Cart synced successfully', cart });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * API: WISHLIST
 * ----------------------------------------------------------- */
app.get('/api/wishlist', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDatabase();
  const wishlist = db.wishlists.find((w) => w.userId === req.user!.id) || {
    userId: req.user!.id,
    productIds: [],
    updatedAt: new Date().toISOString(),
  };

  const products = wishlist.productIds
    .map((id) => db.products.find((p) => p.id === id && p.isAvailable))
    .filter(Boolean);

  res.json({
    userId: wishlist.userId,
    products,
    updatedAt: wishlist.updatedAt,
  });
});

app.post('/api/wishlist/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ error: 'productId is required.' });
      return;
    }

    const db = await getDatabase();
    let wishlist = db.wishlists.find((w) => w.userId === req.user!.id);
    if (!wishlist) {
      wishlist = {
        userId: req.user!.id,
        productIds: [],
        updatedAt: new Date().toISOString(),
      };
      db.wishlists.push(wishlist);
    }

    const exists = wishlist.productIds.includes(productId);
    if (exists) {
      wishlist.productIds = wishlist.productIds.filter((id) => id !== productId);
    } else {
      wishlist.productIds.push(productId);
    }

    wishlist.updatedAt = new Date().toISOString();
    await saveDatabase();

    res.json({
      inWishlist: !exists,
      productIds: wishlist.productIds,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * API: COUPONS
 * ----------------------------------------------------------- */
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof subtotal !== 'number') {
      res.status(400).json({ error: 'Coupon code and subtotal are required.' });
      return;
    }

    const db = await getDatabase();
    const coupon = db.coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
    );

    if (!coupon) {
      res.status(404).json({ error: 'Invalid or inactive coupon code.' });
      return;
    }

    if (new Date(coupon.validUntil).getTime() < Date.now()) {
      res.status(400).json({ error: 'This coupon has expired.' });
      return;
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ error: 'This coupon has reached its usage limit.' });
      return;
    }

    if (subtotal < coupon.minOrderAmount) {
      res.status(400).json({
        error: `Minimum order amount of $${coupon.minOrderAmount} required for this coupon.`,
      });
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    res.json({
      valid: true,
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * API: ORDERS & CHECKOUT
 * ----------------------------------------------------------- */
app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress, couponCode, paymentMethod = 'card' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item.' });
      return;
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode ||
      !shippingAddress.phone
    ) {
      res.status(400).json({ error: 'Complete shipping address is required.' });
      return;
    }

    const db = await getDatabase();

    // Revalidate inventory and authoritative prices
    let subtotal = 0;
    const orderItems: Order['items'] = [];

    for (const item of items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (!prod || !prod.isAvailable) {
        res.status(400).json({ error: `Product "${item.name || item.productId}" is no longer available.` });
        return;
      }

      if (prod.stock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${prod.name}". Only ${prod.stock} remaining.`,
        });
        return;
      }

      const itemSubtotal = prod.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        originalPrice: prod.originalPrice,
        quantity: item.quantity,
        image: prod.images[0] || '',
        sku: prod.sku,
      });
    }

    // Revalidate coupon
    let discount = 0;
    let appliedCoupon: Coupon | undefined;
    if (couponCode) {
      appliedCoupon = db.coupons.find(
        (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
      );
      if (
        appliedCoupon &&
        new Date(appliedCoupon.validUntil).getTime() > Date.now() &&
        appliedCoupon.usedCount < appliedCoupon.usageLimit &&
        subtotal >= appliedCoupon.minOrderAmount
      ) {
        if (appliedCoupon.discountType === 'percentage') {
          discount = (subtotal * appliedCoupon.discountValue) / 100;
          if (appliedCoupon.maxDiscountAmount) {
            discount = Math.min(discount, appliedCoupon.maxDiscountAmount);
          }
        } else {
          discount = appliedCoupon.discountValue;
        }
        discount = Math.min(discount, subtotal);
      }
    }

    // Shipping: Free over $50, else $10
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shippingFee = discountedSubtotal >= 50 || (appliedCoupon && appliedCoupon.code === 'FREESHIP') ? 0 : 10;
    // Estimated tax 8%
    const tax = Math.round(discountedSubtotal * 0.08 * 100) / 100;
    const total = Math.round((discountedSubtotal + shippingFee + tax) * 100) / 100;

    // Deduct inventory atomically
    for (const item of orderItems) {
      const prod = db.products.find((p) => p.id === item.productId)!;
      prod.stock -= item.quantity;
    }

    // Increment coupon used count if valid
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
    }

    // Generate unique order number
    const orderNumber = `GC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: `ord_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
      orderNumber,
      userId: req.user!.id,
      customerName: shippingAddress.fullName.trim(),
      customerEmail: req.user!.email,
      customerPhone: shippingAddress.phone.trim(),
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        zipCode: shippingAddress.zipCode.trim(),
        country: shippingAddress.country?.trim() || 'United States',
      },
      items: orderItems,
      subtotal,
      discount: Math.round(discount * 100) / 100,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      shippingFee,
      tax,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'Confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);

    // Clear user cart
    const cart = db.carts.find((c) => c.userId === req.user!.id);
    if (cart) {
      cart.items = [];
      cart.updatedAt = new Date().toISOString();
    }

    await saveDatabase();

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Process Card Payment (Sandbox test gateway)
app.post('/api/orders/:id/pay', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { cardNumber, cardExp, cardCvc } = req.body;

    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === id && o.userId === req.user!.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.json({ message: 'Order is already marked as paid.', order });
      return;
    }

    // Basic Luhn / sandbox simulation: reject if card ends in 0000 or has invalid length
    const cleanCard = (cardNumber || '').replace(/\s+/g, '');
    if (cleanCard.length < 13 || cleanCard.endsWith('0000') || !cardExp || !cardCvc) {
      order.paymentStatus = 'failed';
      await saveDatabase();
      res.status(402).json({ error: 'Payment declined. Please check card number or use another payment method.' });
      return;
    }

    // Success
    order.paymentStatus = 'paid';
    order.orderStatus = 'Processing';
    order.updatedAt = new Date().toISOString();
    await saveDatabase();

    res.json({
      message: 'Payment verified and processed successfully',
      order,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Customer order history
app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDatabase();
  const customerOrders = db.orders
    .filter((o) => o.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(customerOrders);
});

// Customer order details
app.get('/api/orders/:id', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDatabase();
  const order = db.orders.find(
    (o) => (o.id === req.params.id || o.orderNumber === req.params.id) && o.userId === req.user!.id
  );
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  res.json(order);
});

// Cancel eligible order (restores inventory!)
app.post('/api/orders/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === req.params.id && o.userId === req.user!.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
      res.status(400).json({
        error: `Cannot cancel order that has already reached "${order.orderStatus}" status. Please initiate a return instead.`,
      });
      return;
    }

    if (order.orderStatus === 'Cancelled') {
      res.status(400).json({ error: 'Order has already been cancelled.' });
      return;
    }

    // Restore inventory
    for (const item of order.items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
      }
    }

    order.orderStatus = 'Cancelled';
    order.updatedAt = new Date().toISOString();
    await saveDatabase();

    res.json({
      message: 'Order cancelled successfully and inventory restored.',
      order,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * API: ADMIN ROUTES (Protected by requireAdmin)
 * ----------------------------------------------------------- */
app.get('/api/admin/metrics', requireAdmin, async (_req, res) => {
  try {
    const db = await getDatabase();

    const totalOrders = db.orders.length;
    const paidOrders = db.orders.filter((o) => o.paymentStatus === 'paid');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCustomers = db.users.filter((u) => u.role === 'customer').length;
    const totalProducts = db.products.length;
    const lowStockProducts = db.products.filter((p) => p.stock < 10);

    // Sales by category
    const categorySales: Record<string, number> = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'General';
        categorySales[cat] = (categorySales[cat] || 0) + item.price * item.quantity;
      }
    }

    // Top selling products
    const productSalesCount: Record<string, { name: string; quantity: number; revenue: number; image: string }> = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (!productSalesCount[item.productId]) {
          productSalesCount[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            image: item.image,
          };
        }
        productSalesCount[item.productId].quantity += item.quantity;
        productSalesCount[item.productId].revenue += item.price * item.quantity;
      }
    }

    const topSelling = Object.values(productSalesCount)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const recentOrders = db.orders.slice(0, 8);

    res.json({
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      categorySales,
      topSelling,
      recentOrders,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Product CRUD
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      details,
      category,
      brand,
      price,
      originalPrice,
      stock,
      sku,
      images,
      isFeatured,
      isAvailable,
    } = req.body;

    if (!name || !price || !category) {
      res.status(400).json({ error: 'Product name, price, and category are required.' });
      return;
    }

    const db = await getDatabase();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProduct: Product = {
      id: `prod_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
      name: name.trim(),
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      description: description || '',
      details: Array.isArray(details) ? details : [],
      category: category.trim(),
      brand: brand ? brand.trim() : 'GoCart Curated',
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      discountPercent:
        originalPrice && Number(originalPrice) > Number(price)
          ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
          : 0,
      stock: Number(stock ?? 10),
      sku: sku ? sku.trim() : `GC-${Math.floor(10000 + Math.random() * 90000)}`,
      images: Array.isArray(images) && images.length > 0 ? images : ['/src/assets/images/hero_gocart_lifestyle_1791788713972.jpg'],
      rating: 5.0,
      reviewCount: 0,
      isFeatured: !!isFeatured,
      isAvailable: isAvailable !== false,
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    await saveDatabase();

    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const prod = db.products.find((p) => p.id === id);
    if (!prod) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const {
      name,
      description,
      details,
      category,
      brand,
      price,
      originalPrice,
      stock,
      sku,
      images,
      isFeatured,
      isAvailable,
    } = req.body;

    if (name) prod.name = name.trim();
    if (description !== undefined) prod.description = description;
    if (Array.isArray(details)) prod.details = details;
    if (category) prod.category = category.trim();
    if (brand) prod.brand = brand.trim();
    if (price !== undefined) prod.price = Number(price);
    if (originalPrice !== undefined) prod.originalPrice = Number(originalPrice);
    if (stock !== undefined) prod.stock = Number(stock);
    if (sku) prod.sku = sku.trim();
    if (Array.isArray(images)) prod.images = images;
    if (isFeatured !== undefined) prod.isFeatured = !!isFeatured;
    if (isAvailable !== undefined) prod.isAvailable = !!isAvailable;

    if (prod.originalPrice > prod.price) {
      prod.discountPercent = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
    } else {
      prod.discountPercent = 0;
    }

    await saveDatabase();
    res.json(prod);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    db.products.splice(index, 1);
    await saveDatabase();
    res.json({ message: 'Product deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Categories CRUD
app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const db = await getDatabase();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCat: Category = {
      id: `cat_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
      name: name.trim(),
      slug,
      description: description || '',
      image: image || '/src/assets/images/hero_gocart_lifestyle_1791788713972.jpg',
      isActive: isActive !== false,
      productCount: 0,
    };

    db.categories.push(newCat);
    await saveDatabase();
    res.status(201).json(newCat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const cat = db.categories.find((c) => c.id === id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    const { name, description, image, isActive } = req.body;
    if (name) cat.name = name.trim();
    if (description !== undefined) cat.description = description;
    if (image) cat.image = image;
    if (isActive !== undefined) cat.isActive = !!isActive;

    await saveDatabase();
    res.json(cat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const cat = db.categories.find((c) => c.id === id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    // Check if any product is currently using this category
    const productsInCat = db.products.filter(
      (p) => p.category.toLowerCase() === cat.name.toLowerCase()
    );
    if (productsInCat.length > 0) {
      res.status(400).json({
        error: `Cannot delete category "${cat.name}". ${productsInCat.length} products belong to it. Please reassign products first.`,
      });
      return;
    }

    db.categories = db.categories.filter((c) => c.id !== id);
    await saveDatabase();
    res.json({ message: 'Category deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  const { status, q } = req.query;
  const db = await getDatabase();
  let orders = [...db.orders];

  if (status && typeof status === 'string' && status !== 'all') {
    orders = orders.filter((o) => o.orderStatus.toLowerCase() === status.toLowerCase());
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query)
    );
  }

  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(orders);
});

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, trackingCarrier, trackingNumber } = req.body;
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === id);

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingCarrier !== undefined) order.trackingCarrier = trackingCarrier;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;

    order.updatedAt = new Date().toISOString();
    await saveDatabase();

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Customers
app.get('/api/admin/customers', requireAdmin, async (_req, res) => {
  const db = await getDatabase();
  const customers = db.users
    .filter((u) => u.role === 'customer')
    .map((u) => {
      const userOrders = db.orders.filter((o) => o.userId === u.id);
      const totalSpent = userOrders
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.total, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        createdAt: u.createdAt,
        orderCount: userOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
      };
    });

  res.json(customers);
});

app.patch('/api/admin/customers/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'active' && status !== 'suspended') {
      res.status(400).json({ error: 'Status must be active or suspended.' });
      return;
    }

    const db = await getDatabase();
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    user.status = status;
    await saveDatabase();
    res.json({ message: `Customer status updated to ${status}.`, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Coupons
app.get('/api/admin/coupons', requireAdmin, async (_req, res) => {
  const db = await getDatabase();
  res.json(db.coupons);
});

app.post('/api/admin/coupons', requireAdmin, async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      validUntil,
      isActive,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      res.status(400).json({ error: 'Coupon code, discount type, and discount value are required.' });
      return;
    }

    const db = await getDatabase();
    const existing = db.coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase()
    );
    if (existing) {
      res.status(409).json({ error: 'A coupon with this code already exists.' });
      return;
    }

    const newCoupon: Coupon = {
      id: `cpn_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      usageLimit: Number(usageLimit || 100),
      usedCount: 0,
      validUntil: validUntil || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isActive: isActive !== false,
    };

    db.coupons.push(newCoupon);
    await saveDatabase();
    res.status(201).json(newCoupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const cpn = db.coupons.find((c) => c.id === id);
    if (!cpn) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }

    const {
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      validUntil,
      isActive,
    } = req.body;

    if (discountType) cpn.discountType = discountType;
    if (discountValue !== undefined) cpn.discountValue = Number(discountValue);
    if (minOrderAmount !== undefined) cpn.minOrderAmount = Number(minOrderAmount);
    if (maxDiscountAmount !== undefined) cpn.maxDiscountAmount = Number(maxDiscountAmount);
    if (usageLimit !== undefined) cpn.usageLimit = Number(usageLimit);
    if (validUntil) cpn.validUntil = validUntil;
    if (isActive !== undefined) cpn.isActive = !!isActive;

    await saveDatabase();
    res.json(cpn);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    db.coupons = db.coupons.filter((c) => c.id !== id);
    await saveDatabase();
    res.json({ message: 'Coupon deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Reviews
app.get('/api/admin/reviews', requireAdmin, async (_req, res) => {
  const db = await getDatabase();
  const populated = db.reviews.map((r) => {
    const prod = db.products.find((p) => p.id === r.productId);
    return {
      ...r,
      productName: prod?.name || 'Unknown Product',
    };
  });
  res.json(populated);
});

app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const review = db.reviews.find((r) => r.id === id);
    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    const productId = review.productId;
    db.reviews = db.reviews.filter((r) => r.id !== id);

    // Recalculate product rating
    const prod = db.products.find((p) => p.id === productId);
    if (prod) {
      const remainingReviews = db.reviews.filter((r) => r.productId === productId);
      if (remainingReviews.length > 0) {
        const avg =
          remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length;
        prod.rating = parseFloat(avg.toFixed(1));
        prod.reviewCount = remainingReviews.length;
      } else {
        prod.rating = 5.0;
        prod.reviewCount = 0;
      }
    }

    await saveDatabase();
    res.json({ message: 'Review deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// File Upload endpoint
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file uploaded.' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: fileUrl });
});

// Newsletter subscription
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }

    const db = await getDatabase();
    const normalized = email.trim().toLowerCase();
    if (!db.newsletters.some((n) => n.email === normalized)) {
      db.newsletters.push({
        id: `nl_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
        email: normalized,
        subscribedAt: new Date().toISOString(),
      });
      await saveDatabase();
    }

    res.json({ message: 'Thank you for subscribing to GoCart updates.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------------------------------------
 * VITE INTEGRATION & SERVER START
 * ----------------------------------------------------------- */
async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const distImagesPath = path.join(distPath, 'images');

    // Serve dist assets
    app.use(express.static(distPath));

    if (fs.existsSync(distImagesPath)) {
      app.use('/images', express.static(distImagesPath));
      app.use('/src/assets/images', express.static(distImagesPath));
    }

    // Safety guard: ensure static image requests never return index.html
    app.get(/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i, (req, res) => {
      const filename = path.basename(req.path);
      const candidates = [
        path.join(PUBLIC_IMAGES_DIR, filename),
        path.join(distImagesPath, filename),
        path.join(SRC_IMAGES_DIR, filename),
        path.join(PUBLIC_IMAGES_DIR, 'hero_gocart_lifestyle_1791788713972.jpg'),
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return res.sendFile(candidate);
        }
      }
      res.status(404).send('Image not found');
    });

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GoCart full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
