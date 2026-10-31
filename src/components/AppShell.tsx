import { type ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-night">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(at 18% 12%, rgba(22,135,255,0.16), transparent 45%), radial-gradient(at 85% 80%, rgba(56,201,255,0.12), transparent 50%), radial-gradient(at 50% 55%, rgba(7,25,43,0.9), transparent 70%)',
        }}
      />
      <main
        className="relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-deep/60 min-[700px]:h-[660px] min-[700px]:w-[312px] min-[700px]:rounded-[32px] min-[700px]:border min-[700px]:border-[#d8f3ff]/45 min-[700px]:shadow-phone"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden rounded-[32px] min-[700px]:block"
          style={{
            background:
              'linear-gradient(90deg, rgba(216,243,255,0.14) 0%, transparent 3%, transparent 97%, rgba(216,243,255,0.14) 100%), linear-gradient(180deg, rgba(216,243,255,0.10), transparent 12%)',
          }}
        />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] min-[700px]:m-[2px] min-[700px]:h-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
