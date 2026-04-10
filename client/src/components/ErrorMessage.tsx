interface Props {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  retryLabel = "Retry",
}: Props) {
  return (
    <div className="error-message">
      <p className="error-message__text">{message}</p>
      <button className="error-message__retry" onClick={onRetry}>
        {retryLabel}
      </button>
    </div>
  );
}
