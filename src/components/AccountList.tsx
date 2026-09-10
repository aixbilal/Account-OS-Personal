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
    <div className="account-list" aria-label="Account list" role="list">
      {accounts.map((account) => {
        const selected = account.id === selectedAccountId;
        return (
          <button aria-current={selected ? "true" : undefined} className="account-card" data-selected={selected} key={account.id} onClick={() => onSelect(account)} role="listitem" type="button">
            <ServiceIdentityMark account={account} />
            <span className="account-summary">
              <span className="account-heading"><strong>{account.accountName}</strong><small>{account.category}</small></span>
              <span>{account.email || account.username || account.serviceName}</span>
            </span>
            <ChevronRight aria-hidden="true" className="account-chevron" size={17} />
          </button>
        );
      })}
    </div>
  );
}
