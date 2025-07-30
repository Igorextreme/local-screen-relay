
import { ScreenShareModel } from '../models/ScreenShareModel';

export const videoConfig = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60, max: 60 }
  }
};

export const frameRateWithCursor = 8;     // ~120 FPS com cursor  
export const frameRateWithoutCursor = 33;   // ~30 FPS sem cursor

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

      const videoTrack = stream.getVideoTracks()[0];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const videoElement = document.createElement('video');

      videoElement.srcObject = stream;
      await videoElement.play();

      // Função para enviar frames otimizada
      const sendFrame = () => {
        if (!stream.active || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
          this.stopTransmission();
          return;
        }

        try {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;

          ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          // Qualidade reduzida para melhor performance
          canvas.toBlob(
            (blob) => {
              if (blob && this.socket && this.socket.readyState === WebSocket.OPEN) {
                blob.arrayBuffer()
                  .then((buffer) => {
                    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                      this.socket.send(buffer);
                    }
                  })
                  .catch((err) => {
                    console.error('Erro ao converter Blob para ArrayBuffer:', err);
                  });
              }
            },
            'image/jpeg',
            0.7  // Qualidade reduzida de 0.9 para 0.7 para melhor FPS
          );
        } catch (err) {
          console.error('Erro durante o envio de quadros:', err);
        }
      };

      // Sistema de agendamento otimizado para manter FPS constante
      const scheduleFrames = () => {
        const frameInterval = this.isCursorOverPreview 
          ? frameRateWithCursor 
          : frameRateWithoutCursor;

        const nextFrame = () => {
          if (!stream.active) return;

          sendFrame();

          if (this.isPageVisible) {
            // Usa requestAnimationFrame + setTimeout para melhor precisão quando visível
            this.animationFrameId = requestAnimationFrame(() => {
              setTimeout(nextFrame, frameInterval);
            });
          } else {
            // Usa setTimeout direto quando invisível, mas com FPS reduzido para economizar recursos
            const inactiveInterval = Math.max(frameInterval * 2, 33); // Máximo 30 FPS quando inativo
            setTimeout(nextFrame, inactiveInterval);
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
