export function AccountOsMark({ size = 42 }: { size?: number }) {
  return (
    <svg aria-hidden="true" className="aos-logo-mark" height={size} viewBox="0 0 48 48" width={size}>
      <path d="M27.8 7.5a10.8 10.8 0 0 1 15.3 15.3l-5.3 5.3a10.8 10.8 0 0 1-15.3 0" fill="none" stroke="#f4a51c" strokeLinecap="round" strokeWidth="6.2" />
      <path d="M20.2 40.5A10.8 10.8 0 0 1 4.9 25.2l5.3-5.3a10.8 10.8 0 0 1 15.3 0" fill="none" stroke="#208cf2" strokeLinecap="round" strokeWidth="6.2" />
      <path d="m17.3 29.8 13.4-11.6" fill="none" stroke="#1781de" strokeLinecap="round" strokeWidth="5.2" />
      <circle cx="24" cy="24" fill="#ffffff" r="2.8" />
    </svg>
  );
}

export function AccountOsBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="aos-brand-lockup">
      <AccountOsMark size={compact ? 38 : 46} />
      <div>
        <strong>Account OS</strong>
        {!compact && <span>Your data. Your control.</span>}
      </div>
    </div>
  );
}
