'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['carnivore','herbivore','flyer','aquatic','boss','utility'];
const CAT_LABELS  = {
  carnivore:'Ăn Thịt', herbivore:'Ăn Cỏ', flyer:'Bay',
  aquatic:'Dưới Nước', boss:'Boss', utility:'Hỗ Trợ',
};
const CURRENCIES = ['Cá','Cá Vàng','Cá Rồng','Cá Thần','Cá Đặc Biệt','Cá + Kim Cương'];

const EMPTY_FORM = {
  name:'', category:'carnivore', level:'',
  price:'', currency:'Cá',
  imageUrl:'', description:'',
  available:true, featured:false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

function ImagePreview({ src }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  if (!src) return (
    <div className="img-preview"><div className="img-preview-placeholder"><span>🖼️</span>Nhập URL ảnh để xem trước</div></div>
  );
  if (err) return (
    <div className="img-preview"><div className="img-preview-placeholder"><span>❌</span>URL ảnh không hợp lệ</div></div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <div className="img-preview"><img src={src} alt="preview" onError={() => setErr(true)} /></div>;
}

// ─── DinoForm ─────────────────────────────────────────────────────────────────
function DinoForm({ initial = EMPTY_FORM, onSubmit, onCancel, submitLabel = 'Thêm Dino', loading }) {
  const [form, setForm] = useState(initial);
  // Không dùng useEffect để reset form — sử dụng key prop bên ngoài thay thế
  // (useEffect + inline object làm form bị reset mỗi lần parent re-render)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = e => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid-2">
        {/* Name */}
        <div className="field" style={{ gridColumn:'1/-1' }}>
          <label className="label">Tên Dino *</label>
          <input className="input" placeholder="VD: T-Rex (Rex)" value={form.name}
            onChange={e => set('name', e.target.value)} required />
        </div>

        {/* Category + Currency */}
        <div className="field">
          <label className="label">Loại</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Đơn Vị Tiền</label>
          <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Price + Level */}
        <div className="field">
          <label className="label">Giá *</label>
          <input className="input" type="number" min="0" placeholder="VD: 500" value={form.price}
            onChange={e => set('price', e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Level (tuỳ chọn)</label>
          <input className="input" type="number" min="1" max="999" placeholder="VD: 150" value={form.level}
            onChange={e => set('level', e.target.value)} />
        </div>

        {/* Image URL */}
        <div className="field" style={{ gridColumn:'1/-1' }}>
          <label className="label">Link Ảnh (URL)</label>
          <input className="input" type="url" placeholder="https://..." value={form.imageUrl}
            onChange={e => set('imageUrl', e.target.value)} />
          <ImagePreview src={form.imageUrl} />
        </div>

        {/* Description */}
        <div className="field" style={{ gridColumn:'1/-1' }}>
          <label className="label">Mô Tả</label>
          <textarea className="input" rows={3} placeholder="Mô tả ngắn về dino..."
            value={form.description} onChange={e => set('description', e.target.value)}
            style={{ resize:'vertical', minHeight:80 }}
          />
        </div>

        {/* Toggles */}
        <div className="field" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <label className="switch">
            <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} />
            <span className="slider"></span>
          </label>
          <span style={{ fontSize:14, color:'var(--text-2)' }}>Còn hàng</span>
        </div>
        <div className="field" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <label className="switch">
            <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
            <span className="slider"></span>
          </label>
          <span style={{ fontSize:14, color:'var(--text-2)' }}>Nổi bật (Featured)</span>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginTop:8, justifyContent:'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Huỷ</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><span className="spinner" style={{width:14,height:14}} /> Đang lưu...</> : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed,    setAuthed]    = useState(false);
  const [token,     setToken]     = useState('');
  const [checking,  setChecking]  = useState(true);

  const [dinos,     setDinos]     = useState([]);
  const [loadingDinos, setLoadingDinos] = useState(false);

  const [view,      setView]      = useState('dashboard'); // 'dashboard' | 'add' | 'list'
  const [formLoad,  setFormLoad]  = useState(false);
  const [editDino,  setEditDino]  = useState(null);
  const [confirmDel,setConfirmDel]= useState(null);
  const [tableSearch, setTableSearch] = useState('');

  const [toast,     setToast]     = useState(null);
  const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem('ark_admin_token');
    if (saved) { setToken(saved); setAuthed(true); }
    setChecking(false);
  }, []);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  // ── Load Dinos ────────────────────────────────────────────────────────────
  const loadDinos = useCallback(async () => {
    setLoadingDinos(true);
    try {
      const res = await fetch('/api/dinos');
      const data = await res.json();
      setDinos(Array.isArray(data) ? data : []);
    } catch { showToast('Lỗi tải danh sách', 'error'); }
    finally { setLoadingDinos(false); }
  }, [showToast]);

  useEffect(() => { if (authed) loadDinos(); }, [authed, loadDinos]);

  // ── Add Dino ──────────────────────────────────────────────────────────────
  const handleAdd = async (form) => {
    setFormLoad(true);
    try {
      const res = await fetch('/api/dinos', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      showToast(`✅ Đã thêm: ${form.name}`);
      await loadDinos();
      setView('list');
    } catch (e) { showToast(e.message || 'Lỗi thêm Dino', 'error'); }
    finally { setFormLoad(false); }
  };

  // ── Edit Dino ─────────────────────────────────────────────────────────────
  const handleEdit = async (form) => {
    setFormLoad(true);
    try {
      const res = await fetch(`/api/dinos/${editDino.id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      showToast(`✅ Đã cập nhật: ${form.name}`);
      setEditDino(null);
      await loadDinos();
    } catch (e) { showToast(e.message || 'Lỗi', 'error'); }
    finally { setFormLoad(false); }
  };

  // ── Delete Dino ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      const res = await fetch(`/api/dinos/${confirmDel.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Lỗi xoá');
      showToast(`🗑️ Đã xoá: ${confirmDel.name}`, 'info');
      setConfirmDel(null);
      await loadDinos();
    } catch (e) { showToast(e.message || 'Lỗi', 'error'); }
  };

  // ── Toggle available ──────────────────────────────────────────────────────
  const handleToggleAvail = async (dino) => {
    try {
      const res = await fetch(`/api/dinos/${dino.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ ...dino, available: !dino.available }),
      });
      if (!res.ok) throw new Error();
      await loadDinos();
    } catch { showToast('Lỗi cập nhật', 'error'); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:     dinos.length,
    available: dinos.filter(d => d.available).length,
    outStock:  dinos.filter(d => !d.available).length,
    featured:  dinos.filter(d => d.featured).length,
  };

  const filteredDinos = dinos.filter(d =>
    !tableSearch || d.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // ── Not authed → Login ────────────────────────────────────────────────────
  if (checking) return null;
  if (!authed)  return <LoginPanel onLogin={(t) => { setToken(t); sessionStorage.setItem('ark_admin_token', t); setAuthed(true); }} />;

  // ── Admin UI ──────────────────────────────────────────────────────────────
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          🦖 ARK Admin
          <small>Quản lý bảng giá Dino</small>
        </div>
        <nav className="sidebar-nav">
          {[
            { id:'dashboard', icon:'📊', label:'Dashboard' },
            { id:'add',       icon:'➕', label:'Thêm Dino Mới' },
            { id:'list',      icon:'📋', label:'Danh Sách Dino' },
          ].map(n => (
            <div key={n.id} className={`nav-item${view===n.id?' active':''}`} onClick={() => setView(n.id)}>
              {n.icon} {n.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-ghost btn-sm" style={{ width:'100%' }}
            onClick={() => { sessionStorage.removeItem('ark_admin_token'); setAuthed(false); }}>
            🚪 Đăng Xuất
          </button>
          <div style={{ marginTop:8 }}>
            <a href="/" target="_blank" className="btn btn-outline btn-sm" style={{ width:'100%', justifyContent:'center' }}>
              👁️ Xem Trang Chính
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <>
            <div className="admin-header">
              <h2>📊 Dashboard</h2>
              <p>Tổng quan bảng giá server ARK Mobile</p>
            </div>
            <div className="dash-stats">
              <div className="dash-stat blue">
                <div className="dash-stat-val">{stats.total}</div>
                <div className="dash-stat-lbl">Tổng Dino</div>
              </div>
              <div className="dash-stat green">
                <div className="dash-stat-val">{stats.available}</div>
                <div className="dash-stat-lbl">Còn Hàng</div>
              </div>
              <div className="dash-stat red">
                <div className="dash-stat-val">{stats.outStock}</div>
                <div className="dash-stat-lbl">Hết Hàng</div>
              </div>
              <div className="dash-stat gold">
                <div className="dash-stat-val">{stats.featured}</div>
                <div className="dash-stat-lbl">Nổi Bật</div>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button className="btn btn-primary" onClick={() => setView('add')}>
                ➕ Thêm Dino Mới
              </button>
              <button className="btn btn-outline" onClick={() => setView('list')}>
                📋 Quản Lý Danh Sách
              </button>
              <button className="btn btn-ghost" onClick={loadDinos}>
                🔄 Refresh
              </button>
            </div>

            {/* Latest 5 */}
            <hr className="divider" />
            <h3 style={{ fontSize:18, marginBottom:16 }}>Dino Mới Nhất</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
              {dinos.slice(0, 5).map(d => (
                <div key={d.id} style={{
                  background:'var(--bg-card)', border:'1px solid var(--border)',
                  borderRadius:'var(--r)', padding:'14px 16px',
                  display:'flex', alignItems:'center', gap:12,
                }}>
                  <MiniThumb src={d.imageUrl} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                    <div style={{ color:'var(--gold)', fontSize:13, fontWeight:700 }}>{Number(d.price).toLocaleString()} {d.currency}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Add Dino ── */}
        {view === 'add' && (
          <>
            <div className="admin-header">
              <h2>➕ Thêm Dino Mới</h2>
              <p>Điền thông tin và giá bán, ảnh nhập dưới dạng link URL</p>
            </div>
            <div className="add-form-card">
              <h3 className="add-form-title">📝 Thông Tin Dino</h3>
              <DinoForm onSubmit={handleAdd} loading={formLoad} submitLabel="➕ Thêm Vào Bảng Giá" />
            </div>
          </>
        )}

        {/* ── List ── */}
        {view === 'list' && (
          <>
            <div className="admin-header">
              <h2>📋 Danh Sách Dino</h2>
              <p>{dinos.length} dino · Click ✏️ để sửa, 🗑️ để xoá</p>
            </div>

            <div className="dino-table-card">
              <div className="table-top">
                <div className="table-title">Tất Cả Dino</div>
                <div style={{ display:'flex', gap:10 }}>
                  <input className="input table-search" placeholder="🔍 Tìm tên..."
                    value={tableSearch} onChange={e => setTableSearch(e.target.value)} />
                  <button className="btn btn-primary btn-sm" onClick={() => setView('add')}>➕ Thêm</button>
                </div>
              </div>

              {loadingDinos ? (
                <div style={{ padding:40, textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ảnh</th>
                        <th>Tên Dino</th>
                        <th>Loại</th>
                        <th>Lv</th>
                        <th>Giá</th>
                        <th>Trạng Thái</th>
                        <th>Nổi Bật</th>
                        <th>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDinos.map(d => (
                        <tr key={d.id}>
                          <td><MiniThumb src={d.imageUrl} /></td>
                          <td>
                            <div className="dino-name-cell">
                              <div className={`avail-dot ${d.available?'on':'off'}`} />
                              <strong>{d.name}</strong>
                            </div>
                          </td>
                          <td><span className={`badge cat-${d.category}`}>{CAT_LABELS[d.category]}</span></td>
                          <td>{d.level ? `${d.level}` : '—'}</td>
                          <td>
                            <span style={{ color:'var(--gold)', fontWeight:700 }}>
                              {Number(d.price).toLocaleString()}
                            </span>{' '}
                            <span style={{ color:'var(--text-3)', fontSize:12 }}>{d.currency}</span>
                          </td>
                          <td>
                            <label className="switch" title="Bật/tắt còn hàng">
                              <input type="checkbox" checked={d.available}
                                onChange={() => handleToggleAvail(d)} />
                              <span className="slider"></span>
                            </label>
                          </td>
                          <td>
                            {d.featured
                              ? <span className="badge" style={{ background:'rgba(245,158,11,0.15)', color:'var(--gold)' }}>⭐ HOT</span>
                              : <span style={{ color:'var(--text-3)', fontSize:13 }}>—</span>}
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="btn btn-ghost btn-sm" title="Sửa"
                                onClick={() => setEditDino(d)}>✏️</button>
                              <button className="btn btn-danger btn-sm" title="Xoá"
                                onClick={() => setConfirmDel(d)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredDinos.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--text-3)' }}>
                          Không có dino nào
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Edit Modal ── */}
      {editDino && (
        <div className="overlay" onClick={e => { if (e.target===e.currentTarget) setEditDino(null); }}>
          <div className="edit-modal">
            <div className="modal-header">
              <h3>✏️ Sửa Dino</h3>
              <button className="close-btn" onClick={() => setEditDino(null)}>✕</button>
            </div>
            <DinoForm
              key={editDino.id}
              initial={{ ...editDino, level: editDino.level ?? '' }}
              onSubmit={handleEdit}
              onCancel={() => setEditDino(null)}
              submitLabel="💾 Lưu Thay Đổi"
              loading={formLoad}
            />
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {confirmDel && (
        <div className="overlay" onClick={e => { if (e.target===e.currentTarget) setConfirmDel(null); }}>
          <div className="confirm-modal">
            <div style={{ fontSize:48, marginBottom:12 }}>🗑️</div>
            <h3>Xác Nhận Xoá?</h3>
            <p>Bạn có chắc muốn xoá <strong>{confirmDel.name}</strong> khỏi bảng giá? Hành động này không thể hoàn tác.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Huỷ</button>
              <button className="btn btn-danger" onClick={handleDelete}>🗑️ Xoá</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Mini thumbnail ───────────────────────────────────────────────────────────
function MiniThumb({ src }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div className="thumb-placeholder">🦕</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="thumb-img" src={src} alt="" onError={() => setErr(true)} />;
}

// ─── Login Panel ──────────────────────────────────────────────────────────────
function LoginPanel({ onLogin }) {
  const [pw,      setPw]      = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const { token } = await res.json();
      onLogin(token);
    } catch (e) { setError(e.message || 'Đăng nhập thất bại'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-logo">
          <div className="login-icon">🔐</div>
          <h1>Admin Login</h1>
          <p>Đăng nhập để quản lý bảng giá ARK</p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="field">
            <label className="label">Mật Khẩu Admin</label>
            <input
              className="input" type="password"
              placeholder="Nhập mật khẩu..."
              value={pw} onChange={e => setPw(e.target.value)}
              autoFocus required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{width:14,height:14}} /> Đang kiểm tra...</> : '🔑 Đăng Nhập'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, color:'var(--text-3)', fontSize:13 }}>
          <a href="/" style={{ color:'var(--green)' }}>← Về trang bảng giá</a>
        </p>
      </div>
    </div>
  );
}
