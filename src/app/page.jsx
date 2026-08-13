'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [lastUpdate, setLastUpdate] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
  }, []);

  const fetchDinos = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res  = await fetch('/api/dinos?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      setDinos(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
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

  // Refresh khi user quay lại tab (focus/visibility)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDinos(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchDinos]);

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
        <h1>Bảng Giá Dino<br />{serverName}</h1>
        <p>{serverContact}</p>
        <a href={serverDiscord} className="btn btn-primary" style={{ margin:'0 auto' }}>
          💬 Liên Hệ Đặt Mua
        </a>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stat-chip">
          <div>
            <div className="stat-num">{stats.total}</div>
            <div className="stat-lbl">Tổng Dino</div>
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
            <h3>Không tìm thấy Dino nào</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filtered.map(dino => (
            <DinoCard key={dino.id} dino={dino} />
          ))
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p>🦖 <strong>{serverName}</strong> · Bảng giá có thể thay đổi mà không cần thông báo trước.</p>
          <p style={{ marginTop:8 }}>
            Liên hệ Admin qua{' '}
            <a href={serverDiscord}>Discord</a> để đặt hàng và thương lượng giá.
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
function DinoCard({ dino }) {
  return (
    <article className="dino-card">
      {dino.featured && <div className="featured-ribbon">HOT</div>}

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

        <span className={`badge cat-${dino.category}`}>
          {CAT_LABELS[dino.category] || dino.category}
        </span>

        {dino.description && (
          <p className="dino-desc">{dino.description}</p>
        )}

        <div className="card-footer">
          <div className="price-block">
            <span className="price-amount">{Number(dino.price).toLocaleString('vi-VN')}</span>
            <span className="price-currency">{dino.currency}</span>
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
      </div>
    </article>
  );
}
