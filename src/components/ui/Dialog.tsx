import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog: React.FC<DialogProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const open = () => {
    if (controlledOpen === undefined) {
      setInternalOpen(true);
    }
    onOpenChange?.(true);
  };
  
  const close = () => {
    if (controlledOpen === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  return (
    <DialogContext.Provider value={{ isOpen, open, close }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger: React.FC<{ asChild?: boolean; children: ReactNode }> = ({ 
  asChild, 
  children 
}) => {
  const { open } = useDialog();
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: open });
  }
  
  return (
    <button onClick={open} type="button">
      {children}
    </button>
  );
};

const DialogPortal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return typeof document !== 'undefined' && document.body
    ? (document.body as any).createPortal(children, document.body)
    : null;
};

const DialogOverlay: React.FC<{ className?: string }> = ({ className }) => {
  const { isOpen, close } = useDialog();

  if (!isOpen) return null;

  return (
    <DialogPortal>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className
        )}
        onClick={close}
      />
    </DialogPortal>
  );
};

const DialogContent: React.FC<{ className?: string; children: ReactNode }> = ({ 
  className, 
  children 
}) => {
  const { isOpen } = useDialog();

  if (!isOpen) return null;

  return (
    <DialogPortal>
      <div
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          className
        )}
      >
        {children}
      </div>
    </DialogPortal>
  );
};

const DialogHeader: React.FC<{ className?: string; children: ReactNode }> = ({ 
  className, 
  children 
}) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
    {children}
  </div>
);

const DialogFooter: React.FC<{ className?: string; children: ReactNode }> = ({ 
  className, 
  children 
}) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
    {children}
  </div>
);

const DialogTitle: React.FC<{ className?: string; children: ReactNode }> = ({ 
  className, 
  children 
}) => (
  <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
    {children}
  </h2>
);

const DialogDescription: React.FC<{ className?: string; children: ReactNode }> = ({ 
  className, 
  children 
}) => (
  <p className={cn('text-sm text-muted-foreground', className)}>
    {children}
  </p>
);

const DialogClose: React.FC<{ asChild?: boolean; children: ReactNode }> = ({ 
  asChild, 
  children 
}) => {
  const { close } = useDialog();
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: close });
  }
  
  return (
    <button onClick={close} type="button">
      {children}
    </button>
  );
};

function useDialog(): DialogContextType {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider');
  }
  return context;
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
