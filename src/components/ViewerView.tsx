
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ViewerController } from '../controllers/ViewerController';
import { ViewerModel } from '../models/ViewerModel';
import { Maximize2, Minimize2, Monitor, Wifi, WifiOff } from 'lucide-react';



const ViewerView: React.FC = () => {
  const [model] = useState(() => new ViewerModel());
  const [controller] = useState(() => new ViewerController(model));
  const [state, setState] = useState(model.getState());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const unsubscribe = model.subscribe(setState);
    return unsubscribe;
  }, [model]);

  useEffect(() => {
    if (canvasRef.current) {
      controller.initializeViewer(canvasRef.current);
    }

    const handleFullscreenChange = () => {
      model.setFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.fullscreenElement) {
        model.setFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      controller.disconnect();
    };
  }, [controller, model]);

  const handleToggleFullscreen = () => {
    controller.toggleFullscreen();
  };

  const getStatusColor = () => {
    switch (state.connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    return state.isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Monitor className="w-6 h-6" />
                Visualizador de Tela
              </div>
              <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="capitalize">{state.connectionStatus}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!state.isFullscreen && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {state.canvasSize.width > 0 && state.canvasSize.height > 0
                    ? `Resolução: ${state.canvasSize.width}x${state.canvasSize.height}`
                    : 'Aguardando transmissão...'}
                </div>
                <Button
                  onClick={handleToggleFullscreen}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  disabled={!state.isConnected}
                >
                  {state.isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4 mr-2" />
                      Sair da Tela Cheia
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Tela Cheia
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="relative bg-black rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-[70vh] object-contain"
                style={{ minHeight: '300px' }}
              />
              {!state.isConnected && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-lg mb-2">Aguardando transmissão...</p>
                    <p className="text-sm text-gray-400">
                      {state.connectionStatus === 'connecting' 
                        ? 'Conectando...' 
                        : 'Verifique se o transmissor está ativo'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {state.isConnected && (
              <div className="text-xs text-gray-500 text-center">
                Pressione ESC ou clique no botão para sair da tela cheia
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewerView;
