
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
      const response = await fetch('http://localhost:3000/local-ip');
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }
      const data = await response.json();
      this.state.serverIP = data.ip;
      console.log(`IP do servidor obtido: ${data.ip}`);
    } catch (error) {
      console.error('Erro ao obter o IP do servidor:', error);
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
