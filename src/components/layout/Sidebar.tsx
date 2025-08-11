import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  Building2,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Shield,
  Route,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Database,
  FolderOpen,
  Building,
  Truck,
  Package,
  ArrowUpDown,
} from 'lucide-react';

const menuItems = [
  {
    title: '统计看板',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    title: '成员管理',
    icon: Users,
    href: '/members',
  },
  {
    title: '任务管理',
    icon: CheckSquare,
    href: '/tasks',
  },
  {
    title: '目标管理',
    icon: Target,
    href: '/goals',
  },
  {
    title: '部门管理',
    icon: Building2,
    href: '/departments',
  },
  {
    title: '团队管理',
    icon: UserCheck,
    href: '/teams',
  },
  {
    title: '权限管理',
    icon: Shield,
    children: [
      {
        title: '角色管理',
        href: '/permissions/roles',
      },
      {
        title: '权限分配',
        href: '/permissions/assignments',
      },
    ],
  },
  {
    title: '员工里程',
    icon: Route,
    href: '/mileage',
  },
  {
    title: '财务管理',
    icon: DollarSign,
    children: [
      {
        title: '收入管理',
        href: '/finance/revenue',
      },
      {
        title: '费用管理',
        href: '/finance/expense',
      },
      {
        title: '成本管理',
        href: '/finance/cost',
      },
      {
        title: '往来管理',
        href: '/finance/accounts',
      },
      {
        title: '事项管理',
        href: '/finance/matters',
      },
      {
        title: '付款/借款管理',
        href: '/finance/payments',
      },
    ],
  },
  {
    title: '采购管理',
    icon: Truck,
    children: [
      {
        title: '采购订单',
        href: '/procurement/orders',
      },
      {
        title: '采购入库',
        href: '/procurement/receipts',
      },
    ],
  },
  {
    title: '基础数据',
    icon: Database,
    children: [
      {
        title: '项目管理',
        href: '/basic-data/projects',
      },
      {
        title: '客户供应商',
        href: '/basic-data/suppliers',
      },
    ],
  },
  {
    title: '资产管理',
    icon: Building,
    children: [
      {
        title: '资产清单',
        href: '/assets/list',
      },
      {
        title: '出入库管理',
        href: '/assets/inventory',
      },
      {
        title: '资产分类',
        href: '/assets/categories',
      },
      {
        title: '存放位置',
        href: '/assets/locations',
      },
      {
        title: '品牌管理',
        href: '/assets/brands',
      },
      {
        title: '资产调拨',
        href: '/assets/movements',
      },
      {
        title: '维护管理',
        href: '/assets/maintenance',
      },
      {
        title: '资产处置',
        href: '/assets/disposal',
      },
    ],
  },
  {
    title: '系统设置',
    icon: Settings,
    href: '/settings',
  },
];

export function Sidebar() {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<string[]>(['财务管理', '基础数据', '权限管理', '资产管理', '采购管理']);

  const toggleItem = (title: string) => {
    setOpenItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isParentActive = (children: { href: string }[]) => {
    return children.some(child => isActive(child.href));
  };

  return (
    <div className="w-64 bg-card border-r border-border h-full theme-transition">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">目标管理系统</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {menuItems.map((item) => {
              if (item.children) {
                const isOpen = openItems.includes(item.title);
                const hasActiveChild = isParentActive(item.children);
                
                return (
                  <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent",
                          hasActiveChild && "bg-accent text-foreground"
                        )}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                        {isOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.href}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start pl-8 text-muted-foreground hover:text-foreground hover:bg-accent",
                            isActive(child.href) && "bg-accent text-foreground"
                          )}
                          asChild
                        >
                          <Link to={child.href}>
                            {child.title}
                          </Link>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent",
                    isActive(item.href) && "bg-accent text-foreground"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
