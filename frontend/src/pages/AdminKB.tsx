import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, FileText, Plus, Search, Settings, HelpCircle } from 'lucide-react';
import api from '../api';
import './Admin.css';

export default function AdminKB() {
  const [kbs, setKbs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');
  const location = useLocation();

  useEffect(() => {
    fetchKBs();
  }, []);

  const fetchKBs = async () => {
    try {
      const res = await api.get('/knowledge');
      setKbs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!newKbName.trim()) return;
    try {
      await api.post('/knowledge', { name: newKbName, description: newKbDesc });
      setShowCreateModal(false);
      setNewKbName('');
      setNewKbDesc('');
      fetchKBs();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredKbs = kbs.filter(k => k.name.includes(search) || (k.description && k.description.includes(search)));

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar admin-sidebar">
        <div className="sidebar-header">
          <div className="app-title">管理控制台</div>
          <p>智能服务 AI</p>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/kb" className={`nav-item ${location.pathname === '/admin/kb' ? 'active' : ''}`}>
            <Database size={18} /> 知识库
          </Link>
          <Link to="/admin/doc" className={`nav-item ${location.pathname === '/admin/doc' ? 'active' : ''}`}>
            <FileText size={18} /> 文档管理
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link to="/admin/doc">
             <button className="btn-primary" style={{width: '100%', marginBottom: '1rem'}}>
               <Plus size={16} /> 上传新文档
             </button>
          </Link>
          <div className="nav-item"><Settings size={18}/> 设置</div>
          <div className="nav-item"><HelpCircle size={18}/> 帮助</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-header">
           <div>
             <h1 className="page-title">知识库管理</h1>
             <p className="page-subtitle">管理您的AI训练数据。通过创建不同的知识库来针对特定业务领域优化回复准确度。</p>
           </div>
           <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
             <Plus size={18} /> 创建知识库
           </button>
        </div>

        <div className="search-bar">
          <Search size={18} className="search-icon"/>
          <input 
            type="text" 
            placeholder="按名称、标签或ID搜索知识库..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="kb-grid">
          <div className="kb-card stat-card">
            <div className="stat-value">{kbs.length}</div>
            <div className="stat-label">知识库总量</div>
          </div>
          
          {filteredKbs.map(kb => (
            <div key={kb.id} className="kb-card item-card">
              <div className="kb-card-header">
                <div className="kb-icon"><Database size={20}/></div>
                <span className="badge-active">ACTIVE</span>
              </div>
              <h3>{kb.name}</h3>
              <p>{kb.description || '无描述信息'}</p>
              <div className="kb-card-footer">
                <span>更新于 {new Date(kb.updated_at).toLocaleDateString()}</span>
                <Link to="/admin/doc" className="manage-link">管理 &rarr;</Link>
              </div>
            </div>
          ))}

          <div className="kb-card create-card" onClick={() => setShowCreateModal(true)}>
             <div className="create-icon"><Plus size={24}/></div>
             <h3>创建知识库</h3>
             <p>开始构建新的 AI 认知体系</p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>创建知识库</h2>
            <div className="form-item mt-1">
              <label className="input-label">知识库名称</label>
              <input type="text" className="modal-input" value={newKbName} onChange={e => setNewKbName(e.target.value)} />
            </div>
            <div className="form-item mt-1">
              <label className="input-label">描述</label>
              <input type="text" className="modal-input" value={newKbDesc} onChange={e => setNewKbDesc(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleCreate}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
