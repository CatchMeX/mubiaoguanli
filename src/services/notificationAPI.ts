import { supabase } from '@/lib/supabase';

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  content: string;
  notification_time: string;
  related_type: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationResponse {
  data: Notification[];
  error: any;
}

// 获取用户的通知列表
export const getUserNotifications = async (userId: string): Promise<NotificationResponse> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('notification_time', { ascending: false })
      .limit(50);

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

// 获取用户未读通知数量
export const getUnreadNotificationCount = async (userId: string): Promise<{ count: number; error: any }> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { count: count || 0, error };
  } catch (error) {
    return { count: 0, error };
  }
};

// 标记通知为已读
export const markNotificationAsRead = async (notificationId: number): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    return { error };
  } catch (error) {
    return { error };
  }
};

// 标记所有通知为已读
export const markAllNotificationsAsRead = async (userId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error };
  } catch (error) {
    return { error };
  }
};

// 创建新通知
const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Notification | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}; 