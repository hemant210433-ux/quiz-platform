import { createContext, useCallback, useContext, useState } from 'react';
import Modal from '../components/common/Modal.jsx';

const ConfirmContext = createContext(null);

/**
 * const confirm = useConfirm();
 * if (await confirm({ title, message, confirmLabel, danger, requireText })) { ... }
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [typed, setTyped] = useState('');

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setTyped('');
        setState({ ...opts, resolve });
      }),
    [],
  );

  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const blocked = state?.requireText && typed.trim() !== state.requireText;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} title={state?.title || 'Are you sure?'}>
        {state && (
          <>
            <div className="text-sm text-ink-600">{state.message}</div>
            {state.requireText && (
              <div className="mt-4">
                <label className="label" htmlFor="confirm-text">
                  Type <span className="font-mono font-semibold text-ink-900">{state.requireText}</span> to confirm
                </label>
                <input id="confirm-text" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => close(false)}>
                {state.cancelLabel || 'Cancel'}
              </button>
              <button className={state.danger ? 'btn-danger' : 'btn-primary'} disabled={blocked} onClick={() => close(true)} autoFocus={!state.requireText}>
                {state.confirmLabel || 'Confirm'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
