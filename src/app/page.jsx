'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        label: '🦕 Tất Cả'      },
  { id: 'carnivore',  label: '🦖 Ăn Thịt'     },
  { id: 'herbivore',  label: '🌿 Ăn Cỏ'       },
  { id: 'flyer',      label: '🦅 Bay'          },
  { id: 'aquatic',    label: '🐬 Dưới Nước'   },
  { id: 'boss',       label: '💀 Boss'         },
  { id: 'utility',    label: '⚙️ Hỗ Trợ'      },
];

const CAT_LABELS = {
  carnivore: 'Ăn Thịt',
  herbivore: 'Ăn Cỏ',
  flyer:     'Bay',
  aquatic:   'Dưới Nước',
  boss:      'Boss',
  utility:   'Hỗ Trợ',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function DinoImage({ src, alt }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <div className="img-placeholder">🦕</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setError(true)} />
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [dinos,      setDinos]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('all');
  const [toast,      setToast]      = useState(null);

  // Cart state: { [dinoId]: quantity }
  const [cart, setCart]             = useState({});
  const [showCartModal, setShowCartModal] = useState(false);
  const [ingameName, setIngameName] = useState('');
  const [orderNote, setOrderNote]   = useState('');

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ark_shop_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('ark_shop_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const fetchDinos = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res  = await fetch('/api/dinos?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      setDinos(Array.isArray(data) ? data : []);
    } catch {
      if (!silent) showToast('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  // Fetch lần đầu
  useEffect(() => { fetchDinos(false); }, [fetchDinos]);

  // Auto-refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => fetchDinos(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchDinos]);

  // Refresh khi user quay lại tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDinos(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchDinos]);

  // Cart actions
  const addToCart = (id) => {
    setCart(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      const copy = { ...prev };
      if (newQty <= 0) {
        delete copy[id];
      } else {
        copy[id] = newQty;
      }
      return copy;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Cart totals calculation
  const totalCartItems = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const cartTotals = Object.entries(cart).reduce((acc, [id, qty]) => {
    const dino = dinos.find(d => d.id === id);
    if (!dino || qty <= 0) return acc;
    const curr = dino.currency || 'Cá';
    const itemTotal = (Number(dino.price) || 0) * qty;
    acc[curr] = (acc[curr] || 0) + itemTotal;
    return acc;
  }, {});

  // Filter + sort: featured first
  const filtered = dinos
    .filter(d => {
      const matchCat = category === 'all' || d.category === category;
      const matchSrch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
                        (d.description || '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSrch;
    })
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return 0;
    });

  const stats = {
    total:     dinos.length,
    available: dinos.filter(d => d.available).length,
    featured:  dinos.filter(d => d.featured).length,
  };

  const serverName    = process.env.NEXT_PUBLIC_SERVER_NAME    || 'ARK Mobile Server';
  const serverContact = process.env.NEXT_PUBLIC_SERVER_CONTACT || 'Liên hệ Admin để đặt hàng';
  const serverDiscord = process.env.NEXT_PUBLIC_SERVER_DISCORD || '#';

  // Copy order summary to clipboard
  const handleCopyOrder = () => {
    let lines = [`📋 ĐƠN HÀNG ARK — ${serverName}`];
    if (ingameName.trim()) lines.push(`👤 Ingame / Tribe: ${ingameName.trim()}`);
    lines.push(`───────────────`);
    
    Object.entries(cart).forEach(([id, qty]) => {
      const dino = dinos.find(d => d.id === id);
      if (dino && qty > 0) {
        const itemSubtotal = (Number(dino.price) || 0) * qty;
        lines.push(`• ${dino.name} (x${qty}): ${itemSubtotal.toLocaleString('vi-VN')} ${dino.currency}`);
      }
    });

    lines.push(`───────────────`);
    lines.push(`💰 TỔNG CỘNG:`);
    Object.entries(cartTotals).forEach(([curr, total]) => {
      lines.push(`👉 ${total.toLocaleString('vi-VN')} ${curr}`);
    });
    if (orderNote.trim()) lines.push(`📝 Ghi chú: ${orderNote.trim()}`);

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText);
    showToast('✅ Đã sao chép đơn hàng! Hãy gửi cho Admin', 'success');
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="site-logo">
            🦖 ARK <span>Shop</span>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <a href={serverDiscord} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
              Discord
            </a>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fetchDinos(false)}
              disabled={refreshing}
              title="Cập nhật bảng giá"
              style={{ minWidth:80 }}
            >
              {refreshing ? '⏳ ...' : '🔄 Refresh'}
            </button>
            <a href="/admin" className="btn btn-ghost btn-sm">⚙ Admin</a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-tag">🌿 Official Price List</div>
        <h1>Bảng Giá Dino & Vật Phẩm<br />{serverName}</h1>
        <p>{serverContact}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowCartModal(true)}>
            🛒 Xem Đơn Hàng ({totalCartItems})
          </button>
          <a href={serverDiscord} target="_blank" rel="noopener" className="btn btn-outline">
            💬 Discord Server
          </a>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stat-chip">
          <div>
            <div className="stat-num">{stats.total}</div>
            <div className="stat-lbl">Tổng Item/Dino</div>
          </div>
        </div>
        <div className="stat-chip">
          <div>
            <div className="stat-num" style={{ color:'var(--green)' }}>{stats.available}</div>
            <div className="stat-lbl">Còn Hàng</div>
          </div>
        </div>
        <div className="stat-chip">
          <div>
            <div className="stat-num" style={{ color:'var(--gold)' }}>{stats.featured}</div>
            <div className="stat-lbl">Nổi Bật</div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            placeholder="Tìm theo tên, mô tả..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="cat-filters">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`cat-btn${category === c.id ? ' active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dino Grid ── */}
      <main className="dino-grid">
        {loading ? (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0' }}>
            <div className="spinner" style={{ margin:'0 auto 12px' }} />
            <p style={{ color:'var(--text-2)' }}>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>Không tìm thấy mục nào</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filtered.map(dino => (
            <DinoCard
              key={dino.id}
              dino={dino}
              cartQty={cart[dino.id] || 0}
              onAddToCart={() => addToCart(dino.id)}
              onUpdateQty={(delta) => updateQuantity(dino.id, delta)}
            />
          ))
        )}
      </main>

      {/* ── Floating Cart Button ── */}
      {totalCartItems > 0 && (
        <button className="floating-cart-btn" onClick={() => setShowCartModal(true)}>
          🛒 Đơn Hàng Của Bạn
          <span className="cart-badge">{totalCartItems}</span>
        </button>
      )}

      {/* ── Order / Cart Modal ── */}
      {showCartModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowCartModal(false); }}>
          <div className="cart-modal">
            <div className="modal-header">
              <h3>🛒 Chi Tiết Đơn Hàng</h3>
              <button className="close-btn" onClick={() => setShowCartModal(false)}>✕</button>
            </div>

            {totalCartItems === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <h4 style={{ color: 'var(--text-2)', marginBottom: 8 }}>Chưa chọn item nào</h4>
                <p>Nhấn "+ Thêm vào đơn" ở các dino/vật phẩm để tính tổng tiền</p>
              </div>
            ) : (
              <>
                {/* List of items */}
                <div className="cart-items-list">
                  {Object.entries(cart).map(([id, qty]) => {
                    const dino = dinos.find(d => d.id === id);
                    if (!dino || qty <= 0) return null;
                    const subtotal = (Number(dino.price) || 0) * qty;
                    return (
                      <div key={id} className="cart-item-card">
                        <DinoImage src={dino.imageUrl} alt={dino.name} />
                        <div className="cart-item-info">
                          <div className="cart-item-name">{dino.name}</div>
                          <div className="cart-item-price">
                            {Number(dino.price).toLocaleString('vi-VN')} {dino.currency} × {qty} ={' '}
                            <strong>{subtotal.toLocaleString('vi-VN')} {dino.currency}</strong>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(id, -1)}>-</button>
                          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(id, 1)}>+</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateQuantity(id, -qty)} title="Xóa">🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input fields */}
                <div className="field">
                  <label className="label">Tên Ingame / Tribe (Tuỳ chọn)</label>
                  <input
                    className="input"
                    placeholder="VD: Player1 (Tribe Alpha)"
                    value={ingameName}
                    onChange={e => setIngameName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Ghi Chú Đơn Hàng (Tuỳ chọn)</label>
                  <input
                    className="input"
                    placeholder="VD: Đặt giao tại Red Obelisk..."
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                  />
                </div>

                {/* Total box */}
                <div className="cart-totals-box">
                  <div style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 8 }}>
                    💰 TỔNG CỘNG TẤT CẢ ITEM:
                  </div>
                  {Object.entries(cartTotals).map(([curr, total]) => (
                    <div key={curr} className="cart-total-row">
                      <span className="cart-total-label">Tổng tiền ({curr}):</span>
                      <span className="cart-total-val">{total.toLocaleString('vi-VN')} {curr}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCopyOrder}>
                    📋 Copy Đơn Hàng
                  </button>
                  <button className="btn btn-ghost" onClick={clearCart} title="Xóa tất cả đơn hàng">
                    🗑️ Làm Mới
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p>🦖 <strong>{serverName}</strong> · Bảng giá có thể thay đổi mà không cần thông báo trước.</p>
          <p style={{ marginTop:8 }}>
            Liên hệ Admin qua{' '}
            <a href={serverDiscord} target="_blank" rel="noopener">Discord</a> để đặt hàng và thương lượng giá.
          </p>
        </div>
      </footer>

      {/* ── Toast ── */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}

// ─── Dino Card ────────────────────────────────────────────────────────────────
function DinoCard({ dino, cartQty, onAddToCart, onUpdateQty }) {
  const hasDiscount = dino.originalPrice && Number(dino.originalPrice) > Number(dino.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(dino.originalPrice) - Number(dino.price)) / Number(dino.originalPrice)) * 100)
    : 0;

  return (
    <article className="dino-card">
      {dino.featured ? (
        <div className="featured-ribbon">HOT</div>
      ) : hasDiscount ? (
        <div className="featured-ribbon" style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }}>
          -{discountPercent}%
        </div>
      ) : null}

      {/* Image */}
      <div className="card-img-wrap">
        <DinoImage src={dino.imageUrl} alt={dino.name} />
        {!dino.available && (
          <div className="out-of-stock-overlay">🔴 HẾT HÀNG</div>
        )}
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="card-top">
          <h3 className="dino-name">{dino.name}</h3>
          {dino.level && <span className="dino-level">Lv.{dino.level}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span className={`badge cat-${dino.category}`}>
            {CAT_LABELS[dino.category] || dino.category}
          </span>
          {hasDiscount && (
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)' }}>
              🔥 GIẢM {discountPercent}%
            </span>
          )}
        </div>

        {dino.description && (
          <p className="dino-desc">{dino.description}</p>
        )}

        <div className="card-footer">
          <div>
            {hasDiscount && (
              <div style={{ fontSize: 12, textDecoration: 'line-through', color: 'var(--text-3)', fontWeight: 600 }}>
                {Number(dino.originalPrice).toLocaleString('vi-VN')} {dino.currency}
              </div>
            )}
            <div className="price-block">
              <span className="price-amount">{Number(dino.price).toLocaleString('vi-VN')}</span>
              <span className="price-currency">{dino.currency}</span>
            </div>
          </div>

          {dino.available ? (
            <span className="badge" style={{ background:'rgba(34,197,94,0.12)', color:'var(--green)' }}>
              ✓ Còn Hàng
            </span>
          ) : (
            <span className="badge" style={{ background:'rgba(239,68,68,0.12)', color:'var(--red)' }}>
              ✗ Hết Hàng
            </span>
          )}
        </div>

        {/* Action bar / Order controls */}
        {dino.available && (
          <div className="card-action-bar">
            {cartQty > 0 ? (
              <div className="qty-control">
                <button className="qty-btn" onClick={() => onUpdateQty(-1)}>-</button>
                <span className="qty-num">Đã chọn: {cartQty}</span>
                <button className="qty-btn" onClick={() => onUpdateQty(1)}>+</button>
              </div>
            ) : (
              <button className="btn-add-cart" onClick={onAddToCart}>
                🛒 Thêm vào đơn
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

