import { useState } from "react";

export default function ConfirmDeleteModal({ title, message, confirmWord, onConfirm, onCancel }) {
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const matches = input.trim().toLowerCase() === confirmWord.toLowerCase();

  async function handleConfirm() {
    if (!matches) return;
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-chalkboard/40 flex items-center justify-center px-4 z-50">
      <div className="bg-white border border-line rounded-lg p-6 max-w-sm w-full">
        <h3 className="font-display font-semibold text-lg text-chalkboard mb-2">{title}</h3>
        <p className="text-sm text-slate/70 mb-4">{message}</p>

        <label className="block text-xs font-medium text-slate/70 mb-1">
          Type <span className="font-mono text-terracotta">{confirmWord}</span> to confirm
        </label>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-3 py-2 border border-line rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-terracotta/50"
        />

        {error && <p className="text-sm text-terracotta mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-md text-sm border border-line text-slate/70 hover:bg-paper transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!matches || deleting}
            className="px-4 py-2 rounded-md text-sm bg-terracotta text-paper font-medium disabled:opacity-40 hover:bg-terracotta/90 transition"
          >
            {deleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
