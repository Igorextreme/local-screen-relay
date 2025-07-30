import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const SecurityWarning = () => {
  const isSecureContext = window.isSecureContext;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isSecureContext || isLocalhost) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Contexto Inseguro Detectado</AlertTitle>
      <AlertDescription>
        A captura de tela requer um contexto seguro (HTTPS) ou localhost. 
        Acesse via HTTPS ou localhost para usar a transmissão de tela.
      </AlertDescription>
    </Alert>
  );
};