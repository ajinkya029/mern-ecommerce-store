import React, {
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
} from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Package,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const Store = createContext(null);
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}
function Provider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cart") || "[]"),
  );
  useEffect(() => localStorage.setItem("cart", JSON.stringify(cart)), [cart]);
  const add = (product, qty = 1) =>
    setCart((old) => {
      const found = old.find((x) => x._id === product._id);
      return found
        ? old.map((x) =>
            x._id === product._id
              ? { ...x, qty: Math.min(x.qty + qty, product.countInStock) }
              : x,
          )
        : [...old, { ...product, qty }];
    });
  const update = (id, qty) =>
    setCart((old) =>
      old.map((x) =>
        x._id === id
          ? { ...x, qty: Math.max(1, Math.min(qty, x.countInStock)) }
          : x,
      ),
    );
  const remove = (id) => setCart((old) => old.filter((x) => x._id !== id));
  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };
  return (
    <Store.Provider
      value={{ user, cart, add, update, remove, login, logout, setCart }}
    >
      {children}
    </Store.Provider>
  );
}
const useStore = () => useContext(Store);
function Header() {
  const { user, cart, logout } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="nav wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span> NORTHSTAR
          <span className="brand-dot">.</span>
        </Link>
        <nav className={open ? "nav-links show" : "nav-links"}>
          <Link onClick={() => setOpen(false)} to="/">
            Shop
          </Link>
          <a href="/#collections" onClick={() => setOpen(false)}>
            Collections
          </a>
          {user && <Link to="/orders">My orders</Link>}
          {user?.isAdmin && <Link to="/admin">Admin</Link>}
        </nav>
        <div className="nav-actions">
          <Link className="icon-btn" to="/cart" aria-label="Cart">
            <ShoppingBag size={19} />
            <span className="cart-count">
              {cart.reduce((s, x) => s + x.qty, 0)}
            </span>
          </Link>
          {user ? (
            <button className="icon-btn" title="Sign out" onClick={logout}>
              <LogOut size={18} />
            </button>
          ) : (
            <Link className="icon-btn" to="/login">
              <User size={19} />
            </Link>
          )}
          <button className="menu-btn" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
function ProductCard({ p }) {
  const { add } = useStore();
  return (
    <article className="product-card">
      <Link to={`/product/${p._id}`} className="product-image">
        <img src={p.image} alt={p.name} />
        <span className="image-tag">{p.category}</span>
      </Link>
      <div className="product-info">
        <div>
          <Link to={`/product/${p._id}`} className="product-name">
            {p.name}
          </Link>
          <div className="rating">
            ★ {p.rating?.toFixed(1) || "New"}{" "}
            <span>· {p.countInStock} in stock</span>
          </div>
        </div>
        <div className="product-bottom">
          <strong>{money(p.price)}</strong>
          <button
            className="add-btn"
            onClick={() => add(p)}
            disabled={!p.countInStock}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
function Home() {
  const [products, setProducts] = useState([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    request(
      `/products?search=${encodeURIComponent(search)}${category !== "All" ? `&category=${encodeURIComponent(category)}` : ""}`,
    )
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, category]);
  const categories = ["All", "Electronics", "Fashion", "Accessories", "Home"];
  return (
    <>
      <section className="hero">
        <div className="hero-inner wrap">
          <div className="hero-copy">
            <span className="eyebrow">
              THOUGHTFULLY SELECTED · EVERYDAY ESSENTIALS
            </span>
            <h1>
              Good things.
              <br />
              <em>Better living.</em>
            </h1>
            <p>
              Discover considered pieces for the way you live, work and unwind.
              Quality finds, without the noise.
            </p>
            <a className="btn btn-light" href="#shop">
              Explore the collection <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit"></div>
            <img
              src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=1100"
              alt="Curated lifestyle collection"
            />
            <div className="hero-note">
              <span>THE NEW EDIT</span>
              <strong>Everyday, elevated.</strong>
            </div>
          </div>
        </div>
      </section>
      <main className="wrap shop-section" id="shop">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE NORTHSTAR EDIT</span>
            <h2>Find your next favorite.</h2>
          </div>
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
            />
          </div>
        </div>
        <div className="filters">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={category === c ? "filter active" : "filter"}
            >
              {c}
            </button>
          ))}
        </div>
        {error ? (
          <div className="empty">
            <h3>Could not load products</h3>
            <p>{error}. Check that the server and MongoDB are running.</p>
          </div>
        ) : loading ? (
          <div className="loading">Curating your collection...</div>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} p={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No products found</h3>
            <p>Try another search or category.</p>
          </div>
        )}
      </main>
      <section className="collection-band" id="collections">
        <div className="wrap collection-content">
          <div>
            <span className="eyebrow">MADE FOR YOUR EVERY DAY</span>
            <h2>
              Less, but
              <br />
              <em>so much better.</em>
            </h2>
          </div>
          <p>
            We believe the best things earn their place. Explore useful,
            beautiful essentials picked to make everyday moments feel a little
            more special.
          </p>
        </div>
      </section>
    </>
  );
}
function Product() {
  const { id } = useParams(),
    { add } = useStore(),
    [p, setP] = useState(null),
    [err, setErr] = useState("");
  useEffect(() => {
    request(`/products/${id}`)
      .then(setP)
      .catch((e) => setErr(e.message));
  }, [id]);
  if (err)
    return (
      <main className="wrap page">
        <p>{err}</p>
      </main>
    );
  if (!p) return <main className="wrap page">Loading product...</main>;
  return (
    <main className="wrap page">
      <Link to="/" className="back-link">
        ← Back to shop
      </Link>
      <div className="detail-grid">
        <img className="detail-image" src={p.image} alt={p.name} />
        <div className="detail-copy">
          <span className="eyebrow">{p.category}</span>
          <h1>{p.name}</h1>
          <div className="rating">★ {p.rating?.toFixed(1) || "New"}</div>
          <strong className="detail-price">{money(p.price)}</strong>
          <p>{p.description}</p>
          <p className="stock">
            {p.countInStock
              ? `${p.countInStock} available`
              : "Currently out of stock"}
          </p>
          <button
            className="btn btn-dark"
            disabled={!p.countInStock}
            onClick={() => add(p)}
          >
            Add to bag <ShoppingBag size={17} />
          </button>
          <div className="trust">
            <ShieldCheck size={18} /> Secure checkout · Carefully selected
            quality
          </div>
        </div>
      </div>
    </main>
  );
}
function Cart() {
  const { cart, update, remove } = useStore();
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  return (
    <main className="wrap page">
      <span className="eyebrow">YOUR SELECTION</span>
      <h1 className="page-title">Shopping bag</h1>
      {!cart.length ? (
        <div className="empty">
          <ShoppingBag size={35} />
          <h3>Your bag is taking a break.</h3>
          <p>Find something you'll love in our collection.</p>
          <Link className="btn btn-dark" to="/">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((x) => (
              <div className="cart-row" key={x._id}>
                <img src={x.image} alt={x.name} />
                <div className="cart-desc">
                  <Link to={`/product/${x._id}`}>{x.name}</Link>
                  <span>{money(x.price)}</span>
                  <div className="qty">
                    <button onClick={() => update(x._id, x.qty - 1)}>
                      <Minus size={14} />
                    </button>
                    <span>{x.qty}</span>
                    <button onClick={() => update(x._id, x.qty + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <strong>{money(x.price * x.qty)}</strong>
                <button
                  className="remove-btn"
                  onClick={() => remove(x._id)}
                  aria-label="Remove"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <aside className="summary">
            <h3>Order summary</h3>
            <div>
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <Link className="btn btn-dark full" to="/checkout">
              Continue to checkout <ArrowRight size={17} />
            </Link>
            <p className="muted">
              Taxes and shipping details are confirmed before payment.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
function Auth({ mode }) {
  const { login } = useStore(),
    nav = useNavigate(),
    [form, setForm] = useState({ name: "", email: "", password: "" }),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const data = await request(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      login(data);
      nav("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">
          {mode === "login" ? "WELCOME BACK" : "JOIN THE NORTHSTAR COMMUNITY"}
        </span>
        <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="muted">A better everyday starts here.</p>
        {mode === "register" && (
          <label>
            Full name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
        )}
        <label>
          Email address
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            required
            minLength="8"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {err && <p className="error">{err}</p>}
        <button className="btn btn-dark full" disabled={busy}>
          {busy
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
        <p className="auth-switch">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </form>
    </main>
  );
}
function Checkout() {
  const { cart, setCart, user } = useStore(),
    nav = useNavigate(),
    [address, setAddress] = useState({
      fullName: user?.name || "",
      address: "",
      city: "",
      postalCode: "",
      country: "India",
    }),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await request("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((x) => ({ product: x._id, qty: x.qty })),
          shippingAddress: address,
        }),
      });
      setCart([]);
      nav("/orders");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!cart.length)
    return (
      <main className="wrap page empty">
        <h2>Your bag is empty</h2>
        <Link to="/">Return to shop</Link>
      </main>
    );
  return (
    <main className="wrap page">
      <span className="eyebrow">ALMOST YOURS</span>
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-grid">
        <form className="auth-card checkout-form" onSubmit={submit}>
          <h3>Delivery details</h3>
          {[
            ["fullName", "Full name"],
            ["address", "Street address"],
            ["city", "City"],
            ["postalCode", "Postal code"],
            ["country", "Country"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required
                value={address[key]}
                onChange={(e) =>
                  setAddress({ ...address, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <p className="muted">
            Demo checkout only — no real payment will be collected.
          </p>
          {err && <p className="error">{err}</p>}
          <button className="btn btn-dark full" disabled={busy}>
            {busy ? "Placing order..." : `Place demo order · ${money(total)}`}
          </button>
        </form>
        <aside className="summary">
          <h3>Your order</h3>
          {cart.map((x) => (
            <div key={x._id}>
              <span>
                {x.name} × {x.qty}
              </span>
              <strong>{money(x.price * x.qty)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}
function Orders() {
  const [orders, setOrders] = useState([]),
    [err, setErr] = useState("");
  useEffect(() => {
    request("/orders/my")
      .then(setOrders)
      .catch((e) => setErr(e.message));
  }, []);
  return (
    <main className="wrap page">
      <span className="eyebrow">YOUR NORTHSTAR ACCOUNT</span>
      <h1 className="page-title">Your orders</h1>
      {err ? (
        <p className="error">{err}</p>
      ) : orders.length ? (
        <div className="order-list">
          {orders.map((o) => (
            <article className="order-card" key={o._id}>
              <div className="order-head">
                <strong>Order #{o._id.slice(-7).toUpperCase()}</strong>
                <span className="status">{o.status}</span>
              </div>
              <p className="muted">
                {new Date(o.createdAt).toLocaleDateString("en-IN")} ·{" "}
                {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
              </p>
              <strong>{money(o.totalPrice)}</strong>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Package size={34} />
          <h3>No orders yet</h3>
          <Link className="btn btn-dark" to="/">
            Explore the shop
          </Link>
        </div>
      )}
    </main>
  );
}
function Admin() {
  const [orders, setOrders] = useState([]),
    [products, setProducts] = useState([]),
    [err, setErr] = useState(""),
    [form, setForm] = useState({
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
      countInStock: "",
    });
  const load = () =>
    Promise.all([request("/admin/orders"), request("/products")])
      .then(([o, p]) => {
        setOrders(o);
        setProducts(p);
      })
      .catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);
  const create = async (e) => {
    e.preventDefault();
    try {
      await request("/admin/products", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          countInStock: Number(form.countInStock),
        }),
      });
      setForm({
        name: "",
        description: "",
        price: "",
        category: "",
        image: "",
        countInStock: "",
      });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };
  const status = async (id, value) => {
    try {
      await request(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <main className="wrap page">
      <span className="eyebrow">STORE MANAGEMENT</span>
      <h1 className="page-title">Admin dashboard</h1>
      {err && <p className="error">{err}</p>}
      <h2>Orders</h2>
      <div className="admin-list">
        {orders.map((o) => (
          <div className="admin-row" key={o._id}>
            <div>
              <strong>
                #{o._id.slice(-7).toUpperCase()} · {o.user?.name}
              </strong>
              <p className="muted">
                {money(o.totalPrice)} · {o.items.length} line items
              </p>
            </div>
            <select
              value={o.status}
              onChange={(e) => status(o._id, e.target.value)}
            >
              {["Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <h2 className="admin-subtitle">Add a product</h2>
      <form className="admin-form" onSubmit={create}>
        {[
          ["name", "Product name"],
          ["description", "Description"],
          ["price", "Price (INR)"],
          ["category", "Category"],
          ["image", "Image URL"],
          ["countInStock", "Stock quantity"],
        ].map(([k, l]) => (
          <label key={k}>
            {l}
            <input
              required
              value={form[k]}
              type={["price", "countInStock"].includes(k) ? "number" : "text"}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}
        <button className="btn btn-dark">Add product</button>
      </form>
      <h2 className="admin-subtitle">Products ({products.length})</h2>
      <div className="admin-list">
        {products.map((p) => (
          <div className="admin-row" key={p._id}>
            <span>
              {p.name} · {money(p.price)}
            </span>
            <button
              className="text-danger"
              onClick={async () => {
                if (confirm(`Delete ${p.name}?`)) {
                  await request(`/admin/products/${p._id}`, {
                    method: "DELETE",
                  });
                  load();
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
function Protected({ children, adminOnly = false }) {
  const { user } = useStore();
  return !user ? (
    <Auth mode="login" />
  ) : adminOnly && !user.isAdmin ? (
    <main className="wrap page">
      <h2>Admin access required</h2>
    </main>
  ) : (
    children
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span> NORTHSTAR
          <span className="brand-dot">.</span>
        </Link>
        <span>Thoughtful finds for everyday living.</span>
        <span>© {new Date().getFullYear()} Northstar Store</span>
      </div>
    </footer>
  );
}
export default function App() {
  return (
    <Provider>
      <div className="app-shell">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route
            path="/checkout"
            element={
              <Protected>
                <Checkout />
              </Protected>
            }
          />
          <Route
            path="/orders"
            element={
              <Protected>
                <Orders />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected adminOnly>
                <Admin />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <main className="wrap page">
                <h1>Page not found</h1>
                <Link to="/">Go home</Link>
              </main>
            }
          />
        </Routes>
        <Footer />
      </div>
    </Provider>
  );
}
