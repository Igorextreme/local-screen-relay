// Web Worker otimizado para processamento de frames
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = async function(e) {
  const { type, imageData, width, height, quality = 0.5, maxWidth = 960 } = e.data;
  
  if (type === 'PROCESS_FRAME') {
    try {
      // Reutilizar canvas para melhor performance
      if (!canvas || canvas.width !== width || canvas.height !== height) {
        canvas = new OffscreenCanvas(width, height);
        ctx = canvas.getContext('2d', { 
          alpha: false, 
          desynchronized: true,
          willReadFrequently: false
        });
      }
      
      if (!ctx) {
        throw new Error('Não foi possível obter contexto do canvas');
      }
      
      // Calcular downscaling agressivo para melhor FPS
      let targetWidth = width;
      let targetHeight = height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        targetWidth = Math.round(maxWidth);
        targetHeight = Math.round(height * ratio);
        
        // Redimensionar canvas
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      
      // Desenhar imageData redimensionado
      const imageDataObj = new ImageData(imageData, width, height);
      const tempCanvas = new OffscreenCanvas(width, height);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx!.putImageData(imageDataObj, 0, 0);
      
      // Desenhar com configurações otimizadas
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
      
      // Converter para blob com qualidade muito baixa para FPS alto
      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality
      });
      
      const arrayBuffer = await blob.arrayBuffer();
      
      // Enviar resultado
      self.postMessage({
        success: true,
        data: arrayBuffer,
        originalSize: width * height * 4,
        compressedSize: arrayBuffer.byteLength,
        dimensions: { width: targetWidth, height: targetHeight }
      }, { transfer: [arrayBuffer] });
      
    } catch (error) {
      self.postMessage({
        success: false,
        error: error.message
      });
    }
  }
};