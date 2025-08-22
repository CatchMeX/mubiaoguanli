import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  Notification 
} from '@/services/notificationAPI';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 加载通知数据
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await getUserNotifications(user.id);
      if (!error) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记通知为已读
  const handleMarkAsRead = async (notificationId: number) => {
    const { error } = await markNotificationAsRead(notificationId);
    if (!error) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    }
  };

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    const { error } = await markAllNotificationsAsRead(user.id);
    if (!error) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    }
  };

  // 标记选中通知为已读
  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    const promises = selectedNotifications.map(id => markNotificationAsRead(id));
    await Promise.all(promises);
    
    setNotifications(prev => 
      prev.map(n => 
        selectedNotifications.includes(n.id) ? { ...n, is_read: true } : n
      )
    );
    setSelectedNotifications([]);
  };

  // 选择/取消选择通知
  const handleSelectNotification = (notificationId: number) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    const filteredNotifications = getFilteredNotifications();
    const unreadIds = filteredNotifications
      .filter(n => !n.is_read)
      .map(n => n.id);
    
    if (selectedNotifications.length === unreadIds.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(unreadIds);
    }
  };

  // 获取筛选后的通知
  const getFilteredNotifications = () => {
    let filtered = notifications;

    // 按状态筛选
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    // 按类型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.related_type === filterType);
    }

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch {
      return '刚刚';
    }
  };

  // 获取通知类型显示名称
  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'approval': '审批',
      'system': '系统',
      'task': '任务',
      'goal': '目标'
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const selectedCount = selectedNotifications.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">通知中心</h1>
          <p className="text-muted-foreground mt-2">
            您有 {unreadCount} 条未读通知
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            刷新
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              全部已读
            </Button>
          )}
        </div>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选和搜索
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索通知标题或内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">通知类型</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="approval">审批</SelectItem>
                  <SelectItem value="system">系统</SelectItem>
                  <SelectItem value="task">任务</SelectItem>
                  <SelectItem value="goal">目标</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedCount} 条通知
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                >
                  <Check className="h-4 w-4 mr-2" />
                  标记已读
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedNotifications([])}
                >
                  取消选择
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 通知列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>通知列表</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCount > 0 && selectedCount === filteredNotifications.filter(n => !n.is_read).length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">全选未读</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">全部 ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">未读 ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">已读 ({notifications.length - unreadCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">暂无通知</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border rounded-lg transition-all duration-200",
                        !notification.is_read ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" : "bg-card border-border",
                        selectedNotifications.includes(notification.id) && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedNotifications.includes(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          disabled={notification.is_read}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={cn(
                                  "font-medium",
                                  !notification.is_read ? "text-foreground" : "text-muted-foreground"
                                )}>
                                  {notification.title}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {getTypeDisplayName(notification.related_type)}
                                </Badge>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.content}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.notification_time)}
                                </span>
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    标记已读
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications; 