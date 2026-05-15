import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Trợ lý Vision có thể giúp bạn điều gì hôm nay?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const currentInput = inputValue;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: currentInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/api/chatbot/chat', { message: currentInput });
      const data = res.data;

      const botResponse = {
        id: Date.now(),
        text: data.success
          ? data.answer
          : 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Chatbot API error:', error);
      const errorResponse = {
        id: Date.now(),
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ hotline 0123-456-789 để được hỗ trợ.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Render message text with basic markdown support (**bold**)
  const renderMessageText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Button / Collapsed State */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-primary text-on-primary rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group"
          aria-label="Open chat"
        >
          <span className="material-symbols-outlined text-[28px]">
            support_agent
          </span>
          <span className="absolute bottom-full mb-2 px-3 py-2 bg-on-surface text-surface text-label-md font-label-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat với chúng tôi
          </span>
        </button>
      )}

      {/* Chat Window / Expanded State */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-96 h-[600px] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-primary text-on-primary p-md flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <div className="w-10 h-10 bg-on-primary/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">
                  support_agent
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm">Vision Assistant</h3>
                <p className="font-body-sm text-body-sm opacity-90">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-xs hover:bg-on-primary/20 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-md space-y-md">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] px-md py-sm rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-primary text-on-primary rounded-br-none'
                      : 'bg-surface-container text-on-surface rounded-bl-none'
                  }`}
                >
                  <p className="font-body-sm text-body-sm whitespace-pre-wrap">
                    {renderMessageText(message.text)}
                  </p>
                  <span
                    className={`text-label-xs font-label-xs opacity-70 block mt-1 ${
                      message.sender === 'user'
                        ? 'text-on-primary'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-container text-on-surface px-md py-sm rounded-2xl rounded-bl-none">
                  <div className="flex gap-1 items-center h-6">
                    <div className="w-2 h-2 bg-on-surface rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-on-surface rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-on-surface rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-outline-variant p-md flex gap-sm bg-surface"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-surface-container border border-outline-variant rounded-full px-md py-2 font-body-sm text-body-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-primary text-on-primary p-2 rounded-full hover:bg-inverse-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[18px]">
                send
              </span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
