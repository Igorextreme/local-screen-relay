
export interface ViewerState {
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  isFullscreen: boolean;
  canvasSize: { width: number; height: number };
}

export class ViewerModel {
  private state: ViewerState = {
    isConnected: false,
    connectionStatus: 'disconnected',
    isFullscreen: false,
    canvasSize: { width: 0, height: 0 }
  };

  private listeners: Array<(state: ViewerState) => void> = [];

  getState(): ViewerState {
    return { ...this.state };
  }

  subscribe(listener: (state: ViewerState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  setConnectionStatus(status: ViewerState['connectionStatus']) {
    this.state.connectionStatus = status;
    this.state.isConnected = status === 'connected';
    this.notify();
  }

  setFullscreen(isFullscreen: boolean) {
    this.state.isFullscreen = isFullscreen;
    this.notify();
  }

  setCanvasSize(width: number, height: number) {
    this.state.canvasSize = { width, height };
    this.notify();
  }
}
