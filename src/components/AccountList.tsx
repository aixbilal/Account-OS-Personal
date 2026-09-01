import type { Account } from "../domain/types";
import { ServiceIdentityMark } from "./ServiceIdentity";

interface AccountListProps {
  accounts: Account[];
  onSelect: (account: Account) => void;
  selectedAccountId?: string;
}

export function AccountList({ accounts, onSelect, selectedAccountId }: AccountListProps) {
  return (
    <section className="account-list" aria-label="Synthetic account list">
      {accounts.map((account) => (
        <button aria-pressed={account.id === selectedAccountId} className="account-card" data-selected={account.id === selectedAccountId} key={account.id} onClick={() => onSelect(account)} type="button">
          <ServiceIdentityMark account={account} />
          <div className="account-summary">
            <div className="account-heading">
              <h2>{account.accountName}</h2>
              <span>{account.category}</span>
            </div>
            <p>{account.email}</p>
          </div>
        </button>
      ))}
    </section>
  );
}
