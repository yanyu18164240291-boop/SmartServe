import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Bot } from 'lucide-react';
import api from '../api';
import './Login.css';

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [roleMode, setRoleMode] = useState<'user' | 'admin'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLoginView ? '/auth/login' : '/auth/register';

    try {
      const res = await api.post(endpoint, { username, password, role: roleMode });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (res.data.user.role === 'admin') {
        navigate('/admin/kb');
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '请求失败');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="icon-container primary-bg">
            <Bot size={24} color="white" />
          </div>
          <h2>登录 / 注册</h2>
          <p>欢迎使用 SmartServe AI 智能服务平台</p>
        </div>

        <div className="role-tabs">
          <button 
            className={`role-tab ${roleMode === 'user' ? 'active' : ''}`}
            onClick={() => setRoleMode('user')}
          >
            用户登录
          </button>
          <button 
            className={`role-tab ${roleMode === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleMode('admin')}
          >
            管理员登录
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-item">
            <label className="input-label">用户名</label>
            <div className="input-group">
              <User size={18} className="icon" />
              <input 
                type="text" 
                placeholder="请输入您的用户名" 
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-item">
            <div className="label-row">
              <label className="input-label">密码</label>
              <a href="#" className="forgot-pwd">忘记密码?</a>
            </div>
            <div className="input-group">
              <Lock size={18} className="icon" />
              <input 
                type="password" 
                placeholder="请输入您的密码" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary full-width submit-btn">
            {isLoginView ? '立即登录' : '确认注册'} <ArrowRight size={18} />
          </button>

          <button 
            type="button" 
            className="btn-ghost full-width mt-1"
            onClick={() => setIsLoginView(!isLoginView)}
          >
            {isLoginView ? '注册新账号' : '返回登录'}
          </button>
        </form>
      </div>

      <div className="ai-hint-card">
        <div className="hint-header">
          <Bot size={16} /> AI 智能助手提示
        </div>
        <p>“您的智能数字员工已就绪。登录后即可开始自动化客户服务流程，提升团队效率。”</p>
      </div>
    </div>
  );
}
