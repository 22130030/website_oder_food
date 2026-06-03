import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);

  const customerId = user?.userId || user?.id;

  const formatTime = (time) => {
    if (!time) return '';

    return new Date(time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDateLabel = (time) => {
    if (!time) return '';

    const date = new Date(time);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    const isSameDate = (d1, d2) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    if (isSameDate(date, today)) {
      return 'Hôm nay';
    }

    if (isSameDate(date, yesterday)) {
      return 'Hôm qua';
    }

    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = days[date.getDay()];

    return `${dayName} ${date.toLocaleDateString('vi-VN')}`;
  };

  const shouldShowDateLabel = (messageList, index) => {
    if (index === 0) return true;

    const currentDate = new Date(messageList[index].sentAt).toDateString();
    const previousDate = new Date(messageList[index - 1].sentAt).toDateString();

    return currentDate !== previousDate;
  };

  const sortMessagesByTimeAsc = (list) => {
    return [...list].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
  };

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  useEffect(() => {
    if (!customerId) {
      console.log('❌ Không có customerId:', user);
      return;
    }

    chatAPI.getMessagesByCustomer(customerId)
      .then(res => {
        setMessages(sortMessagesByTimeAsc(res.data || []));

        return chatAPI.markCustomerChatRead(customerId);
      })
      .then(() => {
        window.dispatchEvent(new Event('customer-chat-read'));
      })
      .catch(err => console.error('Lỗi load/mark read chat:', err));

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('✅ USER connected WebSocket');

        client.subscribe(`/topic/chat/${customerId}`, (message) => {
          console.log('📩 USER received:', message.body);

          const newMessage = JSON.parse(message.body);

          setMessages(prev => sortMessagesByTimeAsc([...prev, newMessage]));

          if (newMessage.senderId !== customerId) {
            chatAPI.markCustomerChatRead(customerId)
              .then(() => {
                window.dispatchEvent(new Event('customer-chat-read'));
              })
              .catch(err => console.error('Lỗi mark read customer:', err));
          }
        });
      },

      onStompError: (frame) => {
        console.error('❌ USER STOMP error:', frame);
      },

      onWebSocketError: (error) => {
        console.error('❌ USER WebSocket error:', error);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [customerId, user]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 100);
  }, [messages]);

  const sendMessage = () => {
    const senderId = user?.userId || user?.id;

    if (!inputText.trim()) return;

    if (!customerId || !senderId) {
      alert('Không lấy được userId. Hãy đăng xuất, xóa localStorage rồi đăng nhập lại.');
      return;
    }

    if (!stompClientRef.current || !stompClientRef.current.connected) {
      alert('WebSocket chưa kết nối. Kiểm tra backend hoặc Console.');
      return;
    }

    const message = {
      customerId: customerId,
      senderId: senderId,
      content: inputText.trim(),
      messageType: 'TEXT',
      imageUrl: null,
    };

    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message),
    });

    setInputText('');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const senderId = user?.userId || user?.id;

    if (!customerId || !senderId) {
      alert('Không lấy được userId.');
      e.target.value = '';
      return;
    }

    if (!stompClientRef.current || !stompClientRef.current.connected) {
      alert('WebSocket chưa kết nối.');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await chatAPI.uploadChatImage(formData);
      const imageUrl = uploadRes.data.imageUrl;

      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          customerId,
          senderId,
          content: '',
          messageType: 'IMAGE',
          imageUrl,
        }),
      });

      e.target.value = '';
    } catch (err) {
      console.error('Lỗi gửi ảnh:', err);
      alert('Gửi ảnh thất bại');
      e.target.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="chat-page">
        <div className="inner">
          <header className="support-heading">
            <span className="support-kicker">TRUNG TÂM HỖ TRỢ</span>
            <h1>Chúng tôi luôn sẵn sàng giúp bạn</h1>
            <p>Trao đổi trực tiếp với cửa hàng về món ăn, thanh toán hoặc tình trạng giao hàng.</p>
          </header>

          <div className="support-layout">
            <aside className="support-sidebar">
              <div className="support-card support-highlight">
                <div className="support-icon">🎧</div>
                <h3>Hỗ trợ nhanh</h3>
                <p>Nhân viên trực tuyến để phản hồi thắc mắc của bạn trong thời gian sớm nhất.</p>
                <span className="support-online"><i /> Đang hoạt động</span>
              </div>

              <div className="support-card">
                <h3>Câu hỏi thường gặp</h3>
                <div className="faq-shortcuts">
                  <button type="button" onClick={() => setInputText('Đơn hàng của tôi đang ở đâu?')}>Tình trạng đơn hàng</button>
                  <button type="button" onClick={() => setInputText('Tôi cần hỗ trợ thanh toán.')}>Hỗ trợ thanh toán</button>
                  <button type="button" onClick={() => setInputText('Tôi muốn thay đổi địa chỉ giao hàng.')}>Đổi địa chỉ nhận món</button>
                </div>
              </div>

              <div className="support-card support-hours">
                <strong>Thời gian phục vụ</strong>
                <p>07:00 - 22:00 · Mỗi ngày</p>
              </div>
            </aside>

            <div className="chat-container card">
              <div className="chat-header">
                <div className="chat-avatar">🍔</div>
                <div className="chat-info">
                  <h3>NLU-FoodStack Hỗ trợ</h3>
                  <div className="online-status">
                    <span className="online-dot">●</span> Đang hoạt động
                  </div>
                </div>
                <span className="secure-chat">🔒 Riêng tư</span>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-welcome">
                    <span>👋</span>
                    <h4>Xin chào! Bạn cần hỗ trợ gì?</h4>
                    <p>Gửi tin nhắn hoặc chọn câu hỏi gợi ý bên trái để bắt đầu.</p>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const myId = user?.userId || user?.id;
                  const isMine = msg.senderId === myId;
                  const isImage = msg.messageType === 'IMAGE' && msg.imageUrl;

                  return (
                    <React.Fragment key={msg.id}>
                      {shouldShowDateLabel(messages, index) && (
                        <div className="chat-date-label">
                          {formatDateLabel(msg.sentAt)}
                        </div>
                      )}

                      <div className={`msg-wrap ${isMine ? 'sent' : 'received'}`}>
                        {!isMine && <div className="msg-avatar">🤵</div>}

                        <div className={`msg-bubble ${isImage ? 'image-bubble' : ''}`}>
                          {isImage ? (
                            <img
                              src={getImageSrc(msg.imageUrl)}
                              alt="chat"
                              className="chat-image"
                            />
                          ) : (
                            <p>{msg.content}</p>
                          )}

                          <span className="msg-time">
                            {formatTime(msg.sentAt)}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                <input
                  type="file"
                  accept="image/*"
                  id="chat-image-upload-user"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />

                <label htmlFor="chat-image-upload-user" className="image-upload-btn" title="Gửi hình ảnh">
                  📷
                </label>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... Enter để gửi"
                  rows={1}
                />

                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  title="Gửi tin nhắn"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChatPage;
