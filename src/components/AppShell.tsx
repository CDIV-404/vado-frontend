import { type ReactNode } from 'react';

export function AppShell({ children, dataSaver = false }: { children: ReactNode; dataSaver?: boolean }) {
  return (
    <div className="relative h-dvh overflow-hidden bg-night">
      {!dataSaver && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              'radial-gradient(at 18% 12%, rgba(22,135,255,0.16), transparent 45%), radial-gradient(at 85% 80%, rgba(56,201,255,0.12), transparent 50%), radial-gradient(at 50% 55%, rgba(7,25,43,0.9), transparent 70%)',
          }}
        />
      )}
      <main className={`relative z-10 mx-auto flex h-full w-full max-w-[1280px] flex-col overflow-hidden ${dataSaver ? 'bg-deep' : 'bg-deep/60'}`}>
        {children}
      </main>
    </div>
  );
}
