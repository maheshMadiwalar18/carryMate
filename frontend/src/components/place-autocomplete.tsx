'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { searchPlaces, type PlaceResult } from '@/lib/geocoding';
import { MapPin } from 'lucide-react';

export function PlaceAutocomplete({
  label,
  placeholder,
  value,
  onSelect,
}: {
  label: string;
  placeholder?: string;
  value: { name: string; lat: number; lng: number } | null;
  onSelect: (place: PlaceResult) => void;
}) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local input state to the controlled `value` prop on change
    setQuery(value?.name || '');
  }, [value?.name]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (query && (!value || query !== value.name)) {
        const res = await searchPlaces(query);
        setResults(res);
        setOpen(res.length > 0);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-sm font-medium text-navy-900">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          className="pl-9"
          placeholder={placeholder || 'Search for a city...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border-subtle bg-white shadow-lg max-h-56 overflow-auto">
          {results.map((r, i) => (
            <button
              type="button"
              key={i}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
              onClick={() => {
                onSelect(r);
                setQuery(r.name);
                setOpen(false);
              }}
            >
              <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
