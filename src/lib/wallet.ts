import { DEFAULT_COINS } from '../data/mock';
import { load, save } from './store';

export type WalletEntry = { id: string; label: string; coins: number; at: string; kind: 'purchase' | 'subscription' | 'gift' | 'refund' };

export function coins(): number {
  return load<number>('coins', DEFAULT_COINS);
}

export function setBalance(n: number): void {
  save('coins', Math.max(0, Math.round(n)));
}

export function ledger(): WalletEntry[] {
  return load<WalletEntry[]>('walletLedger', []);
}

export function spend(id: string, label: string, amount: number, kind: WalletEntry['kind']): number {
  const bal = coins() - amount;
  setBalance(bal);
  const entry: WalletEntry = { id, label, coins: -amount, at: 'now', kind };
  save('walletLedger', [entry, ...ledger()]);
  return bal;
}

export function refund(id: string, label: string, amount: number): number {
  const bal = coins() + amount;
  setBalance(bal);
  const entry: WalletEntry = { id, label, coins: amount, at: 'now', kind: 'refund' };
  save('walletLedger', [entry, ...ledger()]);
  return bal;
}
