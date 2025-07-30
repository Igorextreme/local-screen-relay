
import { ScreenShareModel } from '../models/ScreenShareModel';

export const videoConfig = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60, max: 60 }
  }
};

export const frameRateWithCursor = 5;     // ~200 FPS com cursor  
export const frameRateWithoutCursor = 20;   // ~50 FPS sem cursor

export class ScreenShareController {
  private model: ScreenShareModel;
  private socket: WebSocket | null = null;
  private isCursorOverPreview = false;
  private isPageVisible = true;
  private frameWorker: Worker | null = null;
  private animationFrameId: number | null = null;

  constructor(model: ScreenShareModel) {
    this.model = model;
    this.initializePageVisibility();
  }

  async initializeWebSocket(): Promise<void> {
    const state = this.model.getState();
    if (!state.serverIP) {
      console.error('IP do servidor não encontrado');
      return;
    }

    try {
      // Usa o mesmo protocolo da página atual para WebSocket
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.socket = new WebSocket(`${wsProtocol}//${state.serverIP}:3000/transmitter`);
      this.model.setConnectionStatus('connecting');

      this.socket.onopen = () => {
        console.log('Conexão WebSocket estabelecida.');
        this.model.setConnectionStatus('connected');
      };

      this.socket.onerror = (err) => {
        console.error('Erro no WebSocket:', err);
        this.model.setConnectionStatus('error');
      };

      this.socket.onclose = () => {
        console.log('Conexão WebSocket encerrada.');
        this.model.setConnectionStatus('disconnected');
        this.model.setTransmitting(false);
      };
    } catch (error) {
      console.error('Erro ao inicializar WebSocket:', error);
      this.model.setConnectionStatus('error');
    }
  }

  setCursorOverPreview(isOver: boolean): void {
    this.isCursorOverPreview = isOver;
  }

  private initializePageVisibility(): void {
    // Detecta mudanças de visibilidade da página
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      console.log('Página visível:', this.isPageVisible);
    });

    // Detecta foco/perda de foco da janela
    window.addEventListener('focus', () => {
      this.isPageVisible = true;
    });

    window.addEventListener('blur', () => {
      this.isPageVisible = false;
    });
  }

  async startTransmission(): Promise<void> {
    // Verifica se a API está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      console.error('API de captura de tela não disponível. Certifique-se de estar usando HTTPS ou localhost.');
      this.model.setConnectionStatus('error');
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.initializeWebSocket();
      // Aguarda um pouco para a conexão ser estabelecida
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(videoConfig);
      this.model.setCurrentStream(stream);
      this.model.setTransmitting(true);

      // Inicializar Web Worker para processamento otimizado
      this.frameWorker = new Worker('/src/workers/frameWorker.ts', { type: 'module' });
      
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      await videoElement.play();

      // Canvas reutilizável para melhor performance
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { 
        alpha: false, 
        desynchronized: true,
        willReadFrequently: false 
      });

      // Configurar Worker
      this.frameWorker.onmessage = (e) => {
        const { success, data } = e.data;
        if (success && data && this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(data);
        }
      };

      // Função otimizada para captura de frames
      const captureFrame = () => {
        if (!stream.active || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
          this.stopTransmission();
          return;
        }

        try {
          // Redimensionar canvas apenas se necessário
          const videoWidth = videoElement.videoWidth;
          const videoHeight = videoElement.videoHeight;
          
          if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
          }

          ctx?.drawImage(videoElement, 0, 0);

          // Obter ImageData e enviar para Worker
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (imageData && this.frameWorker) {
            // Qualidade muito baixa para FPS máximo
            const quality = this.isCursorOverPreview ? 0.4 : 0.3;
            const maxWidth = this.isCursorOverPreview ? 1280 : 960;
            
            this.frameWorker.postMessage({
              type: 'PROCESS_FRAME',
              imageData: imageData.data,
              width: canvas.width,
              height: canvas.height,
              quality: quality,
              maxWidth: maxWidth
            }, { transfer: [imageData.data.buffer] });
          }
        } catch (err) {
          console.error('Erro durante captura de frame:', err);
        }
      };

      // Sistema de agendamento ultra-otimizado
      const scheduleFrames = () => {
        const frameInterval = this.isCursorOverPreview 
          ? frameRateWithCursor 
          : frameRateWithoutCursor;

        const nextFrame = () => {
          if (!stream.active) return;

          captureFrame();

          if (this.isPageVisible) {
            // Usa setInterval para máxima performance quando visível
            this.animationFrameId = requestAnimationFrame(() => {
              setTimeout(nextFrame, frameInterval);
            });
          } else {
            // FPS ainda mais reduzido quando inativo
            setTimeout(nextFrame, Math.max(frameInterval * 3, 100));
          }
        };

        nextFrame();
      };

      scheduleFrames();

    } catch (error) {
      console.error('Erro ao iniciar transmissão:', error);
      this.model.setConnectionStatus('error');
    }
  }

  private scheduleNextFrame: ((callback: () => void) => void) | null = null;

  stopTransmission(): void {
    const state = this.model.getState();
    if (state.currentStream) {
      state.currentStream.getTracks().forEach(track => track.stop());
      this.model.setCurrentStream(null);
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.frameWorker) {
      this.frameWorker.terminate();
      this.frameWorker = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.model.setTransmitting(false);
    this.model.setConnectionStatus('disconnected');
  }
}
