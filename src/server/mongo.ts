import mongoose, { Schema, Document } from 'mongoose';
import { DatabaseSchema, User, Address, Category, Product, Review, Cart, Wishlist, Coupon, Order, Newsletter } from './types.js';

export const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://ujjwalawasthi7597_db_user:yz7brXwntCO4LH4A@cluster0.pq6kody.mongodb.net/gocart?retryWrites=true&w=majority&appName=Cluster0';

// Define Mongoose schemas with strict: false or exact schema definitions
const UserSchema = new Schema<User>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'customer' },
  phone: String,
  avatar: String,
  status: { type: String, default: 'active' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false, _id: false });

const AddressSchema = new Schema<Address>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: false, versionKey: false, _id: false });

const CategorySchema = new Schema<Category>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 },
}, { timestamps: false, versionKey: false, _id: false });

const ProductSchema = new Schema<Product>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  details: [String],
  category: { type: String, required: true, index: true },
  brand: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sku: { type: String, default: '' },
  images: [String],
  rating: { type: Number, default: 5 },
  reviewCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false, _id: false });

const ReviewSchema = new Schema<Review>({
  id: { type: String, required: true, unique: true, index: true },
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userAvatar: String,
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  isVerifiedPurchase: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false, _id: false });

const CartSchema = new Schema<Cart>({
  userId: { type: String, required: true, unique: true, index: true },
  items: [
    {
      productId: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      selectedVariant: String,
    },
  ],
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false, _id: false });

const WishlistSchema = new Schema<Wishlist>({
  userId: { type: String, required: true, unique: true, index: true },
  productIds: [String],
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false, _id: false });

const CouponSchema = new Schema<Coupon>({
  id: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  discountType: { type: String, required: true },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: Number,
  usageLimit: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  validUntil: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: false, versionKey: false, _id: false });

const OrderSchema = new Schema<Order>({
  id: { type: String, required: true, unique: true, index: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, index: true },
  customerPhone: { type: String, default: '' },
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      originalPrice: Number,
      quantity: Number,
      image: String,
      sku: String,
    },
  ],
  subtotal: Number,
  discount: Number,
  couponCode: String,
  shippingFee: Number,
  tax: Number,
  total: Number,
  paymentMethod: String,
  paymentStatus: String,
  orderStatus: String,
  trackingCarrier: String,
  trackingNumber: String,
  notes: String,
  createdAt: String,
  updatedAt: String,
}, { timestamps: false, versionKey: false, _id: false });

const NewsletterSchema = new Schema<Newsletter>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  subscribedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false, _id: false });

// Register models safely
export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema);
export const AddressModel = mongoose.models.Address || mongoose.model<Address>('Address', AddressSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model<Category>('Category', CategorySchema);
export const ProductModel = mongoose.models.Product || mongoose.model<Product>('Product', ProductSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model<Review>('Review', ReviewSchema);
export const CartModel = mongoose.models.Cart || mongoose.model<Cart>('Cart', CartSchema);
export const WishlistModel = mongoose.models.Wishlist || mongoose.model<Wishlist>('Wishlist', WishlistSchema);
export const CouponModel = mongoose.models.Coupon || mongoose.model<Coupon>('Coupon', CouponSchema);
export const OrderModel = mongoose.models.Order || mongoose.model<Order>('Order', OrderSchema);
export const NewsletterModel = mongoose.models.Newsletter || mongoose.model<Newsletter>('Newsletter', NewsletterSchema);

let isConnected = false;
let isConnecting = false;

export async function connectMongoDB(): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }
  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 20) {
      await new Promise((r) => setTimeout(r, 200));
      if (mongoose.connection.readyState === 1) return true;
      attempts++;
    }
  }

  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ Connected successfully to MongoDB Atlas cluster0.pq6kody.mongodb.net (Database: gocart)');
    return true;
  } catch (err: any) {
    console.error('⚠️ MongoDB connection attempt failed:', err.message);
    isConnected = false;
    return false;
  } finally {
    isConnecting = false;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Load all collections from MongoDB into a DatabaseSchema object
 */
export async function loadFromMongoDB(): Promise<DatabaseSchema | null> {
  try {
    const [
      users,
      addresses,
      categories,
      products,
      reviews,
      carts,
      wishlists,
      coupons,
      orders,
      newsletters,
    ] = await Promise.all([
      UserModel.find({}).lean(),
      AddressModel.find({}).lean(),
      CategoryModel.find({}).lean(),
      ProductModel.find({}).lean(),
      ReviewModel.find({}).lean(),
      CartModel.find({}).lean(),
      WishlistModel.find({}).lean(),
      CouponModel.find({}).lean(),
      OrderModel.find({}).lean(),
      NewsletterModel.find({}).lean(),
    ]);

    return {
      users: users as unknown as User[],
      addresses: addresses as unknown as Address[],
      categories: categories as unknown as Category[],
      products: products as unknown as Product[],
      reviews: reviews as unknown as Review[],
      carts: carts as unknown as Cart[],
      wishlists: wishlists as unknown as Wishlist[],
      coupons: coupons as unknown as Coupon[],
      orders: orders as unknown as Order[],
      newsletters: newsletters as unknown as Newsletter[],
    };
  } catch (err) {
    console.error('Error loading collections from MongoDB:', err);
    return null;
  }
}

/**
 * Synchronize entire dataset into MongoDB collections
 */
export async function saveToMongoDB(data: DatabaseSchema): Promise<boolean> {
  if (!isMongoConnected()) {
    const ok = await connectMongoDB();
    if (!ok) return false;
  }

  try {
    const syncCollection = async (model: any, items: any[], idField = 'id') => {
      if (!items || items.length === 0) return;
      const ops = items.map((item) => ({
        updateOne: {
          filter: { [idField]: item[idField] },
          update: { $set: item },
          upsert: true,
        },
      }));
      await model.bulkWrite(ops);
    };

    await Promise.all([
      syncCollection(UserModel, data.users, 'id'),
      syncCollection(AddressModel, data.addresses, 'id'),
      syncCollection(CategoryModel, data.categories, 'id'),
      syncCollection(ProductModel, data.products, 'id'),
      syncCollection(ReviewModel, data.reviews, 'id'),
      syncCollection(CartModel, data.carts, 'userId'),
      syncCollection(WishlistModel, data.wishlists, 'userId'),
      syncCollection(CouponModel, data.coupons, 'id'),
      syncCollection(OrderModel, data.orders, 'id'),
      syncCollection(NewsletterModel, data.newsletters, 'id'),
    ]);

    return true;
  } catch (err) {
    console.error('Error saving data to MongoDB:', err);
    return false;
  }
}
