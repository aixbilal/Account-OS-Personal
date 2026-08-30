import { KeyRound, ShieldCheck } from "lucide-react";
import type { Account } from "../domain/types";

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  return (
    <section className="account-list" aria-label="Synthetic account list">
      {accounts.map((account) => (
        <article className="account-card" key={account.id}>
          <div className="account-avatar" aria-hidden="true">
            {account.serviceName.slice(0, 1)}
          </div>
          <div className="account-summary">
            <div className="account-heading">
              <h2>{account.accountName}</h2>
              <span>{account.category}</span>
            </div>
            <p>{account.email}</p>
            <div className="account-metadata">
              <span>
                <KeyRound size={13} />
                {account.authenticationMethod}
              </span>
              <span>
                <ShieldCheck size={13} />
                {account.twoFactorInformation}
              </span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
