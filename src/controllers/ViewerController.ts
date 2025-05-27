
import { ViewerModel } from '../models/ViewerModel';

export class ViewerController {
  private model: ViewerModel;
  private socket: WebSocket | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(model: ViewerModel) {
    this.model = model;
  }

  async initializeViewer(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    try {
      this.socket = new WebSocket(`ws://${window.location.hostname}:3000/viewer`);
      this.model.setConnectionStatus('connecting');

      this.socket.onopen = () => {
        console.log('Conexão com o servidor estabelecida.');
        this.model.setConnectionStatus('connected');
      };

      this.socket.onmessage = async (event) => {
        if (this.canvas && this.ctx) {
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const imageBitmap = await createImageBitmap(blob);

          this.canvas.width = imageBitmap.width;
          this.canvas.height = imageBitmap.height;
          this.model.setCanvasSize(imageBitmap.width, imageBitmap.height);

          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(imageBitmap, 0, 0);
        }
      };

      this.socket.onerror = (err) => {
        console.error('Erro no WebSocket:', err);
        this.model.setConnectionStatus('error');
      };

      this.socket.onclose = () => {
        console.log('Conexão com o servidor encerrada.');
        this.model.setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Erro ao inicializar viewer:', error);
      this.model.setConnectionStatus('error');
    }
  }

  toggleFullscreen(): void {
    if (!this.canvas) return;

    if (!document.fullscreenElement) {
      if (this.canvas.requestFullscreen) {
        this.canvas.requestFullscreen();
        this.model.setFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        this.model.setFullscreen(false);
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.model.setConnectionStatus('disconnected');
  }
}
