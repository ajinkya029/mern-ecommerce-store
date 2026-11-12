import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, isAdmin: Boolean });
const productSchema = new mongoose.Schema({ name: String, description: String, price: Number, category: String, image: String, countInStock: Number, rating: Number });
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
await mongoose.connect(process.env.MONGO_URI);
await User.deleteMany({ email: 'admin@example.com' });
await User.create({ name: 'Store Admin', email: 'admin@example.com', password: await bcrypt.hash('Admin123!', 12), isAdmin: true });
await Product.deleteMany({});
await Product.insertMany([
  { name: 'Everyday Backpack', description: 'A durable everyday backpack with a padded laptop sleeve and water-resistant finish.', price: 2499, category: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900', countInStock: 18, rating: 4.7 },
  { name: 'Minimal Wireless Headphones', description: 'Comfortable over-ear headphones with rich sound and long battery life.', price: 3999, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900', countInStock: 12, rating: 4.8 },
  { name: 'Classic Sneakers', description: 'Versatile low-top sneakers designed for everyday comfort.', price: 3299, category: 'Fashion', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900', countInStock: 20, rating: 4.5 },
  { name: 'Ceramic Coffee Set', description: 'A clean, modern ceramic cup set for slow mornings and shared coffee.', price: 1499, category: 'Home', image: 'https://images.unsplash.com/photo-1514228742587-6b1558f6b1c9?w=900', countInStock: 9, rating: 4.6 },
  { name: 'Smart Watch', description: 'A lightweight smart watch for notifications, activity tracking and daily wear.', price: 5499, category: 'Electronics', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900', countInStock: 14, rating: 4.4 },
  { name: 'Desk Lamp', description: 'An adjustable desk lamp with a warm, focused glow for your workspace.', price: 1899, category: 'Home', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900', countInStock: 7, rating: 4.3 }
]);
console.log('Seed complete. Admin: admin@example.com / Admin123!');
await mongoose.disconnect();
