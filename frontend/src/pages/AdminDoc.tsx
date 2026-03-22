import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, FileText, Plus, Settings, HelpCircle, UploadCloud, File, RefreshCw, CheckCircle, AlertCircle, FileUp } from 'lucide-react';
import api from '../api';
import './Admin.css';

export default function AdminDoc() {
  const [kbs, setKbs] = useState<any[]>([]);
  const [selectedKb, setSelectedKb] = useState<number | ''>('');
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    fetchKBs();
  }, []);

  useEffect(() => {
    if (selectedKb) fetchDocs(selectedKb as number);
  }, [selectedKb]);

  const fetchKBs = async () => {
    try {
      const res = await api.get('/knowledge');
      setKbs(res.data);
      if (res.data.length > 0) setSelectedKb(res.data[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocs = async (kb_id: number) => {
    try {
      const res = await api.get(`/knowledge/${kb_id}/documents`);
      setDocs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedKb) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/knowledge/${selectedKb}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchDocs(selectedKb as number);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload error', err);
      alert('上传失败，请确保您有 Admin 权限，或选择支持的格式 (pdf, docx, txt)。');
    }
    setUploading(false);
  };

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
             <h1 className="page-title">文档管理 - 管理端</h1>
             <p className="page-subtitle">管理您的训练数据，上传 PDF 或 Word 文档以增强 AI 的知识库。</p>
           </div>
           
           <select 
             className="kb-select" 
             value={selectedKb} 
             onChange={e => setSelectedKb(Number(e.target.value))}
           >
             <option value="" disabled>选择要管理的知识库</option>
             {kbs.map(kb => (
               <option key={kb.id} value={kb.id}>{kb.name}</option>
             ))}
           </select>
        </div>

        <div className="doc-main-grid">
          <div className="upload-zone-wrapper">
            <h3 className="section-title"><UploadCloud size={18}/> 快速上传</h3>
            <div 
              className="upload-dropzone" 
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <FileUp size={48} className="upload-icon" color="var(--primary)" />
              <h4>拖拽文件至此处，或点击上传</h4>
              <p>支持 PDF, DOCX, TXT 格式 (最大 20MB)</p>
              <input 
                id="file-upload" 
                ref={fileInputRef}
                type="file" 
                style={{display: 'none'}} 
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
              />
            </div>
            {uploading && <div className="upload-status">正在上传及解析中...</div>}
            <div className="upload-instructions">
              <p>上传说明</p>
              <ul>
                <li>文档内容应清晰、结构化以便于 AI 提取。</li>
                <li>敏感数据将在处理前进行自动脱敏。</li>
              </ul>
            </div>
          </div>

          <div className="recent-docs-wrapper">
             <div className="recent-header">
               <h3 className="section-title"><FileText size={18}/> 最近处理记录</h3>
               <span className="view-all">查看全部</span>
             </div>
             
             <div className="doc-table">
               <div className="doc-table-header">
                 <span>文件名</span>
                 <span>上传日期</span>
                 <span>状态</span>
                 <span>操作</span>
               </div>
               
               {docs.length === 0 && <div className="no-docs">暂无文档记录</div>}
               {docs.map(doc => (
                 <div key={doc.id} className="doc-row">
                   <div className="doc-name">
                     <File size={16} className="file-icon" /> 
                     <div>
                       <div className="name-text">{doc.filename}</div>
                       <div className="size-text">{(doc.filesize/1024/1024).toFixed(1)} MB</div>
                     </div>
                   </div>
                   <div className="doc-date">{new Date(doc.uploaded_at).toLocaleDateString()}</div>
                   <div className="doc-status">
                     {doc.status === '处理中' && <span className="status-badge processing"><RefreshCw size={12}/> 处理中</span>}
                     {doc.status === '已就绪' && <span className="status-badge ready"><CheckCircle size={12}/> 已就绪</span>}
                     {doc.status === '解析失败' && <span className="status-badge failed"><AlertCircle size={12}/> 解析失败</span>}
                   </div>
                   <div className="doc-actions">⋮</div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
