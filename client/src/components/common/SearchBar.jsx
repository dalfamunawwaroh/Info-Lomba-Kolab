import { Search } from 'lucide-react';
import { Input } from './Input';

function SearchBar({ value, onChange, placeholder = 'Cari...', className }) {
  return (
    <div className={`relative ${className || ''}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

export { SearchBar };
