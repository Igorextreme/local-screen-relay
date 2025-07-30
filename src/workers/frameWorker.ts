// Web Worker para processamento de frames em background
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let isActive = false;
let frameRate = 16;
let videoStream: MediaStream | null = null;

self.onmessage = async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'INIT':
      await initializeWorker(data);
      break;
    case 'START':
      isActive = true;
      startFrameCapture();
      break;
    case 'STOP':
      isActive = false;
      break;
    case 'SET_FRAME_RATE':
      frameRate = data.frameRate;
      break;
    case 'VISIBILITY_CHANGE':
      // Continua processando mesmo quando a aba está inativa
      break;
  }
};

async function initializeWorker(data: { width: number, height: number }) {
  try {
    canvas = new OffscreenCanvas(data.width, data.height);
    ctx = canvas.getContext('2d');
    
    self.postMessage({ type: 'WORKER_READY' });
  } catch (error) {
    console.error('Erro ao inicializar worker:', error);
    self.postMessage({ type: 'WORKER_ERROR', error });
  }
}

function startFrameCapture() {
  if (!isActive || !canvas || !ctx) return;

  const captureFrame = () => {
    if (!isActive || !canvas || !ctx) return;

    try {
      // Simplesmente agenda o próximo frame - o processamento principal continua no thread principal
      // mas com melhor controle de timing
      self.postMessage({
        type: 'REQUEST_FRAME'
      });

      // Agenda próximo frame
      if (isActive) {
        setTimeout(captureFrame, frameRate);
      }
    } catch (error) {
      console.error('Erro na captura de frame:', error);
    }
  };

  captureFrame();
}