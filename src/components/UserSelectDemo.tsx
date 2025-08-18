import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import UserSelect from './UserSelect';

const UserSelectDemo = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">UserSelect 组件演示</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>执行人选择器</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="assignee">选择执行人</Label>
            <UserSelect
              value={selectedUser}
              onValueChange={setSelectedUser}
              placeholder="选择执行人"
            />
          </div>
          
          <div className="pt-4">
            <Label>当前选择：</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedUser ? `已选择用户ID: ${selectedUser}` : '未选择任何用户'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-sm text-muted-foreground">
        <h3 className="font-semibold mb-2">功能特性：</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>按部门层级显示用户</li>
          <li>支持搜索姓名和工号</li>
          <li>部门显示为不可选择的标题</li>
          <li>用户显示为可选择项</li>
          <li>响应式设计和键盘导航</li>
        </ul>
      </div>
    </div>
  );
};

export default UserSelectDemo;
