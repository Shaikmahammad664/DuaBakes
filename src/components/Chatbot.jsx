import React, { useState } from 'react';
import { chatAPI } from '../services/api';
import '../styles/Chatbot.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = { type: 'user', text: inputValue };
    setMessages([...messages, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Call backend chatbot API
      const response = await chatAPI.sendMessage(inputValue);
      const botMessage = { type: 'bot', text: response.data.response || 'I didn\'t understand that.' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
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
            <button onClick={() => setIsOpen(false)} className="close-btn">×</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {loading && <div className="message bot"><p>Typing...</p></div>}
          </div>
          <form onSubmit={handleSendMessage} className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      )}
      <button 
        className="chatbot-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chatbot"
      >
        <img src="./assests/ai logo1.png" alt="Chatbot" />
      </button>
    </>
  );
}
