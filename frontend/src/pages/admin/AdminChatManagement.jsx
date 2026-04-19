import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import './AdminChatManagement.css';

const CONVERSATIONS = [
  {
    id: 1, customer: 'Nguyễn Văn A', lastMsg: 'Đơn hàng #1002 đến chưa?', time: '14:30', unread: 2,
    messages: [
      { sender: 'user', text: 'Xin chào, tôi cần hỗ trợ', time: '14:25' },
      { sender: 'user', text: 'Đơn hàng #1002 của tôi đến chưa?', time: '14:30' },
    ],
  },
  {
    id: 2, customer: 'Trần Thị B', lastMsg: 'Cảm ơn bạn!', time: '13:15', unread: 0,
    messages: [
      { sender: 'user', text: 'Tôi muốn hủy đơn hàng #1001', time: '13:10' },
      { sender: 'admin', text: 'Đơn hàng đã được hủy thành công!', time: '13:12' },
      { sender: 'user', text: 'Cảm ơn bạn!', time: '13:15' },
    ],
  },
  {
    id: 3, customer: 'Lê Minh C', lastMsg: 'Tôi bị lỗi thanh toán', time: '12:00', unread: 1,
    messages: [
      { sender: 'user', text: 'Tôi bị lỗi thanh toán VNPAY', time: '12:00' },
    ],
  },
];

const AdminChatManagement = () => {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeConv, setActiveConv] = useState(null);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const selectConversation = (conv) => {
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
    setActiveConv({ ...conv, unread: 0 });
    setReplyText('');
  };

  const sendReply = () => {
    if (!replyText.trim() || !activeConv) return;
    const newMsg = { sender: 'admin', text: replyText.trim(), time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) };
    const updatedMsgs = [...activeConv.messages, newMsg];

    setConversations(prev => prev.map(c => c.id === activeConv.id
      ? { ...c, messages: updatedMsgs, lastMsg: replyText.trim(), time: newMsg.time }
      : c));
    setActiveConv(prev => ({ ...prev, messages: updatedMsgs }));
    setReplyText('');
  };

  return (
    <AdminLayout title="💬 Quản lý Chat">
      <div className="admin-chat-layout card">
        {/* Conversation List */}
        <div className="conv-list">
          <div className="conv-list-header">
            <h3>Hội thoại</h3>
            <span className="badge badge-danger">{conversations.reduce((s, c) => s + c.unread, 0)} mới</span>
          </div>
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conv-item ${activeConv?.id === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv)}
            >
              <div className="conv-avatar">{conv.customer[0]}</div>
              <div className="conv-info">
                <div className="conv-name-row">
                  <strong>{conv.customer}</strong>
                  <span className="conv-time">{conv.time}</span>
                </div>
                <p className="conv-last-msg">{conv.lastMsg}</p>
              </div>
              {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
            </div>
          ))}
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {activeConv ? (
            <>
              <div className="chat-window-header">
                <div className="conv-avatar">{activeConv.customer[0]}</div>
                <div>
                  <strong>{activeConv.customer}</strong>
                  <p style={{ fontSize: 12, color: '#aaa' }}>Đang hỗ trợ</p>
                </div>
              </div>
              <div className="chat-window-messages">
                {activeConv.messages.map((msg, i) => (
                  <div key={i} className={`message-wrapper ${msg.sender === 'admin' ? 'sent' : 'received'}`}>
                    {msg.sender !== 'admin' && <div className="msg-avatar user-avatar">{activeConv.customer[0]}</div>}
                    <div className={`message-bubble ${msg.sender === 'admin' ? 'admin-bubble' : ''}`}>
                      <p>{msg.text}</p>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-window-input">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Nhập phản hồi... (Enter để gửi)"
                  rows={2}
                />
                <button className="btn btn-primary send-btn" onClick={sendReply} disabled={!replyText.trim()}>➤</button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
              <h3>Chọn một hội thoại để bắt đầu</h3>
              <p>Bạn có {conversations.reduce((s, c) => s + c.unread, 0)} tin nhắn chưa đọc</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChatManagement;
