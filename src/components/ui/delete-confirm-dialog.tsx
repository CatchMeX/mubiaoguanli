import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title = '确认删除',
  description,
  itemName,
  trigger,
  disabled = false,
  destructive = true,
}) => {
  const defaultDescription = itemName 
    ? `确定要删除"${itemName}"吗？此操作不可撤销。`
    : '确定要删除此项吗？此操作不可撤销。';

  const handleConfirm = () => {
    onConfirm();
    onOpenChange?.(false);
  };

  const dialogContent = (
    <AlertDialogContent className="bg-popover border-border">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span>{title}</span>
        </AlertDialogTitle>
        <AlertDialogDescription>
          {description || defaultDescription}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction 
          className={destructive ? "bg-red-600 hover:bg-red-700" : undefined}
          onClick={handleConfirm}
        >
          删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild disabled={disabled}>
          {trigger}
        </AlertDialogTrigger>
        {dialogContent}
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </AlertDialog>
  );
};

export const DeleteButton: React.FC<{
  onConfirm: () => void;
  itemName?: string;
  title?: string;
  description?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
  className?: string;
}> = ({
  onConfirm,
  itemName,
  title,
  description,
  size = 'sm',
  variant = 'outline',
  disabled = false,
  className = '',
}) => {
  return (
    <DeleteConfirmDialog
      onConfirm={onConfirm}
      title={title}
      description={description}
      itemName={itemName}
      trigger={
        <Button 
          size={size}
          variant={variant}
          disabled={disabled}
          className={`border-red-500 text-red-500 hover:bg-red-500 hover:text-white ${className}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      }
    />
  );
};

