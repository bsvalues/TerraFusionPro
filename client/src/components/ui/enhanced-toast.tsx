import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';
import { toast, ToastOptions } from '@/hooks/use-toast';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface EnhancedToastOptions extends Omit<ToastOptions, 'variant'> {
  title: string;
  description?: string;
  duration?: number;
  action?: React.ReactNode;
}

export const enhancedToast = {
  success: (options: EnhancedToastOptions) => {
    return toast({
      ...options,
      description: options.description,
      variant: 'default',
      duration: options.duration || 5000,
      className: 'bg-green-50 text-green-800 border-green-200',
      title: (
        <div className="flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
          <span>{options.title}</span>
        </div>
      ),
      action: options.action || (
        <button 
          onClick={() => toast.dismiss()}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-green-200 bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      )
    });
  },
  
  error: (options: EnhancedToastOptions) => {
    return toast({
      ...options,
      description: options.description,
      variant: 'destructive',
      duration: options.duration || 8000, // Errors should stay longer
      title: (
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-destructive-foreground mr-2" />
          <span>{options.title}</span>
        </div>
      ),
      action: options.action || (
        <button 
          onClick={() => toast.dismiss()}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      )
    });
  },
  
  warning: (options: EnhancedToastOptions) => {
    return toast({
      ...options,
      description: options.description,
      variant: 'default',
      duration: options.duration || 6000,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      title: (
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <span>{options.title}</span>
        </div>
      ),
      action: options.action || (
        <button 
          onClick={() => toast.dismiss()}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      )
    });
  },
  
  info: (options: EnhancedToastOptions) => {
    return toast({
      ...options,
      description: options.description,
      variant: 'default',
      duration: options.duration || 4000,
      className: 'bg-blue-50 text-blue-800 border-blue-200',
      title: (
        <div className="flex items-center">
          <Info className="h-5 w-5 text-blue-500 mr-2" />
          <span>{options.title}</span>
        </div>
      ),
      action: options.action || (
        <button 
          onClick={() => toast.dismiss()}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      )
    });
  },
  
  loading: (options: EnhancedToastOptions) => {
    return toast({
      ...options,
      description: options.description,
      variant: 'default',
      duration: options.duration || 100000, // Long duration as loading is typically dismissed programmatically
      className: 'bg-slate-50 text-slate-800 border-slate-200',
      title: (
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 text-slate-500 mr-2 animate-spin" />
          <span>{options.title}</span>
        </div>
      ),
    });
  },
};