export default function DevCredit() {
  return (
    <div className="dev-credit-bar">
      <span className="dev-credit-prefix">site dev</span>
      <a
        className="dev-credit-chip"
        href="https://x.com/AquaticXCP"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Site developer @AquaticXCP on X"
      >
        <svg
          className="dev-credit-icon"
          width="12"
          height="14"
          viewBox="0 0 12 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 1C6 1 3 4.5 3 7.5C3 9.43 4.34 11 6 11C7.66 11 9 9.43 9 7.5C9 4.5 6 1 6 1Z"
            stroke="#52b563"
            strokeWidth="1.1"
            fill="none"
          />
          <path
            d="M4.5 9.5C4.5 9.5 4 11 4 12.5"
            stroke="#52b563"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M7.5 9.5C7.5 9.5 8 11 8 12.5"
            stroke="#52b563"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
        <span className="dev-credit-label">@AquaticXCP</span>
      </a>
    </div>
  );
}
