import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { User as UserType } from '@/types';
import api from '@/services/api';

interface UserSelectSimpleProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const UserSelectSimple: React.FC<UserSelectSimpleProps> = ({
  value,
  onValueChange,
  placeholder = "选择执行人",
  disabled = false,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 加载用户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const usersData = await api.user.getAll();
        console.log('加载的用户数据:', usersData);
        setUsers(usersData || []);
      } catch (error) {
        console.error('加载数据失败:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 获取选中的用户名称
  const getSelectedUserName = () => {
    if (!value) return '';
    
    const selectedUser = users.find(user => user.id === value);
    return selectedUser ? `${selectedUser.name} (${selectedUser.employee_id})` : '';
  };

  // 处理选择
  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearchTerm('');
  };

  // 过滤用户
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background border-border text-foreground",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {value ? getSelectedUserName() : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false} className="w-full">
          <CommandInput 
            placeholder="搜索姓名或工号..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="border-0 focus:ring-0"
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              {loading ? "加载中..." : "未找到用户"}
            </CommandEmpty>
            <CommandGroup>
              {filteredUsers.map(user => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => handleSelect(user.id)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <User className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-normal">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({user.employee_id})
                    </span>
                  </div>
                  <Check className={cn(
                    "ml-auto h-4 w-4",
                    "opacity-0"
                  )} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSelectSimple;
