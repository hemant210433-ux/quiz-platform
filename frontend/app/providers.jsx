'use client';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import { ToastProvider } from '@/hooks/useToast.jsx';
import { LangProvider } from '@/i18n/LangProvider.jsx';
import WarmUp from '@/components/site/WarmUp.jsx';
import { ConfirmProvider } from '@/hooks/useConfirm.jsx';

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider><LangProvider>
          <WarmUp />
          {children}
        </LangProvider></AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
