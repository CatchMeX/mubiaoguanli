import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Menu, Target, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

const MobileHeader = ({ onMenuToggle, title = "目标管理系统" }: MobileHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<any[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="mr-3 h-8 w-8"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
      </div>

      {/* 右侧按钮组 */}
      <div className="flex items-center space-x-2">
        {/* 切换皮肤按钮 */}
        <ThemeToggle />
        
        {/* 个人信息按钮 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 p-0 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            <div className="p-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
                    {user?.position?.name || ''}
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
    </header>
  );
};

export default MobileHeader;
