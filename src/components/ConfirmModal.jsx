import { createPortal } from 'react-dom';

const ConfirmModal = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  if (!open) return null;

  const confirmClass = variant === 'danger'
    ? 'bg-error text-on-primary hover:bg-red-700'
    : 'bg-primary text-on-primary hover:bg-inverse-surface';

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ minWidth: '320px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <span className="material-symbols-outlined text-[24px]">
              {variant === 'danger' ? 'warning' : 'help'}
            </span>
          </div>

          {/* Title & Message */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{message}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
