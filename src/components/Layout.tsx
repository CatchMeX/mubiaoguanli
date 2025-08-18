import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Users,
  Building2,
  CheckSquare,
  Target,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Building,
  Package,
  ShoppingCart,
  TrendingUp,
  Info,
  UserCheck,
  Receipt,
  CreditCard,
  Truck,
  UserPlus,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [basicInfoOpen, setBasicInfoOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [procurementOpen, setProcurementOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: BarChart3, label: '统计看板', path: '/' },
    { 
      icon: Info, 
      label: '基本信息', 
      path: '/basic',
      children: [
        { label: '成员管理', path: '/members', icon: Users },
        { label: '部门管理', path: '/departments', icon: Building2 },
        { label: '团队管理', path: '/teams', icon: UserCheck },
        { label: '客户管理', path: '/customers', icon: UserPlus },
        { label: '供应商管理', path: '/suppliers', icon: Truck },
      ]
    },
    { icon: CheckSquare, label: '任务管理', path: '/tasks' },
    { 
      icon: Target, 
      label: '目标管理', 
      path: '/goals',
      children: [
        { label: '目标管理看板', path: '/goals/dashboard', icon: TrendingUp },
        { label: '公司年度目标', path: '/goals/company' },
        { label: '团队月度目标', path: '/goals/team' },
        { label: '个人月度目标', path: '/goals/personal' },
      ]
    },
    { 
      icon: DollarSign, 
      label: '财务管理', 
      path: '/finance',
      children: [
        { label: '财务概览', path: '/finance', icon: BarChart3 },
        { label: '项目管理', path: '/finance/projects' },
        { label: '科目管理', path: '/finance/categories' },
        { label: '经营成本管理', path: '/finance/costs' },
        
        { label: '收入管理', path: '/finance/revenue', icon: Receipt },
        { label: '费用管理', path: '/finance/expenses', icon: CreditCard },
        { label: '往来管理', path: '/finance/accounts', icon: FileText },
        { label: '事项管理', path: '/finance/matters', icon: FileText },
        { label: '付款/借款管理', path: '/finance/payments', icon: CreditCard },
      ]
    },
    { 
      icon: Package, 
      label: '资产管理', 
      path: '/assets',
      children: [
        { label: '资产概览', path: '/assets', icon: BarChart3 },
        { label: '资产分类管理', path: '/assets/categories' },
        { label: '存放地点管理', path: '/assets/locations' },
        { label: '供应商管理', path: '/assets/suppliers' },
        { label: '品牌管理', path: '/assets/brands' },
        { label: '资产台账', path: '/assets/list' },
        { label: '资产变动', path: '/assets/movements' },
        { label: '维保管理', path: '/assets/maintenance' },
        { label: '资产处置', path: '/assets/disposal' },
        { label: '资产盘点', path: '/assets/inventory' },
        { label: '统计报表', path: '/assets/reports' },
        { 
          label: '采购管理', 
          path: '/assets/procurement',
          children: [
            { label: '采购订单', path: '/assets/procurement/orders' },
            { label: '采购入库', path: '/assets/procurement/receipts' },
          ]
        },
      ]
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isBasicInfoActive = () => {
    return location.pathname.startsWith('/members') || 
           location.pathname.startsWith('/departments') || 
           location.pathname.startsWith('/teams') ||
           location.pathname.startsWith('/customers') ||
           location.pathname.startsWith('/suppliers');
  };

  const isGoalsActive = () => {
    return location.pathname.startsWith('/goals');
  };

  const isFinanceActive = () => {
    return location.pathname.startsWith('/finance');
  };

  const isAssetsActive = () => {
    return location.pathname.startsWith('/assets');
  };

  const isProcurementActive = () => {
    return location.pathname.startsWith('/assets/procurement');
  };

  // 使用 useEffect 替代 useState 来处理自动展开逻辑
  useEffect(() => {
    if (isBasicInfoActive()) {
      setBasicInfoOpen(true);
    }
    if (isGoalsActive()) {
      setGoalsOpen(true);
    }
    if (isFinanceActive()) {
      setFinanceOpen(true);
    }
    if (isAssetsActive()) {
      setAssetsOpen(true);
    }
    if (isProcurementActive()) {
      setProcurementOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setSidebarOpen(false);
  };

  // 获取菜单项的展开状态
  const getMenuOpenState = (path: string) => {
    switch (path) {
      case '/basic':
        return basicInfoOpen;
      case '/goals':
        return goalsOpen;
      case '/finance':
        return financeOpen;
      case '/assets':
        return assetsOpen;
      case '/assets/procurement':
        return procurementOpen;
      default:
        return false;
    }
  };

  // 设置菜单项的展开状态
  const setMenuOpenState = (path: string, open: boolean) => {
    switch (path) {
      case '/basic':
        setBasicInfoOpen(open);
        break;
      case '/goals':
        setGoalsOpen(open);
        break;
      case '/finance':
        setFinanceOpen(open);
        break;
      case '/assets':
        setAssetsOpen(open);
        break;
      case '/assets/procurement':
        setProcurementOpen(open);
        break;
    }
  };

  // 获取层级样式
  const getLevelStyles = (level: number) => {
    switch (level) {
      case 0:
        return '';
      case 1:
        return 'ml-6 text-sm';
      case 2:
        return 'ml-12 text-xs';
      default:
        return `ml-${6 + level * 6} text-xs`;
    }
  };

  const renderMenuItem = (item: any, level = 0) => {
    if (item.children) {
      const isOpen = getMenuOpenState(item.path);
      
      return (
        <Collapsible 
          key={item.path} 
          open={isOpen} 
          onOpenChange={(open) => setMenuOpenState(item.path, open)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`w-full justify-between text-left theme-transition ${getLevelStyles(level)} ${
                isActive(item.path) 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="flex items-center">
                {level === 0 && <item.icon className="mr-3 h-4 w-4" />}
                {level === 1 && item.icon && <item.icon className="mr-3 h-3 w-3" />}
                {level === 1 && !item.icon && <div className="w-2 h-2 rounded-full bg-muted-foreground mr-3 opacity-60" />}
                {level === 2 && <div className="w-1 h-1 rounded-full bg-muted-foreground mr-3 opacity-40" />}
                <span>{item.label}</span>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {item.children.map((child: any) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.path}
        variant={isActive(item.path) ? "secondary" : "ghost"}
        className={`w-full justify-start text-left theme-transition ${getLevelStyles(level)} ${
          isActive(item.path) 
            ? 'bg-primary/80 text-primary-foreground hover:bg-primary/70' 
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
        onClick={() => {
          navigate(item.path);
          setSidebarOpen(false);
        }}
      >
        {level === 0 && <item.icon className="mr-3 h-4 w-4" />}
        {level === 1 && item.icon && <item.icon className="mr-3 h-3 w-3" />}
        {level === 1 && !item.icon && <div className="w-2 h-2 rounded-full bg-muted-foreground mr-3 opacity-60" />}
        {level === 2 && <div className="w-1 h-1 rounded-full bg-muted-foreground mr-3 opacity-40" />}
        <span>{item.label}</span>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition">
      {/* 移动端顶部栏 */}
      <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between theme-transition">
        <h1 className="text-xl font-bold text-primary">目标管理系统</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-foreground hover:bg-accent"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* 侧边栏 */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out theme-transition
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary">目标管理系统</h1>
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => renderMenuItem(item))}
            </nav>

            {/* 用户信息 */}
            <div className="p-4 border-t border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-accent">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-foreground">{user?.name || '未登录'}</div>
                      <div className="text-xs text-muted-foreground">{user?.position.name || ''}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                  <DropdownMenuItem 
                    className="text-popover-foreground hover:bg-accent cursor-pointer"
                    onClick={handleProfileClick}
                  >
                    <User className="mr-2 h-4 w-4" />
                    个人信息
                  </DropdownMenuItem>
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
        </div>

        {/* 主内容区 */}
        <div className="flex-1 lg:ml-0 bg-background theme-transition">
          <main className="p-6 bg-background theme-transition">
            <Outlet />
          </main>
        </div>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
