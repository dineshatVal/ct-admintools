export const ChatBubble = ({
  isUserMessage,
  children,
}: React.PropsWithChildren<{ isUserMessage: boolean }>) => {
  // Styles for different bubble types
  const bubbleContainerStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    margin: '8px 0',
    justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
  };

  const bubbleStyle: React.CSSProperties = {
    position: 'relative',
    maxWidth: '500px',
    padding: '8px 16px',
    fontSize: '14px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    backgroundColor: isUserMessage ? '#3b82f6' : '#f3f4f6',
    color: isUserMessage ? 'white' : '#1f2937',
    borderBottomRightRadius: isUserMessage ? 0 : '12px',
    borderBottomLeftRadius: isUserMessage ? '12px' : 0,
  };

  const paragraphStyle: React.CSSProperties = {
    wordBreak: 'break-word',
  };
  return (
    <div style={bubbleContainerStyle}>
      <div style={bubbleStyle}>
        <p style={paragraphStyle}>{children}</p>
      </div>
    </div>
  );
};
