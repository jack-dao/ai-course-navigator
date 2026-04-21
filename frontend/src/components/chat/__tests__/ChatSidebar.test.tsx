import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatSidebar from '../ChatSidebar';

describe('ChatSidebar', () => {
  it('shows empty state with suggested prompts when no messages', () => {
    render(<ChatSidebar messages={[]} onSendMessage={() => {}} isLoading={false} />);
    expect(screen.getByText('How can I help?')).toBeDefined();
    expect(screen.getByText('Find an easy GE')).toBeDefined();
    expect(screen.getByText('No Friday classes')).toBeDefined();
    expect(screen.getByText('Balance workload')).toBeDefined();
  });

  it('renders user and assistant messages', () => {
    const messages = [
      { role: 'user' as const, text: 'Find me a GE' },
      { role: 'assistant' as const, text: 'I recommend ANTH 1' },
    ];
    render(<ChatSidebar messages={messages} onSendMessage={() => {}} isLoading={false} />);
    expect(screen.getByText('Find me a GE')).toBeDefined();
    expect(screen.getByText('I recommend ANTH 1')).toBeDefined();
  });

  it('calls onSendMessage when suggestion button clicked', () => {
    const onSend = vi.fn();
    render(<ChatSidebar messages={[]} onSendMessage={onSend} isLoading={false} />);
    fireEvent.click(screen.getByText('Find an easy GE'));
    expect(onSend).toHaveBeenCalledWith('What is an easy GE to take that fits in with my schedule?');
  });

  it('disables send when input is empty', () => {
    render(<ChatSidebar messages={[]} onSendMessage={() => {}} isLoading={false} />);
    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton.hasAttribute('disabled')).toBe(true);
  });

  it('disables suggestions when loading', () => {
    const onSend = vi.fn();
    render(<ChatSidebar messages={[]} onSendMessage={onSend} isLoading={true} />);
    fireEvent.click(screen.getByText('Find an easy GE'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows loading placeholder text', () => {
    render(<ChatSidebar messages={[]} onSendMessage={() => {}} isLoading={true} />);
    expect(screen.getByPlaceholderText('Sammy is thinking...')).toBeDefined();
  });
});
