declare module 'paddleocr-browser' {
  interface PaddleOCRResult {
    text: string;
  }

  interface PaddleOCR {
    recognize(image: string): Promise<PaddleOCRResult>;
  }

  const PaddleOCR: PaddleOCR;
  export default PaddleOCR;
}
