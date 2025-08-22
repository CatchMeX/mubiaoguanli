import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Target,
  BarChart3,
  Users,
  User,
  Tag,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface MobileSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileSidebar = ({ isOpen, onToggle }: MobileSidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (paths: string[]) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  // 检查菜单项是否有权限访问
  const canAccessMenuItem = (item: any) => {
    if (item.children) {
      return item.children.some((child: any) => canAccessMenuItem(child));
    }
    return hasPermission(item.permission);
  };

  // 目标管理菜单项
  const goalMenuItems = [
    {
      title: '目标管理',
      icon: Target,
      id: 'goals',
      permission: 'GOAL_MANAGEMENT',
      children: [
        { title: '公司年度目标', icon: Target, href: '/goals/company-yearly', permission: 'COMPANY_YEARLY_GOAL' },
        { title: '部门月度目标', icon: Users, href: '/goals/team', permission: 'TEAM_MONTHLY_GOAL' },
        { title: '个人月度目标', icon: User, href: '/goals/personal', permission: 'PERSONAL_MONTHLY_GOAL' },
      ],
    },
  ];

  const renderMenuItem = (item: any, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = openMenus.includes(item.id || '');
    const itemIsActive = item.href ? isActive(item.href) : false;
    const childrenActive = hasChildren && item.children.some((child: any) => 
      child.href ? isActive(child.href) : false
    );

    if (hasChildren) {
      const accessibleChildren = item.children.filter((child: any) => canAccessMenuItem(child));
      
      if (accessibleChildren.length === 0) return null;

      return (
        <Collapsible key={item.title} open={isMenuOpen} onOpenChange={() => toggleMenu(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-between text-left font-normal h-12 text-base",
                level > 0 && "ml-4 w-[calc(100%-1rem)]",
                (childrenActive || itemIsActive) && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center">
                {level === 0 && <item.icon className="mr-3 h-5 w-5" />}
                {level === 1 && item.icon && <item.icon className="mr-3 h-4 w-4" />}
                <span>{item.title}</span>
              </div>
              {isMenuOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {accessibleChildren.map((child: any) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.title}
        variant={isActive(item.href) ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start font-normal h-12 text-base",
          level > 0 && "ml-4 w-[calc(100%-1rem)]",
          itemIsActive && "bg-accent text-accent-foreground"
        )}
        asChild
        onClick={onToggle} // 点击菜单项后关闭侧边栏
      >
        <Link to={item.href}>
          {level === 0 && <item.icon className="mr-3 h-5 w-5" />}
          {level === 1 && item.icon && <item.icon className="mr-3 h-4 w-4" />}
          {item.title}
        </Link>
      </Button>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* 侧边栏 */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-80 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center">
              <Target className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">目标管理系统</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 菜单内容 */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {goalMenuItems.map((item) => renderMenuItem(item))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
