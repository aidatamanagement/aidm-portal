import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Users, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminNotifications from './AdminNotifications';

interface ChatSession {
  id: string;
  user_id: string;
  assigned_admin_id: string | null;
  status: 'active' | 'closed' | 'waiting';
  created_at: string;
  updated_at: string;
  user_profile?: {
    name: string;
    email: string;
  };
  latest_message?: {
    content: string;
    created_at: string;
  };
}

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

interface TakeoverRequest {
  id: string;
  chat_session_id: string;
  requesting_admin_id: string;
  current_admin_id: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  requesting_admin_profile?: {
    name: string;
  };
}

const AdminChatDashboard: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [takeoverRequests, setTakeoverRequests] = useState<TakeoverRequest[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchChatSessions();
      fetchTakeoverRequests();
      subscribeToChats();
      subscribeToTakeoverRequests();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedChat]);

  const fetchChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          user_profile:profiles(name, email),
          latest_message:chat_messages(content, created_at)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const sessionsWithLatestMessage = data?.map(session => ({
        ...session,
        status: session.status as 'active' | 'closed' | 'waiting',
        user_profile: Array.isArray(session.user_profile) ? session.user_profile[0] : session.user_profile,
        latest_message: Array.isArray(session.latest_message) ? session.latest_message[0] : session.latest_message
      })) || [];

      setChatSessions(sessionsWithLatestMessage);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender_profile:profiles(name, role)
        `)
        .eq('chat_session_id', selectedChat.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedMessages = data?.map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'system',
        sender_profile: Array.isArray(msg.sender_profile) ? msg.sender_profile[0] : msg.sender_profile
      })) || [];
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchTakeoverRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_takeover_requests')
        .select(`
          *,
          requesting_admin_profile:profiles(name)
        `)
        .eq('status', 'pending');

      if (error) throw error;
      
      const typedRequests = data?.map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'denied',
        requesting_admin_profile: Array.isArray(request.requesting_admin_profile) ? request.requesting_admin_profile[0] : request.requesting_admin_profile
      })) || [];
      
      setTakeoverRequests(typedRequests);
    } catch (error) {
      console.error('Error fetching takeover requests:', error);
    }
  };

  const subscribeToChats = () => {
    const channel = supabase
      .channel('admin-chat-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => fetchChatSessions()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const subscribeToMessages = () => {
    if (!selectedChat) return;

    const channel = supabase
      .channel(`admin-messages-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_session_id=eq.${selectedChat.id}`
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const subscribeToTakeoverRequests = () => {
    const channel = supabase
      .channel('takeover-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_takeover_requests'
        },
        () => fetchTakeoverRequests()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const assignChatToSelf = async (chatSessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          assigned_admin_id: user.id,
          status: 'active'
        })
        .eq('id', chatSessionId);

      if (error) throw error;

      // Send system message
      await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: chatSessionId,
          sender_id: user.id,
          content: 'Admin has joined the chat and is ready to help.',
          message_type: 'system'
        });

      toast({
        title: "Chat Assigned",
        description: "You've been assigned to this chat session",
      });

      fetchChatSessions();
    } catch (error) {
      console.error('Error assigning chat:', error);
      toast({
        title: "Error",
        description: "Failed to assign chat",
        variant: "destructive",
      });
    }
  };

  const requestTakeover = async (chatSessionId: string, currentAdminId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_takeover_requests')
        .insert({
          chat_session_id: chatSessionId,
          requesting_admin_id: user.id,
          current_admin_id: currentAdminId
        });

      if (error) throw error;

      toast({
        title: "Takeover Request Sent",
        description: "Your request to take over this chat has been sent",
      });
    } catch (error) {
      console.error('Error requesting takeover:', error);
      toast({
        title: "Error",
        description: "Failed to send takeover request",
        variant: "destructive",
      });
    }
  };

  const handleTakeoverRequest = async (requestId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_takeover_requests')
        .update({
          status: approve ? 'approved' : 'denied'
        })
        .eq('id', requestId);

      if (error) throw error;

      if (approve) {
        const request = takeoverRequests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('chat_sessions')
            .update({
              assigned_admin_id: request.requesting_admin_id
            })
            .eq('id', request.chat_session_id);
        }
      }

      fetchTakeoverRequests();
      fetchChatSessions();

      toast({
        title: approve ? "Request Approved" : "Request Denied",
        description: approve 
          ? "Chat has been transferred to the requesting admin" 
          : "Takeover request has been denied",
      });
    } catch (error) {
      console.error('Error handling takeover request:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: selectedChat.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const isOwnMessage = (senderId: string) => senderId === user?.id;
  const canTakeOver = (chat: ChatSession) => 
    chat.assigned_admin_id && chat.assigned_admin_id !== user?.id;

  return (
    <div className="space-y-4">
      {/* Header with Notifications */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Support Chat Dashboard</h2>
        <AdminNotifications />
      </div>

      <div className="h-[600px] flex border rounded-lg overflow-hidden">
        {/* Chat Sessions List */}
        <div className="w-1/3 border-r bg-gray-50">
          <div className="p-4 border-b bg-white">
            <h3 className="font-semibold flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Sessions
            </h3>
          </div>
          
          {/* Takeover Requests */}
          {takeoverRequests.length > 0 && (
            <div className="p-3 bg-yellow-50 border-b">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Takeover Requests
              </h4>
              {takeoverRequests.map((request) => (
                <div key={request.id} className="text-xs bg-white p-2 rounded mb-2">
                  <p>{request.requesting_admin_profile?.name} wants to take over a chat</p>
                  <div className="flex space-x-1 mt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs"
                      onClick={() => handleTakeoverRequest(request.id, true)}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-6 text-xs"
                      onClick={() => handleTakeoverRequest(request.id, false)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ScrollArea className="flex-1">
            {chatSessions.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 border-b cursor-pointer hover:bg-white transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-white border-l-4 border-l-primary' : ''
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {chat.user_profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {chat.user_profile?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.latest_message?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge 
                      variant={chat.status === 'waiting' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {chat.status}
                    </Badge>
                    {chat.assigned_admin_id === user?.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(chat.updated_at).toLocaleTimeString()}
                  </div>
                  
                  {chat.status === 'waiting' && (
                    <Button 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        assignChatToSelf(chat.id);
                      }}
                    >
                      Join
                    </Button>
                  )}
                  
                  {canTakeOver(chat) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestTakeover(chat.id, chat.assigned_admin_id!);
                      }}
                    >
                      Request
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedChat.user_profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedChat.user_profile?.name || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedChat.user_profile?.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedChat.status === 'active' ? 'default' : 'destructive'}>
                    {selectedChat.status}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwnMessage(message.sender_id) ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            isOwnMessage(message.sender_id)
                              ? 'bg-primary text-white'
                              : message.message_type === 'system'
                              ? 'bg-gray-100 text-gray-600 italic'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()} 
                          {message.sender_profile?.role === 'admin' && ' • Admin'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              {selectedChat.assigned_admin_id === user?.id && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      size="icon"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a chat session to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatDashboard;
