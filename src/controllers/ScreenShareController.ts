
import { ScreenShareModel } from '../models/ScreenShareModel';

export const videoConfig = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60, max: 60 }
  }
};

export const frameRateWithCursor = 16;    // ~60 FPS com cursor
export const frameRateWithoutCursor = 100; // ~10 FPS sem cursor

export class ScreenShareController {
  private model: ScreenShareModel;
  private socket: WebSocket | null = null;
  private isCursorOverPreview = false;

  constructor(model: ScreenShareModel) {
    this.model = model;
  }

  async initializeWebSocket(): Promise<void> {
    const state = this.model.getState();
    if (!state.serverIP) {
      console.error('IP do servidor não encontrado');
      return;
    }

    try {
      this.socket = new WebSocket(`ws://${state.serverIP}:3000/transmitter`);
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

  async startTransmission(): Promise<void> {
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

      const sendFrames = async () => {
        if (!stream.active || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
          this.stopTransmission();
          return;
        }

        try {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;

          ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

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
            0.9
          );

          const frameInterval = this.isCursorOverPreview 
            ? frameRateWithCursor 
            : frameRateWithoutCursor;

          setTimeout(sendFrames, frameInterval);
        } catch (err) {
          console.error('Erro durante o envio de quadros:', err);
        }
      };

      sendFrames();

    } catch (error) {
      console.error('Erro ao iniciar transmissão:', error);
      this.model.setConnectionStatus('error');
    }
  }

  stopTransmission(): void {
    const state = this.model.getState();
    if (state.currentStream) {
      state.currentStream.getTracks().forEach(track => track.stop());
      this.model.setCurrentStream(null);
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.model.setTransmitting(false);
    this.model.setConnectionStatus('disconnected');
  }
}
