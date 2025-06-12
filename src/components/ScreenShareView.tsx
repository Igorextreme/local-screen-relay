
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScreenShareController } from '../controllers/ScreenShareController';
import { ScreenShareModel } from '../models/ScreenShareModel';
import { Monitor, Square, Wifi, WifiOff } from 'lucide-react';

const ScreenShareView: React.FC = () => {
  const [model] = useState(() => new ScreenShareModel());
  const [controller] = useState(() => new ScreenShareController(model));
  const [state, setState] = useState(model.getState());
  const previewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const unsubscribe = model.subscribe(setState);
    return unsubscribe;
  }, [model]);

  useEffect(() => {
    if (state.currentStream && previewRef.current) {
      previewRef.current.srcObject = state.currentStream;
    }
  }, [state.currentStream]);

  const handleStartTransmission = async () => {
    if (state.isTransmitting) {
      controller.stopTransmission();
    } else {
      await controller.startTransmission();
    }
  };

  const handleMouseEnter = () => controller.setCursorOverPreview(true);
  const handleMouseLeave = () => controller.setCursorOverPreview(false);

  const getStatusColor = () => {
    switch (state.connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    return state.connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-6 h-6" />
              Transmissão de Tela Local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="capitalize">{state.connectionStatus}</span>
              </div>
              {state.serverIP && (
                <div className="text-sm text-gray-600">
                  Servidor: http://{state.serverIP}:8080
                </div>
              )}
            </div>

            <Button 
              onClick={handleStartTransmission}
              disabled={state.connectionStatus === 'connecting'}
              className="w-full"
              variant={state.isTransmitting ? "destructive" : "default"}
            >
              {state.isTransmitting ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Parar Transmissão
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4 mr-2" />
                  Iniciar Transmissão
                </>
              )}
            </Button>

            {state.isTransmitting && (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  Preview da transmissão (taxa de quadros ajustada pelo mouse)
                </div>
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="w-full max-h-64 bg-black rounded-lg border"
                />
                <div className="text-xs text-gray-500 text-center">
                  Passe o mouse sobre o preview para aumentar a taxa de quadros
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScreenShareView;
