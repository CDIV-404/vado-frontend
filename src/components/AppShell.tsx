import { type ReactNode } from 'react';

export function AppShell({ children, dataSaver = false }: { children: ReactNode; dataSaver?: boolean }) {
  return (
    <div className={`vado-environment relative flex h-dvh w-full items-center justify-center overflow-hidden ${dataSaver ? 'vado-data-saver' : ''}`}>
      <div aria-hidden="true" className="vado-ambient vado-ambient-one" />
      <div aria-hidden="true" className="vado-ambient vado-ambient-two" />
      <main className="vado-device relative z-10 flex h-full w-full flex-col overflow-hidden">
        <span aria-hidden="true" className="vado-device-reflection vado-device-reflection-left" />
        <span aria-hidden="true" className="vado-device-reflection vado-device-reflection-right" />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
