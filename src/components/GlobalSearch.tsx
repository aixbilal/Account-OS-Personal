import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchAccounts } from "../domain/globalSearch";
import type { Account } from "../domain/types";
import { ServiceIdentityMark } from "./ServiceIdentity";
import { Dialog } from "./ui/Modal";

const MAX_RESULTS = 8;

interface GlobalSearchProps {
  accounts: Account[];
  onClose: () => void;
  onSelectAccount: (account: Account) => void;
}

/** Ctrl+K / Cmd+K global search (Item 3, V3 fixture pass). Real account
 * fields only (name, service, email, website) - see domain/globalSearch. */
export function GlobalSearch({ accounts, onClose, onSelectAccount }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchAccounts(accounts, query).slice(0, MAX_RESULTS), [accounts, query]);

  useEffect(() => setActiveIndex(0), [query]);

  function select(account: Account) {
    onSelectAccount(account);
    onClose();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[activeIndex]);
    }
  }

  return (
    <Dialog className="global-search-dialog" label="Search accounts" onRequestClose={onClose}>
      <label className="global-search-field">
        <Search aria-hidden="true" size={17} />
        <input
          aria-activedescendant={results[activeIndex] ? `global-search-result-${results[activeIndex].id}` : undefined}
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          data-autofocus
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search accounts, domains…"
          ref={inputRef}
          role="combobox"
          value={query}
        />
        {query && <button aria-label="Clear search" className="icon-button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} type="button"><X size={15} /></button>}
      </label>

      {query.trim() !== "" && (
        results.length ? (
          <ul className="global-search-results" role="listbox">
            {results.map((account, index) => (
              <li key={account.id}>
                <button
                  aria-selected={index === activeIndex}
                  className="global-search-result"
                  data-active={index === activeIndex}
                  id={`global-search-result-${account.id}`}
                  onClick={() => select(account)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <ServiceIdentityMark account={account} size="small" />
                  <span><strong>{account.accountName}</strong><small>{account.email || account.website || account.serviceName}</small></span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="global-search-empty">
            <Search aria-hidden="true" size={24} />
            <h3>No matching accounts</h3>
            <p>Try a different name, email, or domain.</p>
          </div>
        )
      )}
    </Dialog>
  );
}
