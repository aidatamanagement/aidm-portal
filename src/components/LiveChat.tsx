import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { X, MessageCircle, Send, User, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  message_type: 'text' | 'system';
  created_at: string;
  sender_profile?: {
    name: string;
    role: string;
  };
}

interface ChatSession {
  id: string;
  user_id: string;
  assigned_admin_id: string | null;
  status: 'active' | 'closed' | 'waiting';
  created_at: string;
  updated_at: string;
}

interface LiveChatProps {
  triggerComponent?: React.ReactNode;
}

const LiveChat: React.FC<LiveChatProps> = ({ triggerComponent }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      initializeChatSession();
    }
  }, [user]);

  useEffect(() => {
    if (chatSession) {
      subscribeToMessages();
      fetchMessages();
    }
  }, [chatSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const notifyAdmins = async (chatSessionId: string, messageContent: string) => {
    try {
      // Get all admin users
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        // Create notifications for all admins
        const notifications = admins.map(admin => ({
          admin_id: admin.id,
          chat_session_id: chatSessionId,
          message: `New message from student: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`,
          type: 'new_message'
        }));

        await supabase
          .from('admin_notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  };

  const initializeChatSession = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Check for existing active session
      const { data: existingSessions, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingSessions && existingSessions.length > 0) {
        const typedSession = {
          ...existingSessions[0],
          status: existingSessions[0].status as 'active' | 'closed' | 'waiting'
        };
        setChatSession(typedSession);
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            status: 'waiting'
          })
          .select()
          .single();

        if (createError) throw createError;
        
        const typedNewSession = {
          ...newSession,
          status: newSession.status as 'active' | 'closed' | 'waiting'
        };
        setChatSession(typedNewSession);

        // Add welcome message and notify admins
        const welcomeMessage = "Hello! I need help with something.";
        await supabase
          .from('chat_messages')
          .insert({
            chat_session_id: newSession.id,
            sender_id: user.id,
            content: welcomeMessage,
            message_type: 'system'
          });

        // Notify admins about new chat session
        await notifyAdmins(newSession.id, "New support chat started");
      }

      toast({
        title: "Chat Connected",
        description: "You're now connected to our support team",
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!chatSession) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', chatSession.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles separately for each unique sender
      const senderIds = [...new Set(data?.map(msg => msg.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', senderIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = { name: profile.name, role: profile.role };
        return acc;
      }, {} as Record<string, { name: string; role: string }>) || {};
      
      const typedMessages = data?.map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'system',
        sender_profile: profileMap[msg.sender_id]
      })) || [];
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!chatSession) return;

    const channel = supabase
      .channel(`chat-${chatSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_session_id=eq.${chatSession.id}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', newMessage.sender_id)
            .single();

          const typedMessage = {
            ...newMessage,
            message_type: newMessage.message_type as 'text' | 'system',
            sender_profile: profile || undefined
          };

          setMessages(prev => [...prev, typedMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!message.trim() || !chatSession || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: chatSession.id,
          sender_id: user.id,
          content: message.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Notify admins about new message
      await notifyAdmins(chatSession.id, message.trim());
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (senderId: string) => senderId === user?.id;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerComponent || (
          <Button
            className="w-full"
            size="lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Live Chat - Get instant help from our support team
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md w-full h-[600px] p-0 flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-white rounded-t-lg px-6 py-4">
          <DialogTitle className="text-sm font-medium flex items-center text-white">
            <MessageCircle className="h-4 w-4 mr-2" />
            Live Support Chat
            {chatSession?.assigned_admin_id && (
              <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded">Admin Online</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-gray-500">Connecting to support...</div>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[80%] ${
                        isOwnMessage(msg.sender_id) ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isOwnMessage(msg.sender_id)
                            ? 'bg-primary text-white'
                            : msg.sender_profile?.role === 'admin'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isOwnMessage(msg.sender_id) ? (
                          <User className="h-3 w-3" />
                        ) : msg.sender_profile?.role === 'admin' ? (
                          <Bot className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            isOwnMessage(msg.sender_id)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                          <span>{formatTime(msg.created_at)}</span>
                          {msg.sender_profile?.role === 'admin' && (
                            <span className="text-green-600 font-medium">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={!chatSession}
                  />
                  <Button 
                    onClick={sendMessage} 
                    size="icon" 
                    className="shrink-0"
                    disabled={!message.trim() || !chatSession}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {chatSession?.status === 'waiting' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Waiting for an admin to join the chat...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveChat;
