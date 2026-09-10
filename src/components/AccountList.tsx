import { ChevronRight } from "lucide-react";
import type { Account } from "../domain/types";
import { ServiceIdentityMark } from "./ServiceIdentity";

interface AccountListProps {
  accounts: Account[];
  onSelect: (account: Account) => void;
  selectedAccountId?: string;
}

export function AccountList({ accounts, onSelect, selectedAccountId }: AccountListProps) {
  return (
    <ul className="account-list" aria-label="Account list">
      {accounts.map((account) => {
        const selected = account.id === selectedAccountId;
        return (
          <li key={account.id}>
            <button aria-current={selected ? "true" : undefined} className="account-card" data-selected={selected} onClick={() => onSelect(account)} type="button">
              <ServiceIdentityMark account={account} />
              <span className="account-summary">
                <span className="account-heading"><strong>{account.accountName}</strong><small>{account.category}</small></span>
                <span>{account.email || account.username || account.serviceName}</span>
              </span>
              <ChevronRight aria-hidden="true" className="account-chevron" size={17} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
