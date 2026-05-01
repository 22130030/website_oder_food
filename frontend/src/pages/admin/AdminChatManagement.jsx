import React, { useState, useRef, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import './AdminChatManagement.css';

const AdminChatManagement = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');

  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConvRef = useRef(null);

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

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatAPI.getConversations();
      const data = res.data || [];

      setConversations(data.map(item => {
        if (activeConvRef.current && item.customerId === activeConvRef.current.customerId) {
          return { ...item, unreadCount: 0 };
        }

        return item;
      }));
    } catch (err) {
      console.error('Lỗi load conversations:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('✅ ADMIN CHAT connected WebSocket');

        client.subscribe('/topic/admin/conversations', (message) => {
          const newMessage = JSON.parse(message.body);
          const currentActive = activeConvRef.current;

          if (
            currentActive &&
            newMessage.customerId === currentActive.customerId &&
            newMessage.senderId === currentActive.customerId
          ) {
            chatAPI.markAdminConversationRead(currentActive.customerId)
              .then(() => {
                loadConversations();
                window.dispatchEvent(new Event('admin-chat-read'));
              })
              .catch(() => {});
          } else {
            loadConversations();
          }
        });
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
      },

      onWebSocketError: (error) => {
        console.error('❌ WebSocket error:', error);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConv) return;

    const client = stompClientRef.current;
    if (!client || !client.connected) return;

    const subscription = client.subscribe(`/topic/chat/${activeConv.customerId}`, (message) => {
      const newMessage = JSON.parse(message.body);
      setMessages(prev => sortMessagesByTimeAsc([...prev, newMessage]));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeConv]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 100);
  }, [messages]);

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    activeConvRef.current = conv;
    setReplyText('');
    setMessages([]);

    setConversations(prev =>
      prev.map(item =>
        item.customerId === conv.customerId
          ? { ...item, unreadCount: 0 }
          : item
      )
    );

    try {
      const messagesRes = await chatAPI.getMessagesByCustomer(conv.customerId);
      setMessages(sortMessagesByTimeAsc(messagesRes.data || []));
    } catch (err) {
      console.error('Lỗi load messages:', err);
    }

    try {
      await chatAPI.markAdminConversationRead(conv.customerId);
      await loadConversations();

      window.dispatchEvent(new Event('admin-chat-read'));
    } catch (err) {
      console.error('Lỗi mark read admin:', err);
    }
  };

  const sendReply = () => {
    const adminId = user?.userId || user?.id;

    if (!replyText.trim() || !activeConv || !stompClientRef.current) return;

    if (!adminId) {
      alert('Không lấy được adminId. Hãy đăng xuất rồi đăng nhập lại.');
      return;
    }

    if (!stompClientRef.current.connected) {
      alert('WebSocket chưa kết nối. Kiểm tra backend hoặc Console.');
      return;
    }

    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        customerId: activeConv.customerId,
        senderId: adminId,
        content: replyText.trim(),
        messageType: 'TEXT',
        imageUrl: null,
      }),
    });

    setReplyText('');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const adminId = user?.userId || user?.id;

    if (!activeConv) {
      alert('Hãy chọn hội thoại trước khi gửi ảnh.');
      e.target.value = '';
      return;
    }

    if (!adminId) {
      alert('Không lấy được adminId.');
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
          customerId: activeConv.customerId,
          senderId: adminId,
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

  const getTotalUnread = () =>
    conversations.reduce((sum, conv) => sum + Number(conv.unreadCount || 0), 0);

  return (
    <AdminLayout title="💬 Quản lý Chat">
      <div className="admin-chat-layout card">

        <div className="conv-list">
          <div className="conv-list-header">
            <h3>Hội thoại</h3>

            {getTotalUnread() > 0 && (
              <span className="badge badge-danger">
                {getTotalUnread()} mới
              </span>
            )}
          </div>

          {conversations.map(conv => (
            <div
              key={conv.customerId}
              className={`conv-item ${activeConv?.customerId === conv.customerId ? 'active' : ''}`}
              onClick={() => selectConversation(conv)}
            >
              <div className="conv-avatar">
                {conv.customerName?.charAt(0)}
              </div>

              <div className="conv-info">
                <div className="conv-name-row">
                  <strong>{conv.customerName}</strong>
                  <span className="conv-time">
                    {formatTime(conv.lastSentAt)}
                  </span>
                </div>

                <p className="conv-last-msg">{conv.lastMessage}</p>
              </div>

              {Number(conv.unreadCount || 0) > 0 && (
                <span className="unread-badge">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="chat-window">
          {activeConv ? (
            <>
              <div className="chat-window-header">
                <div className="conv-avatar">
                  {activeConv.customerName?.charAt(0)}
                </div>

                <div>
                  <strong>{activeConv.customerName}</strong>
                  <p style={{ fontSize: 12, color: '#aaa' }}>
                    {activeConv.customerEmail}
                  </p>
                </div>
              </div>

              <div className="chat-window-messages">
                {messages.map((msg, index) => {
                  const adminId = user?.userId || user?.id;
                  const isAdmin = msg.senderId === adminId;
                  const isImage = msg.messageType === 'IMAGE' && msg.imageUrl;

                  return (
                    <React.Fragment key={msg.id}>
                      {shouldShowDateLabel(messages, index) && (
                        <div className="chat-date-label">
                          {formatDateLabel(msg.sentAt)}
                        </div>
                      )}

                      <div
                        className={`message-wrapper ${isAdmin ? 'sent' : 'received'}`}
                      >
                        {!isAdmin && (
                          <div className="msg-avatar user-avatar">
                            {activeConv.customerName?.charAt(0)}
                          </div>
                        )}

                        <div className={`message-bubble ${isAdmin ? 'admin-bubble' : ''} ${isImage ? 'image-bubble' : ''}`}>
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

              <div className="chat-window-input">
                <input
                  type="file"
                  accept="image/*"
                  id="chat-image-upload-admin"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />

                <label htmlFor="chat-image-upload-admin" className="image-upload-btn">
                  📷
                </label>

                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Nhập phản hồi... Enter để gửi"
                  rows={2}
                />

                <button
                  className="btn btn-primary send-btn"
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
              <h3>Chọn một hội thoại để bắt đầu</h3>
              <p>Bạn có {conversations.length} hội thoại</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChatManagement;