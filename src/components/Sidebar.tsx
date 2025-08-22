// @ts-nocheck
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  Target,
  DollarSign,
  Package,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Briefcase,
  BarChart3,
  Calendar,
  User,
  FolderTree,
  Calculator,
  Receipt,
  CreditCard,
  PieChart,
  TrendingUp,
  Building,
  MapPin,
  Truck,
  Tag,
  List,
  ArrowRightLeft,
  Wrench,
  Trash2,
  ClipboardList,
  FileText,
  ShoppingCart,
  PackageCheck,
  UserPlus,
  Shield,
  Settings,
  Route,
  Database,
  ArrowUpDown,
  GitBranch,
  Clock,
  Plane,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission, userPermissions } = usePermissions();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);

  // 权限数据刷新机制
  useEffect(() => {
    if (user) {
      filterMenuItems();
    }
  }, [user, userPermissions]);

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
  const canAccessMenuItem = (item) => {
    if (item.children) {
      // 父菜单：检查是否有任何子菜单可访问
      return item.children.some(child => canAccessMenuItem(child));
    }
    // 叶子菜单：检查权限
    return hasPermission(item.permission);
  };

  // 过滤有权限的菜单项
  const filterMenuItems = () => {
    const menuItems = [
      {
        title: '组织管理',
        icon: Settings,
        id: 'organization',
        permission: 'ORGANIZATION_MANAGEMENT',
        children: [
          { title: '部门管理', icon: Building2, href: '/departments', permission: 'DEPARTMENT_MANAGEMENT' },
          { title: '项目管理', icon: Briefcase, href: '/teams', permission: 'PROJECT_MANAGEMENT' },
          { title: '权限管理', icon: Shield, href: '/permissions', permission: 'PERMISSION_MANAGEMENT' },
          { title: '成员管理', icon: UserCheck, href: '/members', permission: 'MEMBER_MANAGEMENT' },
        ],
      },
      {
        title: '任务管理',
        icon: CheckSquare,
        href: '/tasks',
        permission: 'TASK_MANAGEMENT',
      },
      {
        title: '目标管理',
        icon: Target,
        id: 'goals',
        permission: 'GOAL_MANAGEMENT',
        children: [
          { title: '目标看板', icon: BarChart3, href: '/goals/dashboard', permission: 'GOAL_DASHBOARD' },
          { title: '公司年度目标', icon: Target, href: '/goals/company-yearly', permission: 'COMPANY_YEARLY_GOAL' },
          { title: '部门月度目标', icon: Users, href: '/goals/team', permission: 'TEAM_MONTHLY_GOAL' },
          { title: '个人月度目标', icon: User, href: '/goals/personal', permission: 'PERSONAL_MONTHLY_GOAL' },
          { title: '单位管理', icon: Tag, href: '/goals/units', permission: 'UNIT_MANAGEMENT' },
        ],
      },
      {
        title: '审批管理',
        icon: GitBranch,
        id: 'approval',
        permission: 'APPROVAL_MANAGEMENT',
        children: [
          { title: '流程配置', icon: Settings, href: '/approval/workflow', permission: 'WORKFLOW_CONFIG' },
          { title: '待办列表', icon: Clock, href: '/approval/pending', permission: 'PENDING_LIST' },
        ],
      },
      {
        title: '财务管理',
        icon: DollarSign,
        id: 'finance',
        permission: 'FINANCE_MANAGEMENT',
        children: [
          { title: '事项管理', icon: FileText, href: '/finance/matters', permission: 'MATTER_MANAGEMENT' },
          { title: '付款/借款管理', icon: CreditCard, href: '/finance/payments', permission: 'PAYMENT_MANAGEMENT' },
          { title: '费用报销/冲销管理', icon: Receipt, href: '/finance/expense-reimbursement', permission: 'EXPENSE_REIMBURSEMENT' },
          { title: '差旅费报销管理', icon: Plane, href: '/finance/business-trip-reimbursement', permission: 'BUSINESS_TRIP_REIMBURSEMENT' },
        ],
      },
    ];
    const filtered = menuItems.filter(item => canAccessMenuItem(item));
    setFilteredMenuItems(filtered);
  };

  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = openMenus.includes(item.id || '');
    const itemIsActive = item.href ? isActive(item.href) : false;
    const childrenActive = hasChildren && item.children.some((child) => 
      child.href ? isActive(child.href) : 
      child.children ? child.children.some((grandChild) => isActive(grandChild.href)) : false
    );

    if (hasChildren) {
      // 过滤有权限的子菜单
      const accessibleChildren = item.children.filter(child => canAccessMenuItem(child));
      
      // 如果没有可访问的子菜单，不显示父菜单
      if (accessibleChildren.length === 0) return null;

      return (
        <Collapsible key={item.title} open={isMenuOpen} onOpenChange={() => toggleMenu(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-between text-left font-normal h-10",
                level > 0 && "ml-4 w-[calc(100%-1rem)]",
                (childrenActive || itemIsActive) && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center">
                {level === 0 && <item.icon className="mr-2 h-4 w-4" />}
                {level === 1 && item.icon && <item.icon className="mr-2 h-3 w-3" />}
                {level === 1 && !item.icon && <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2 opacity-60" />}
                {level === 2 && <div className="w-1 h-1 rounded-full bg-muted-foreground mr-2 opacity-40" />}
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
            {accessibleChildren.map((child) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.title}
        variant={isActive(item.href) ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start font-normal h-10",
          level > 0 && "ml-4 w-[calc(100%-1rem)]",
          level > 1 && "ml-8 w-[calc(100%-2rem)]",
          itemIsActive && "bg-accent text-accent-foreground"
        )}
        asChild
      >
        <Link to={item.href}>
          {level === 0 && <item.icon className="mr-2 h-4 w-4" />}
          {level === 1 && item.icon && <item.icon className="mr-2 h-3 w-3" />}
          {level === 1 && !item.icon && <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2 opacity-60" />}
          {level === 2 && <div className="w-1 h-1 rounded-full bg-muted-foreground mr-2 opacity-40" />}
          {item.title}
        </Link>
      </Button>
    );
  };

  // 如果没有用户或权限数据，显示加载状态
  if (!user || !userPermissions) {
    return (
      <div className="pb-12 w-64 bg-card border-r border-border theme-transition">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="flex items-center mb-4 px-2">
              <Target className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">目标管理系统</h2>
            </div>
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 w-64 bg-card border-r border-border theme-transition">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-4 px-2">
            <Target className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">目标管理系统</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-1">
              {filteredMenuItems.map((item) => renderMenuItem(item))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
