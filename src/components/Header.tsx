import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '@/services/notificationAPI';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { roleAPI } from '@/services/api';

const Header = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // 加载用户角色数据
  const loadUserRoles = async () => {
    if (!user?.id) return;
    
    try {
      const userRolesData = await roleAPI.getUserRoles(user.id);
      setUserRoles(userRolesData.map((ur: any) => ur.role).filter(Boolean));
    } catch (error) {
      console.error('加载用户角色失败:', error);
    }
  };

  // 加载通知数据
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [notificationsResponse, countResponse] = await Promise.all([
        getUserNotifications(user.id),
        getUnreadNotificationCount(user.id)
      ]);

      if (!notificationsResponse.error) {
        setNotifications(notificationsResponse.data);
      }
      
      if (!countResponse.error) {
        setUnreadCount(countResponse.count);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记通知为已读
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      const { error } = await markNotificationAsRead(notification.id);
      if (!error) {
        // 更新本地状态
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    
    const { error } = await markAllNotificationsAsRead(user.id);
    if (!error) {
      // 更新本地状态
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  // 格式化时间显示
  const formatTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch (error) {
      return '刚刚';
    }
  };

  // 加载数据
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUserRoles();
    }
  }, [user?.id]);

  // 定期刷新未读通知数量
  useEffect(() => {
    if (!user?.id) return;

    const loadUnreadCount = async () => {
      try {
        const { count, error } = await getUnreadNotificationCount(user.id);
        if (!error) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('加载未读通知数量失败:', error);
      }
    };

    // 立即加载一次
    loadUnreadCount();

    // 设置定时器，每30秒刷新一次
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  // 监听通知面板打开状态
  useEffect(() => {
    if (notificationsOpen && user?.id) {
      loadNotifications();
    }
  }, [notificationsOpen, user?.id]);

  return (
    <header className="bg-card border-b border-border px-6 py-4 theme-transition">
      <div className="flex items-center justify-between">
        {/* 左侧：面包屑导航 */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:block">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span className="text-foreground font-medium">目标管理系统</span>
              <span>/</span>
              <span>工作台</span>
            </nav>
          </div>
        </div>

        {/* 右侧：操作区域 */}
        <div className="flex items-center space-x-4">
          {/* 主题切换 */}
          <ThemeToggle />

          {/* 通知 */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative hover:bg-accent p-2">
                <Bell className={cn(
                  "h-5 w-5 text-muted-foreground transition-all duration-200",
                  refreshing && "animate-spin"
                )} />
                {unreadCount > 0 && (
                  <Badge 
                    className={cn(
                      "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white",
                      "border-2 border-background flex items-center justify-center font-medium",
                      "transition-all duration-200",
                      unreadCount > 9 ? "min-w-[20px] px-1" : "w-5 h-5"
                    )}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium text-popover-foreground">通知</h3>
                <p className="text-xs text-muted-foreground">您有 {unreadCount} 条未读通知</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    暂无通知
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="p-3 cursor-pointer hover:bg-accent"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          !notification.is_read ? 'bg-blue-500' : 'bg-muted'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-popover-foreground truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.notification_time)}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-border flex gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    全部已读
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs"
                  onClick={() => navigate('/notifications')}
                >
                  查看全部通知
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-auto px-2 hover:bg-accent">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-foreground">
                      {user?.name || '未登录'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.position?.name || ''}
                    </div>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <div className="p-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="flex-1 cursor-pointer hover:text-primary transition-colors duration-200"
                    onClick={handleProfileClick}
                  >
                    <div className="text-sm font-medium text-popover-foreground">
                      {user?.name || '未登录'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.email || ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userRoles.map((role, index) => (
                        <span key={index}>{role.name}{index < userRoles.length - 1 ? ' / ' : ''}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
