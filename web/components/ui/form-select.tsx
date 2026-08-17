import { selectClassName } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Option = { value: string; label: string };

type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly Option[];
  placeholder?: string;
};

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ options, placeholder = 'Select…', className, ...props }, ref) => (
    <select ref={ref} className={cn(selectClassName, className)} {...props}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
);
FormSelect.displayName = 'FormSelect';
