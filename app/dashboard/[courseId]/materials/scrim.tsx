/** Centered modal scrim — the ink/40 backdrop + raised card used by the
 *  materials surface's confirm/picker dialogs. Click-outside closes. */
export function ConfirmScrim({
  onClose,
  label,
  children,
}: {
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-md rounded-xl border border-rule bg-raised p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
