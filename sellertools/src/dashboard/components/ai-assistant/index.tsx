'use client';

import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChatBubble } from './components/chat-bubble';
import IconButton from '@commercetools-uikit/icon-button';
import {
  SpeechBubbleIcon,
  CloseIcon,
  SparklesIcon,
} from '@commercetools-uikit/icons';
import styles from './index.module.css';
import { useChat } from '@ai-sdk/react';
import Markdown from 'react-markdown';
import { useHistory } from 'react-router';

interface AiAssistantProps {
  deployedUrl: string;
  minimized?: boolean;
  className?: string;
  token: string;
}

export const AiAssistant = ({
  deployedUrl,
  minimized = false,
  className = '',
  token,
}: AiAssistantProps) => {
  const [isOpen, setIsOpen] = useState(!minimized);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useHistory();

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    onToolCall: ({ toolCall }) => {
      switch (toolCall.args) {
        case 'Orders':
          router.push(`/orders`);
          return { navigatedTo: `/orders` };
        case 'Customers':
          router.push(`/customers`);
          return { navigatedTo: `/customers` };
        case 'Products':
          router.push(`/products`);
          return { navigatedTo: `/products` };
        case 'Settings':
          router.push(`/configuration`);
          return { navigatedTo: `/configuration` };
        case 'Prices':
          router.push(`/prices`);
          return { navigatedTo: `/prices` };
        case 'Promotions':
          router.push(`/promotions`);
          return { navigatedTo: `/promotions` };
        case 'CMS':
          router.push(`/content`);
          return { navigatedTo: `/content` };
        case 'Reports':
          router.push(`/reports`);
          return { navigatedTo: `/reports` };
        default:
          return { navigatedTo: `/` };
      }
    },
    api: `${deployedUrl}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Scroll to bottom of chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={clsx(styles.assistantContainer, className)}>
      {/* Toggle button - only shown when minimized */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className={styles.toggleButton}>
          <span className={styles.iconWrapper}>
            <SpeechBubbleIcon size="20" />
          </span>
        </button>
      )}

      {/* Chat container */}
      {isOpen && (
        <div className={styles.chatContainer}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <span className={styles.chatHeaderText}>AI Assistant</span>
            <IconButton
              label="Close"
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              icon={<CloseIcon size="20" color="primary" />}
            >
              <CloseIcon size="20" color="primary" />
            </IconButton>
          </div>

          {/* Messages container */}
          <div ref={chatContainerRef} className={styles.messagesContainer}>
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className={styles.welcomeMessage}>
                <p>Hello! I'm your AI assistant. How can I help you today?</p>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                isUserMessage={message.role === 'user'}
              >
                {message.parts.map((part, partIndex) => {
                  if (part.type === 'text') {
                    return (
                      <div key={partIndex} className={styles.messageBubble}>
                        <Markdown>{part.text}</Markdown>
                      </div>
                    );
                  }
                  return null;
                })}
              </ChatBubble>
            ))}

            {/* Loading indicator */}
            {status !== 'ready' && status !== 'error' && (
              <div className={styles.loadingIndicator}>
                <div className={styles.loadingDots}>
                  <div className={styles.loadingDot}></div>
                  <div
                    className={styles.loadingDot}
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className={styles.loadingDot}
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything"
              disabled={status !== 'ready'}
              className={styles.input}
            />
            <IconButton
              label="Submit"
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className={clsx(
                styles.submitButton,
                input.trim() && status === 'ready'
                  ? styles.submitButtonEnabled
                  : styles.submitButtonDisabled
              )}
              icon={<SparklesIcon size="20" color="primary" />}
            ></IconButton>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
