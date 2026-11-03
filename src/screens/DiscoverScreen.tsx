import { useState, type FormEvent } from 'react';
import { Compass, Search, X } from 'lucide-react';

const CATEGORIES = [
  'Entertainment', 'Education', 'Technology', 'Gaming', 'Music',
  'Lifestyle', 'Sports', 'Comedy', 'Business', 'Art', 'Fashion',
];

export function DiscoverScreen({ onRequireAuth, isAuthenticated }: { onRequireAuth: (action: string) => void; isAuthenticated: boolean }) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(query.trim());
  };

  return (
    <div className="scroll-slim h-full overflow-y-auto px-5 py-7 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#287CFF]/30 bg-[#287CFF]/10 text-[#38C9FF]">
            <Compass size={21} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-[#F5F7FF]">Discover</h1>
            <p className="text-xs text-[#AAB8D0]">Find videos, creators, topics and communities.</p>
          </div>
        </div>

        <form onSubmit={search} className="vado-glass-card mt-7 flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:border-[#38C9FF]/60">
          <Search size={18} className="shrink-0 text-[#AAB8D0]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search VADO"
            aria-label="Search VADO"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#F5F7FF] outline-none placeholder:text-[#AAB8D0]/70"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSubmitted(''); }} aria-label="Clear search" className="text-[#AAB8D0] hover:text-white">
              <X size={17} />
            </button>
          )}
          <button type="submit" className="rounded-xl bg-[#287CFF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769e8]">Search</button>
        </form>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-[#F5F7FF]">Explore categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => { setCategory(category === item ? null : item); setSubmitted(''); }}
                aria-pressed={category === item}
                className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                  category === item
                    ? 'border-[#38C9FF]/60 bg-[#287CFF]/20 text-white'
                    : 'border-white/10 bg-white/[0.035] text-[#AAB8D0] hover:border-white/25 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="vado-glass-card mt-10 rounded-3xl px-6 py-12 text-center sm:px-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#38C9FF]/20 bg-[#287CFF]/10 text-[#38C9FF]">
            <Compass size={24} />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-[#F5F7FF]">
            {submitted ? 'Search is ready for platform content' : category ? `${category} is waiting to be explored` : 'Your next discovery starts here'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#AAB8D0]">
            {submitted
              ? `No VADO search service is connected yet, so “${submitted}” has not been searched.`
              : 'There are no public videos or creator records to show yet. New content will appear here when it is available.'}
          </p>
          {isAuthenticated ? (
            <p className="mt-6 text-xs text-[#AAB8D0]">Personalization will be available when VADO services are connected.</p>
          ) : (
            <button
              type="button"
              onClick={() => onRequireAuth('follow creators and personalize Discover')}
              className="mt-6 rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium text-[#F5F7FF] transition-colors hover:border-[#38C9FF]/50 hover:bg-white/5"
            >
              Create an account to personalize Discover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
