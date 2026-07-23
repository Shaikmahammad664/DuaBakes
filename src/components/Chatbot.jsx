import React, { useState } from 'react';
import { chatAPI } from '../services/api';
import '../styles/Chatbot.css';
import aiLogo from '../../assests/ai logo1.png';

const initialBotMessage = { type: 'bot', text: 'Hi! How can I help you today?' };

function formatBotText(text) {
  if (!text) return null;

  return String(text)
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim())
    .map((line, index) => {
      const trimmed = line.trim();
      if (/^[-*]\s+/.test(trimmed)) {
        return (
          <div key={`${index}-${trimmed}`} className="chatbot-bullet">
            {trimmed.replace(/^[-*]\s+/, '• ')}
          </div>
        );
      }

      return (
        <div key={`${index}-${trimmed}`} className="chatbot-line">
          {trimmed}
        </div>
      );
    });
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([initialBotMessage]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const resetChat = () => {
    setMessages([initialBotMessage]);
    setInputValue('');
    setLoading(false);
  };

  const openChat = () => {
    resetChat();
    setIsOpen(true);
    setShowCloseConfirm(false);
  };

  const requestClose = () => {
    setShowCloseConfirm(true);
  };

  const confirmClose = () => {
    setIsOpen(false);
    setShowCloseConfirm(false);
    resetChat();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || loading) return;

    const userMessage = { type: 'user', text: trimmedMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(trimmedMessage);
      const botMessage = {
        type: 'bot',
        text: response?.data?.response || 'I didn\'t understand that.',
        html: response?.data?.response_html || null
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errDetail = error?.response?.data?.detail || error?.response?.data?.message || error?.message || JSON.stringify(error);
      const errorMessage = {
        type: 'bot',
        text: `Sorry, I encountered an error. ${errDetail}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>DuaBakes Assistant</h3>
            <button onClick={requestClose} className="close-btn" aria-label="Close chatbot">
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={`${msg.type}-${idx}`} className={`message ${msg.type}`}>
                {msg.type === 'bot' ? (
                  msg.html ? (
                    <div className="chatbot-message-content" dangerouslySetInnerHTML={{ __html: msg.html }} />
                  ) : (
                    <div className="chatbot-message-content">{formatBotText(msg.text)}</div>
                  )
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            ))}

            {loading && (
              <div className="message bot">
                <div className="chatbot-message-content">
                  <div className="chatbot-line">Typing...</div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>

          {showCloseConfirm && (
            <div className="chatbot-confirm-overlay">
              <div className="chatbot-confirm-box">
                <p>Do you want to close the chat?</p>
                <div className="chatbot-confirm-actions">
                  <button type="button" className="confirm-secondary" onClick={cancelClose}>
                    No
                  </button>
                  <button type="button" className="confirm-primary" onClick={confirmClose}>
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className="chatbot-btn"
        onClick={isOpen ? requestClose : openChat}
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        <img src={aiLogo} alt="Chatbot" />
      </button>
    </>
  );
}
