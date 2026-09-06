import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://e-commerce-1-fbnp.onrender.com/api';

const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await axios.post(`${API_BASE}/products/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${user.token}`,
      },
    });
    setNewProduct((prev) => ({ ...prev, image: res.data.imageUrl }));
    alert('Image uploaded successfully!');
  } catch (err) {
    alert(err.response?.data?.message || 'Image upload failed');
  }
};

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [view, setView] = useState('store'); // 'store' | 'myOrders' | 'admin'

  // Search & Filter state
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Orders state
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  // Admin new product form state
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
    image: '',
    stock: '',
  });

  // Auth form state
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '', role: 'user' });

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.append('keyword', keyword.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);

      const res = await axios.get(`${API_BASE}/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/orders/myorders`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMyOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchAllOrders = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAllOrders(res.data);
    } catch (err) {
      console.error('Error fetching all orders:', err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/users/login' : '/users/register';
      const payload =
        authMode === 'login'
          ? { email: authData.email, password: authData.password }
          : authData;

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      alert(`Logged in as ${res.data.name} (${res.data.role})`);
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setView('store');
  };

  const addToCart = (product) => {
    const exists = cart.find((item) => item._id === product._id);
    if (exists) {
      setCart(
        cart.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const checkout = async () => {
    if (!user) {
      alert('Please log in first to checkout.');
      return;
    }
    try {
      const orderItems = cart.map((item) => ({
        product: item._id,
        title: item.title,
        qty: item.qty,
        price: item.price,
      }));
      const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

      await axios.post(
        `${API_BASE}/orders`,
        { orderItems, totalPrice },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Order placed successfully!');
      setCart([]);
      fetchMyOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Order failed');
    }
  };

  // Admin Actions
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE}/products`,
        {
          ...newProduct,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock),
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Product created!');
      setNewProduct({ title: '', price: '', description: '', category: '', image: '', stock: '' });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_BASE}/products/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchAllOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order');
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ display: 'inline-block', marginRight: '20px' }}>E-Commerce Store</h2>
          <button onClick={() => setView('store')} style={{ marginRight: '8px', padding: '6px 12px', cursor: 'pointer' }}>Store</button>
          {user && (
            <button
              onClick={() => {
                setView('myOrders');
                fetchMyOrders();
              }}
              style={{ marginRight: '8px', padding: '6px 12px', cursor: 'pointer' }}
            >
              My Orders
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setView('admin');
                fetchAllOrders();
              }}
              style={{ padding: '6px 12px', cursor: 'pointer', background: '#343a40', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
              Admin Dashboard
            </button>
          )}
        </div>

        <div>
          {user ? (
            <div>
              <span>Welcome, <strong>{user.name}</strong> ({user.role}) </span>
              <button onClick={logout} style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
            </div>
          ) : (
            <span>Not logged in</span>
          )}
        </div>
      </header>

      {/* VIEW 1: Store & Catalog */}
      {view === 'store' && (
        <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '24px' }}>
          <div>
            <h3>Catalog</h3>

            {/* Search & Filter Bar */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', margin: '14px 0 20px 0' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button
                type="submit"
                style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Search
              </button>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="All">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
              </select>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {products.length === 0 ? (
                <p>No products match your search/filter.</p>
              ) : (
                products.map((p) => (
                  <div key={p._id} style={{ border: '1px solid #eee', padding: '16px', borderRadius: '8px', background: '#fff' }}>
                    <img src={p.image} alt={p.title} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px' }} />
                    <h4 style={{ marginTop: '8px' }}>{p.title}</h4>
                    <span style={{ fontSize: '12px', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px', color: '#555' }}>
                      {p.category}
                    </span>
                    <p style={{ color: '#666', fontSize: '14px', margin: '6px 0' }}>{p.description}</p>
                    <p><strong>${p.price.toFixed(2)}</strong></p>
                    <button
                      onClick={() => addToCart(p)}
                      style={{ cursor: 'pointer', padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '8px' }}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar: Auth & Cart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {!user && (
              <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', background: '#fff' }}>
                <h4>{authMode === 'login' ? 'Login' : 'Register'}</h4>
                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {authMode === 'register' && (
                    <>
                      <input
                        type="text"
                        placeholder="Name"
                        required
                        value={authData.name}
                        onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                        style={{ padding: '8px' }}
                      />
                      <select
                        value={authData.role}
                        onChange={(e) => setAuthData({ ...authData, role: e.target.value })}
                        style={{ padding: '8px' }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </>
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    style={{ padding: '8px' }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    style={{ padding: '8px' }}
                  />
                  <button type="submit" style={{ padding: '8px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {authMode === 'login' ? 'Login' : 'Register'}
                  </button>
                </form>
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginTop: '10px', padding: 0 }}
                >
                  {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
                </button>
              </div>
            )}

            {/* Cart Box */}
            <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', background: '#fff' }}>
              <h3>Shopping Cart</h3>
              {cart.length === 0 ? (
                <p style={{ marginTop: '8px' }}>Your cart is empty.</p>
              ) : (
                <div style={{ marginTop: '8px' }}>
                  {cart.map((item) => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span>{item.title} (x{item.qty})</span>
                      <span>
                        ${(item.price * item.qty).toFixed(2)}{' '}
                        <button onClick={() => removeFromCart(item._id)} style={{ marginLeft: '6px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>✕</button>
                      </span>
                    </div>
                  ))}
                  <hr style={{ margin: '12px 0' }} />
                  <p><strong>Total: ${cart.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)}</strong></p>
                  <button onClick={checkout} style={{ width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '8px' }}>
                    Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: User Order History */}
      {view === 'myOrders' && (
        <section style={{ marginTop: '24px' }}>
          <h3>My Orders</h3>
          {myOrders.length === 0 ? (
            <p style={{ marginTop: '8px' }}>You haven't placed any orders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              {myOrders.map((o) => (
                <div key={o._id} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Order #{o._id}</strong>
                    <span>Status: <strong style={{ color: o.status === 'Delivered' ? 'green' : 'orange' }}>{o.status}</strong></span>
                  </div>
                  <ul style={{ margin: '10px 0 10px 20px' }}>
                    {o.orderItems.map((item, idx) => (
                      <li key={idx}>
                        {item.title} - {item.qty} × ${item.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                  <p><strong>Total Paid: ${o.totalPrice.toFixed(2)}</strong></p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* VIEW 3: Admin Dashboard */}
      {view === 'admin' && (
        <section style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Add Product Form */}
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fff' }}>
            <h3>Admin: Add New Product</h3>
            <form onSubmit={handleCreateProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <input
                type="text"
                placeholder="Product Title"
                required
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                style={{ padding: '8px' }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                style={{ padding: '8px' }}
              />
              <input
                type="text"
                placeholder="Category"
                required
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                style={{ padding: '8px' }}
              />
              <input
                type="number"
                placeholder="Stock Count"
                required
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                style={{ padding: '8px' }}
              />
              <input
                type="text"
                placeholder="Image URL"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                style={{ padding: '8px', gridColumn: 'span 2' }}
              />
              <textarea
                placeholder="Description"
                required
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                style={{ padding: '8px', gridColumn: 'span 2', height: '60px' }}
              />
              <button type="submit" style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', gridColumn: 'span 2' }}>
                Save Product
              </button>
            </form>
          </div>

          {/* Manage Inventory Table */}
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fff' }}>
            <h3>Manage Existing Inventory</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '8px' }}>Title</th>
                  <th style={{ padding: '8px' }}>Category</th>
                  <th style={{ padding: '8px' }}>Price</th>
                  <th style={{ padding: '8px' }}>Stock</th>
                  <th style={{ padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{p.title}</td>
                    <td style={{ padding: '8px' }}>{p.category}</td>
                    <td style={{ padding: '8px' }}>${p.price.toFixed(2)}</td>
                    <td style={{ padding: '8px' }}>{p.stock}</td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer Orders Table */}
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fff' }}>
            <h3>All Customer Orders</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {allOrders.map((o) => (
                <div key={o._id} style={{ border: '1px solid #eee', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Order ID:</strong> {o._id} | <strong>User:</strong> {o.user?.name} ({o.user?.email})
                    </div>
                    <div>
                      <label style={{ marginRight: '6px' }}>Status:</label>
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                        style={{ padding: '4px 8px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#555' }}>
                    Items: {o.orderItems.map((i) => `${i.title} (x${i.qty})`).join(', ')} — <strong>Total: ${o.totalPrice.toFixed(2)}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;