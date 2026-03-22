import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Settings, Plus, Send, User as UserIcon, Bot } from 'lucide-react';
import api from '../api';
import './UserChat.css';

export default function UserChat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSession) fetchMessages(activeSession);
  }, [activeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    const res = await api.get('/chat/sessions');
    setSessions(res.data);
    if (!activeSession && res.data.length > 0) {
      setActiveSession(res.data[0].id);
    }
  };

  const createSession = async () => {
    const res = await api.post('/chat/sessions', { title: '新对话' });
    setSessions([res.data, ...sessions]);
    setActiveSession(res.data.id);
  };

  const fetchMessages = async (sessionId: number) => {
    const res = await api.get(`/chat/sessions/${sessionId}/messages`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post(`/chat/sessions/${activeSession}/message`, { content: userMsg });
      setMessages(prev => [...prev, res.data]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，处理消息时发生错误。' }]);
    }
    setLoading(false);
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="sidebar chat-sidebar">
        <div className="sidebar-header">
          <div className="app-title"><Bot size={20}/> AI 助手</div>
          <p>随时为您服务</p>
        </div>
        
        <button className="btn-primary new-chat-btn" onClick={createSession}>
          <Plus size={18} /> 开启新对话
        </button>

        <div className="history-section">
          <div className="history-title">历史记录</div>
          <div className="session-list">
            {sessions.map(s => (
              <div 
                key={s.id} 
                className={`session-item ${activeSession === s.id ? 'active' : ''}`}
                onClick={() => setActiveSession(s.id)}
              >
                <MessageSquare size={16} /> {s.title}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="btn-ghost" style={{width: '100%', display: 'flex', gap:'10px'}}>
            <Settings size={18} /> 设置
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-title">
            <span className="dot"></span> SmartServe AI 客服
            <span className="badge">Powered by Zhipu AI</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
             <div className="empty-chat">
                <Bot size={48} color="var(--primary)" />
                <p>今天有什么我可以帮您的吗？</p>
             </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`message-row ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div className="msg-avatar">
                {m.role === 'user' ? <UserIcon size={20}/> : <Bot size={20}/>}
              </div>
              <div className="msg-bubble">
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
             <div className="message-row assistant">
               <div className="msg-avatar"><Bot size={20}/></div>
               <div className="msg-bubble loading">思考中...</div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="input-box-wrapper">
            <input 
              type="text" 
              placeholder="给 SmartServe AI 发送消息..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
          <div className="input-footer">
            <span>支持 Markdown</span>
            <span>按 Enter 发送</span>
          </div>
        </div>
      </div>
    </div>
  );
}
