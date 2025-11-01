import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { generateChatResponse } from '../services/geminiService';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './LoadingSpinner';
import type { TranslationKey } from '../translations';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const GeminiChat: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setIsLoading(true);
    const newMessages: Message[] = [...messages, { role: 'user', text: trimmedInput }];
    setMessages(newMessages);
    setUserInput('');

    try {
      const response = await generateChatResponse(trimmedInput);
      setMessages([...newMessages, { role: 'model', text: response }]);
    } catch (err) {
      console.error(err);
      const errorMessageKey = (err instanceof Error ? err.message : 'gemini_chat_error') as TranslationKey;
      const translatedError = t(errorMessageKey);
      
      setError(translatedError === errorMessageKey ? t('gemini_chat_error') : translatedError);
      
      // Revert user message on error so they can try again
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 rounded-lg shadow-lg border border-slate-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <ChatBubbleIcon />
          <div>
            <h3 className="font-semibold text-slate-800">{t('gemini_chat_title')}</h3>
            <p className="text-sm text-slate-500">{t('gemini_chat_description')}</p>
          </div>
        </div>
        <span className={`transform transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 animate-fade-in">
          <div ref={chatContainerRef} className="h-64 overflow-y-auto bg-slate-50 rounded-md p-3 space-y-4 mb-3 border border-slate-200">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'items-start'}`}>
                {msg.role === 'model' && <div className="flex-shrink-0 text-indigo-600 mt-1.5"><GeminiIcon /></div>}
                <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 shadow-sm border border-slate-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 text-indigo-600 mt-1.5"><GeminiIcon /></div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LoadingSpinner className="h-5 w-5 text-indigo-500" />
                  <span>{t('gemini_chat_thinking')}</span>
                </div>
              </div>
            )}
             {error && <p className="text-sm text-red-600 text-center py-2">{error}</p>}
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t('gemini_chat_placeholder')}
              className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="p-2.5 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};