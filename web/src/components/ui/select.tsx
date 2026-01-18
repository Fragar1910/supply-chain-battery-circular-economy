'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  value?: string;
  onValueChange: (value: string, label: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  selectedLabel?: string;
  setSelectedLabel: (label: string) => void;
  registerItem: (itemValue: string, itemLabel: string) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
  disabled?: boolean;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, children, defaultValue, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value || defaultValue || '');
    const [selectedLabel, setSelectedLabel] = React.useState<string>('');
    const [itemsMap, setItemsMap] = React.useState<Map<string, string>>(new Map());
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = (newValue: string, label: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      setSelectedLabel(label);
      onValueChange?.(newValue);
      setOpen(false);
    };

    const registerItem = React.useCallback((itemValue: string, itemLabel: string) => {
      setItemsMap((prev) => {
        const next = new Map(prev);
        next.set(itemValue, itemLabel);
        return next;
      });
    }, []);

    // Update selectedLabel when value changes or itemsMap updates
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }

      // Auto-set label from itemsMap when available
      if (currentValue && itemsMap.has(currentValue)) {
        const label = itemsMap.get(currentValue);
        if (label && label !== selectedLabel) {
          setSelectedLabel(label);
        }
      }
    }, [value, currentValue, itemsMap]);

    // Close on outside click
    React.useEffect(() => {
      if (!open) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Close on escape key
    React.useEffect(() => {
      if (!open) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpen(false);
          triggerRef.current?.focus();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open]);

    return (
      <SelectContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          open,
          setOpen,
          triggerRef,
          contentRef,
          selectedLabel,
          setSelectedLabel,
          registerItem,
          disabled,
        }}
      >
        <div ref={ref} className="relative">
          {children}
        </div>
      </SelectContext.Provider>
    );
  }
);
Select.displayName = 'Select';

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, disabled: propDisabled, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error('SelectTrigger must be used within Select');
    }

    const { open, setOpen, triggerRef, disabled: contextDisabled } = context;
    const disabled = propDisabled ?? contextDisabled;
    const internalRef = React.useRef<HTMLButtonElement>(null);

    // Sync refs
    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        internalRef.current = node;
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref, triggerRef]
    );

    return (
      <button
        ref={setRefs}
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white ring-offset-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) {
            setOpen(!open);
          }
        }}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        {...props}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error('SelectValue must be used within Select');
    }

    const { selectedLabel, value } = context;

    // Show selectedLabel if available, otherwise show value if available, otherwise placeholder
    const displayText = selectedLabel || (value ? String(value) : '') || placeholder || 'Select an option...';

    return (
      <span ref={ref} className="truncate">
        {displayText}
      </span>
    );
  }
);
SelectValue.displayName = 'SelectValue';

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error('SelectContent must be used within Select');
    }

    const { open, contentRef } = context;
    const internalRef = React.useRef<HTMLDivElement>(null);

    // Sync refs
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref, contentRef]
    );

    // Always render children (for item registration) but hide when closed
    return (
      <div
        ref={setRefs}
        className={cn(
          'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-700 bg-slate-800 py-1 text-sm text-white shadow-lg',
          !open && 'hidden',
          className
        )}
        role="listbox"
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, disabled, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error('SelectItem must be used within Select');
    }

    const { value: selectedValue, onValueChange, setSelectedLabel, selectedLabel, registerItem } = context;
    const isSelected = selectedValue === value;

    // Extract text content from children for the label
    const getTextContent = (node: React.ReactNode): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (Array.isArray(node)) {
        return node.map(getTextContent).join('');
      }
      if (React.isValidElement(node)) {
        const props = node.props as { children?: React.ReactNode };
        if (props?.children) {
          return getTextContent(props.children);
        }
      }
      return '';
    };

    const label = React.useMemo(() => getTextContent(children), [children]);

    // Register this item immediately when mounted or when label changes
    React.useEffect(() => {
      if (label) {
        registerItem(value, label);
      }
    }, [value, label, registerItem]);

    // Set the label automatically if this item is selected and label is not set
    React.useEffect(() => {
      if (isSelected && !selectedLabel && label) {
        setSelectedLabel(label);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSelected, selectedLabel, setSelectedLabel, label]);

    const handleClick = () => {
      if (disabled) return;
      setSelectedLabel(label);
      onValueChange?.(value, label);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex select-none items-center px-3 py-2 outline-none',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:bg-slate-700 focus:bg-slate-700',
          isSelected && 'bg-slate-700',
          className
        )}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {children}
        {isSelected && (
          <span className="absolute right-2 text-green-500">✓</span>
        )}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
