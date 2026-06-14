// Real AI Chat Service with Supabase
import { supabase } from '@/lib/supabase';

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  type: 'user' | 'assistant';
  category?: 'legal' | 'case' | 'document' | 'general';
  related_laws?: string[];
  suggestions?: string[];
  timestamp: string;
  metadata?: any;
}

class ChatService {
  private static instance: ChatService;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Get all conversations for a user
  async getConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Create new conversation
  async createConversation(userId: string, title: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .insert({
          user_id: userId,
          title,
          message_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  // Add message to conversation
  async addMessage(
    conversationId: string,
    userId: string,
    content: string,
    type: 'user' | 'assistant',
    category?: 'legal' | 'case' | 'document' | 'general',
    relatedLaws?: string[],
    suggestions?: string[],
    metadata?: any
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content,
          type,
          category,
          related_laws: relatedLaws || [],
          suggestions: suggestions || [],
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      // Update conversation timestamp
      await supabase
        .from('ai_chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  // Update conversation title
  async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_conversations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return false;
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Delete message
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Search conversations
  async searchConversations(userId: string, query: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .ilike('title', `%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error searching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  // Get conversation statistics
  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
  }> {
    try {
      const { data: conversations, error: convError } = await supabase
        .from('ai_chat_conversations')
        .select('message_count')
        .eq('user_id', userId);

      if (convError) {
        console.error('Error fetching stats:', convError);
        return {
          totalConversations: 0,
          totalMessages: 0,
          averageMessagesPerConversation: 0
        };
      }

      const totalConversations = conversations?.length || 0;
      const totalMessages = conversations?.reduce((sum, conv) => sum + (conv.message_count || 0), 0) || 0;
      const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

      return {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0
      };
    }
  }
}

export const chatService = ChatService.getInstance();
