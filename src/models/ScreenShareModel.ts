
export interface VideoConfig {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    frameRate: { ideal: number; max: number };
  };
}

export interface ScreenShareState {
  isTransmitting: boolean;
  serverIP: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  viewerCount: number;
  currentStream: MediaStream | null;
}

export class ScreenShareModel {
  private state: ScreenShareState = {
    isTransmitting: false,
    serverIP: '',
    connectionStatus: 'disconnected',
    viewerCount: 0,
    currentStream: null
  };

  private listeners: Array<(state: ScreenShareState) => void> = [];

  constructor() {
    this.fetchServerIP();
  }

  getState(): ScreenShareState {
    return { ...this.state };
  }

  subscribe(listener: (state: ScreenShareState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  async fetchServerIP(): Promise<void> {
    try {
      // Tenta primeiro com HTTPS se disponível, senão HTTP
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const url = `${protocol}//localhost:3000/local-ip`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }
      const data = await response.json();
      this.state.serverIP = data.ip;
      console.log(`IP do servidor obtido: ${data.ip}`);
    } catch (error) {
      console.error('Erro ao obter o IP do servidor:', error);
      console.warn('Usando localhost como fallback. Certifique-se de que o servidor está rodando em http://localhost:3000');
      this.state.serverIP = 'localhost';
    }
    this.notify();
  }

  setConnectionStatus(status: ScreenShareState['connectionStatus']) {
    this.state.connectionStatus = status;
    this.notify();
  }

  setTransmitting(isTransmitting: boolean) {
    this.state.isTransmitting = isTransmitting;
    this.notify();
  }

  setCurrentStream(stream: MediaStream | null) {
    this.state.currentStream = stream;
    this.notify();
  }

  setViewerCount(count: number) {
    this.state.viewerCount = count;
    this.notify();
  }
}
