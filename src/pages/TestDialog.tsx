import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  StrictDialog,
  StrictDialogContent,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestDialog = () => {
  const [isNormalDialogOpen, setIsNormalDialogOpen] = useState(false);
  const [isStrictDialogOpen, setIsStrictDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-4">弹框行为测试</h1>
          <p className="text-muted-foreground">
            测试普通弹框和严格控制弹框的行为差异
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 普通弹框测试 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">普通弹框</CardTitle>
              <p className="text-sm text-muted-foreground">
                点击框外或按ESC键可以关闭
              </p>
            </CardHeader>
            <CardContent>
              <Dialog open={isNormalDialogOpen} onOpenChange={setIsNormalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    打开普通弹框
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-popover border-border text-popover-foreground">
                  <DialogHeader>
                    <DialogTitle>普通弹框测试</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="normalName">名称</Label>
                      <Input 
                        id="normalName"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="请输入名称"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="normalDescription">描述</Label>
                      <Textarea 
                        id="normalDescription"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="请输入描述"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsNormalDialogOpen(false);
                          resetForm();
                        }}
                      >
                        取消
                      </Button>
                      <Button onClick={() => {
                        setIsNormalDialogOpen(false);
                        resetForm();
                      }}>
                        确定
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* 严格控制弹框测试 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">严格控制弹框</CardTitle>
              <p className="text-sm text-muted-foreground">
                只能通过按钮关闭，点击框外或按ESC键无效
              </p>
            </CardHeader>
            <CardContent>
              <StrictDialog open={isStrictDialogOpen} onOpenChange={setIsStrictDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    打开严格弹框
                  </Button>
                </DialogTrigger>
                <StrictDialogContent className="bg-popover border-border text-popover-foreground">
                  <DialogHeader>
                    <DialogTitle>严格控制弹框测试</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="strictName">名称</Label>
                      <Input 
                        id="strictName"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="请输入名称"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="strictDescription">描述</Label>
                      <Textarea 
                        id="strictDescription"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="请输入描述"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsStrictDialogOpen(false);
                          resetForm();
                        }}
                      >
                        取消
                      </Button>
                      <Button onClick={() => {
                        setIsStrictDialogOpen(false);
                        resetForm();
                      }}>
                        确定
                      </Button>
                    </div>
                  </div>
                </StrictDialogContent>
              </StrictDialog>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">测试说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 普通弹框：点击框外或按ESC键可以关闭</li>
            <li>• 严格控制弹框：只能通过"取消"或"确定"按钮关闭</li>
            <li>• 在严格弹框中输入内容后，尝试点击框外或按ESC键，弹框不会关闭</li>
            <li>• 这样可以防止用户意外丢失已输入的数据</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestDialog;
