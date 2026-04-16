import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'admin', text: 'Xin chào! Tôi là hỗ trợ viên của NLU-FoodStack. Bạn cần giúp gì hôm nay?', time: '15:25' },
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');

    // Giả lập trả lời từ admin sau 1 giây
    setTimeout(() => {
      const replyText = getAutoReply(inputText.trim());
      const adminReply = {
        id: Date.now() + 1,
        sender: 'admin',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, adminReply]);
    }, 800);
  };

  // Trả lời tự động đơn giản
  const getAutoReply = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('đơn hàng') || lower.includes('kiểm tra')) 
      return 'Đơn hàng của bạn đang được xử lý. Bạn có thể cung cấp mã đơn hàng để mình kiểm tra giúp không?';
    if (lower.includes('hủy')) 
      return 'Bạn muốn hủy đơn hàng nào? Vui lòng cho mình biết mã đơn hàng nhé!';
    if (lower.includes('giao') || lower.includes('bao lâu')) 
      return 'Thời gian giao hàng thường trong 30-45 phút tùy khu vực. Đơn của bạn đang được giao rồi ạ!';
    return 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick replies
  const quickReplies = [
    'Kiểm tra đơn hàng',
    'Hủy đơn hàng',
    'Thanh toán',
    'Giao hàng bao lâu?',
    'Khiếu nại'
  ];

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="chat-page">
        <div className="inner">
          <div className="chat-container card">

            {/* Header */}
            <div className="chat-header">
              <div className="chat-avatar">🍔</div>
              <div className="chat-info">
                <h3>NLU-FoodStack Hỗ trợ</h3>
                <div className="online-status">
                  <span className="online-dot">●</span> Đang hoạt động
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`msg-wrap ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                  {msg.sender === 'admin' && (
                    <div className="msg-avatar">🤵</div>
                  )}
                  <div className="msg-bubble">
                    <p>{msg.text}</p>
                    <span className="msg-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="quick-replies">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className="quick-reply-btn"
                  onClick={() => setInputText(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn... (Enter để gửi)"
                rows={1}
              />
              <button 
                className="send-btn" 
                onClick={sendMessage}
                disabled={!inputText.trim()}
              >
                ➤
              </button>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ChatPage;