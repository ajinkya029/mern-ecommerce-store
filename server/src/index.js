import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const { Schema } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });
const productSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  category: String,
  image: String,
  countInStock: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0 }
}, { timestamps: true });
const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, image: String, price: Number, qty: Number }],
  shippingAddress: { fullName: String, address: String, city: String, postalCode: String, country: String },
  totalPrice: Number,
  paymentMethod: { type: String, default: 'Demo checkout' },
  status: { type: String, default: 'Processing' }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

const signToken = user => jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
};
const admin = (req, res, next) => req.user?.isAdmin ? next() : res.status(403).json({ message: 'Admin access required' });
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and password (8+ characters) are required' });
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
}));
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user || !await bcrypt.compare(req.body.password || '', user.password)) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
}));

app.get('/api/products', asyncRoute(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  res.json(await Product.find(filter).sort({ createdAt: -1 }));
}));
app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}));
app.post('/api/admin/products', auth, admin, asyncRoute(async (req, res) => res.status(201).json(await Product.create(req.body))));
app.put('/api/admin/products/:id', auth, admin, asyncRoute(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}));
app.delete('/api/admin/products/:id', auth, admin, asyncRoute(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Product deleted' });
}));

app.post('/api/orders', auth, asyncRoute(async (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!Array.isArray(items) || !items.length || !shippingAddress?.fullName || !shippingAddress?.address) return res.status(400).json({ message: 'Cart and shipping details are required' });
  let totalPrice = 0; const normalized = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    const qty = Math.max(1, Number(item.qty) || 1);
    if (!product || product.countInStock < qty) return res.status(400).json({ message: `${product?.name || 'Product'} is unavailable in that quantity` });
    product.countInStock -= qty; await product.save();
    normalized.push({ product: product._id, name: product.name, image: product.image, price: product.price, qty });
    totalPrice += product.price * qty;
  }
  const order = await Order.create({ user: req.user._id, items: normalized, shippingAddress, totalPrice });
  res.status(201).json(order);
}));
app.get('/api/orders/my', auth, asyncRoute(async (req, res) => res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }))));
app.get('/api/admin/orders', auth, admin, asyncRoute(async (req, res) => res.json(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }))));
app.patch('/api/admin/orders/:id/status', auth, admin, asyncRoute(async (req, res) => {
  const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.name === 'CastError' ? 400 : 500).json({ message: err.message || 'Server error' });
});
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}).catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
