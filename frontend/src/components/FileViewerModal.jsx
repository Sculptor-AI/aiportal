import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  width: 90vw;
  height: 80vh;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const ConfirmCard = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 20px;
  width: 90vw;
  max-width: 360px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ConfirmTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  color: ${props => props.theme.text};
`;

const ConfirmText = styled.p`
  margin: 0 0 16px 0;
  font-size: 13px;
  color: ${props => props.theme.text};
  opacity: 0.8;
`;

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ConfirmButton = styled.button`
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  color: ${props => props.theme.text};
  background: ${props => props.$variant === 'danger' ? '#ef4444' : props.theme.inputBackground};
  color: ${props => props.$variant === 'danger' ? 'white' : props.theme.text};
`;

const ViewerBody = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background: ${props => props.theme.background};
  padding: 16px;
  box-sizing: border-box;
`;

const PdfLayout = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  gap: 16px;
`;

const PdfSidebar = styled.aside`
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid ${props => props.theme.border};
  padding: 8px 0;
  overflow-y: auto;
  background: ${props => props.theme.inputBackground};
  border-radius: 8px;
`;

const PdfPageButton = styled.button`
  width: 100%;
  background: ${props => props.$active ? props.theme.border : 'transparent'};
  border: none;
  color: ${props => props.theme.text};
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.theme.border};
  }
`;

const PdfThumbnail = styled.img`
  width: 36px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  flex-shrink: 0;
`;

const PdfViewer = styled.div`
  flex: 1;
  overflow: auto;
  background: #f3f4f6;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const TextViewer = styled.pre`
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
`;

const TextEditor = styled.textarea`
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  white-space: pre;
  overflow: auto;
`;

const ImageViewer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  max-height: 100%;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`;

const ImageStage = styled.div`
  position: relative;
  display: inline-block;
  width: ${props => (props.$fitMode === 'width' ? '100%' : 'auto')};
  height: ${props => (props.$fitMode === 'width' ? 'auto' : '100%')};
  max-width: 100%;
  max-height: ${props => (props.$fitMode === 'width' ? 'none' : '100%')};
`;

const ImagePreview = styled.img`
  width: ${props => (props.$fitMode === 'width' ? '100%' : 'auto')};
  height: ${props => (props.$fitMode === 'width' ? 'auto' : '100%')};
  max-height: ${props => (props.$fitMode === 'width' ? 'none' : '100%')};
  max-width: 100%;
  object-fit: contain;
  display: block;
`;

const ImageCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
`;

const ImageToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToolButton = styled.button`
  background: ${props => props.$active ? props.theme.border : 'transparent'};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.border};
  }
`;

const ColorSwatch = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${props => props.$active ? props.theme.text : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  padding: 0;
`;

const SizeInput = styled.input`
  width: 90px;
`;

const FallbackText = styled.div`
  color: ${props => props.theme.text};
  opacity: 0.7;
  padding: 24px;
  text-align: center;
`;

const FileViewerModal = ({ isOpen, onClose, file, onSave }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [tool, setTool] = useState('draw');
  const [strokeColor, setStrokeColor] = useState('#111111');
  const [strokeSize, setStrokeSize] = useState(4);
  const [history, setHistory] = useState([]);
  const [pdfError, setPdfError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [activePdfPage, setActivePdfPage] = useState(1);
  const [pdfThumbnails, setPdfThumbnails] = useState([]);
  const [textDraft, setTextDraft] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [imageFitMode, setImageFitMode] = useState('height');
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const pdfPageRefs = useRef([]);
  const pdfPageCanvasRefs = useRef({});
  const pdfAnnotationRefs = useRef({});
  const pdfHistoryRef = useRef({});
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const fileExtension = useMemo(() => {
    if (!file?.name) return '';
    const parts = file.name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }, [file?.name]);

  const isImage = file?.type?.startsWith('image/') || file?.type === 'image' ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileExtension);
  const isPdf = file?.type === 'application/pdf' || file?.type === 'pdf' || fileExtension === 'pdf';
  const isText = file?.type === 'text' || file?.type === 'code' ||
    file?.type === 'text/plain' || file?.isPastedText ||
    ['txt', 'md', 'markdown', 'rst', 'log', 'rtf', 'json', 'yaml', 'yml', 'toml', 'xml', 'html', 'css', 'scss', 'sass', 'less', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'sh', 'bash', 'zsh', 'fish', 'sql', 'r', 'lua', 'pl', 'ex', 'hs', 'dart'].includes(fileExtension);

  const imageSrc = file?.dataUrl || file?.content || objectUrl;
  const pdfSrc = file?.pdfUrl || objectUrl;

  useEffect(() => {
    if (!isOpen) {
      setObjectUrl(null);
      return;
    }

    const needsObjectUrl = (isPdf && !file?.pdfUrl) ||
      (isImage && !file?.dataUrl && !file?.content);

    if (file?.originalFile && needsObjectUrl) {
      const url = URL.createObjectURL(file.originalFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setObjectUrl(null);
  }, [file, isImage, isPdf, isOpen]);

  useEffect(() => {
    if (!isOpen || !isText) return;
    setTextDraft(file?.text || file?.content || '');
  }, [file, isOpen, isText]);

  useEffect(() => {
    if (!isOpen) return;
    setHasUnsavedChanges(false);
  }, [isOpen, file]);

  useEffect(() => {
    if (!isOpen || !file || !isPdf) return;
    const container = pdfContainerRef.current;
    if (!container) return;

    let cancelled = false;
    let loadingTask = null;

    const renderPdf = async () => {
      setPdfLoading(true);
      setPdfError(null);
      container.innerHTML = '';

      try {
        let data;
        if (file?.originalFile) {
          data = await file.originalFile.arrayBuffer();
        } else if (pdfSrc || file?.content) {
          const sourceUrl = pdfSrc || file.content;
          const response = await fetch(sourceUrl);
          data = await response.arrayBuffer();
        } else {
          throw new Error('Missing PDF source');
        }

        loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        setPdfPageCount(pdf.numPages);
        const pixelRatio = window.devicePixelRatio || 1;

        pdfPageRefs.current = [];
        pdfAnnotationRefs.current = {};
        pdfHistoryRef.current = {};
        setPdfThumbnails([]);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.1 });
          const pageWrapper = document.createElement('div');
          pageWrapper.style.position = 'relative';
          pageWrapper.style.display = 'inline-block';
          pageWrapper.style.marginBottom = '16px';
          pageWrapper.dataset.page = String(pageNum);

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const pixelWidth = viewport.width * pixelRatio;
          const pixelHeight = viewport.height * pixelRatio;
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          pageWrapper.appendChild(canvas);

          const annotationCanvas = document.createElement('canvas');
          annotationCanvas.width = pixelWidth;
          annotationCanvas.height = pixelHeight;
          annotationCanvas.style.width = `${viewport.width}px`;
          annotationCanvas.style.height = `${viewport.height}px`;
          annotationCanvas.style.position = 'absolute';
          annotationCanvas.style.top = '0';
          annotationCanvas.style.left = '0';
          annotationCanvas.style.cursor = 'crosshair';
          annotationCanvas.style.touchAction = 'none';
          annotationCanvas.dataset.page = String(pageNum);
          pageWrapper.appendChild(annotationCanvas);

          container.appendChild(pageWrapper);
          pdfPageRefs.current[pageNum - 1] = pageWrapper;
          pdfPageCanvasRefs.current[pageNum] = canvas;
          pdfAnnotationRefs.current[pageNum] = annotationCanvas;
          pdfHistoryRef.current[pageNum] = [];

          const existingAnnotation = Array.isArray(file?.pdfAnnotatedPages)
            ? file.pdfAnnotatedPages[pageNum - 1]
            : null;
          if (existingAnnotation) {
            const annotationImage = new Image();
            annotationImage.onload = () => {
              const annotationCtx = annotationCanvas.getContext('2d');
              annotationCtx.drawImage(annotationImage, 0, 0, annotationCanvas.width, annotationCanvas.height);
            };
            annotationImage.src = existingAnnotation;
          }

          annotationCanvas.addEventListener('pointerdown', handlePdfPointerDown);
          annotationCanvas.addEventListener('pointermove', handlePdfPointerMove);
          annotationCanvas.addEventListener('pointerup', handlePdfPointerUp);
          annotationCanvas.addEventListener('pointerleave', handlePdfPointerUp);

          await page.render({ canvasContext: context, viewport }).promise;

          const thumbnailCanvas = document.createElement('canvas');
          const thumbScale = 0.2;
          thumbnailCanvas.width = Math.max(1, Math.round(viewport.width * thumbScale));
          thumbnailCanvas.height = Math.max(1, Math.round(viewport.height * thumbScale));
          const thumbCtx = thumbnailCanvas.getContext('2d');
          thumbCtx.drawImage(
            canvas,
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            thumbnailCanvas.width,
            thumbnailCanvas.height
          );
          const thumbUrl = thumbnailCanvas.toDataURL('image/png');
          setPdfThumbnails(prev => {
            const next = [...prev];
            next[pageNum - 1] = thumbUrl;
            return next;
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('PDF preview failed:', error);
          setPdfError('PDF preview failed. Download to view.');
        }
      } finally {
        if (!cancelled) {
          setPdfLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy();
      }
      const annotations = Object.values(pdfAnnotationRefs.current);
      annotations.forEach((canvas) => {
        canvas.removeEventListener('pointerdown', handlePdfPointerDown);
        canvas.removeEventListener('pointermove', handlePdfPointerMove);
        canvas.removeEventListener('pointerup', handlePdfPointerUp);
        canvas.removeEventListener('pointerleave', handlePdfPointerUp);
      });
    };
  }, [file, isOpen, isPdf, pdfSrc, strokeColor, strokeSize, tool]);

  const syncCanvasToImage = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const rect = image.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.round(nextWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(nextHeight * dpr));

    if (canvas.width === pixelWidth && canvas.height === pixelHeight) {
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      return;
    }

    const snapshot = canvas.width && canvas.height ? canvas.toDataURL() : null;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${nextWidth}px`;
    canvas.style.height = `${nextHeight}px`;

    if (snapshot) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = snapshot;
    }
  }, []);

  const updateImageFitMode = useCallback(() => {
    const image = imageRef.current;
    const container = imageContainerRef.current;
    if (!image || !container) return;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
    if (!containerWidth || !containerHeight || !image.naturalWidth || !image.naturalHeight) return;
    const widthAtHeight = (image.naturalWidth / image.naturalHeight) * containerHeight;
    setImageFitMode(widthAtHeight > containerWidth ? 'width' : 'height');
  }, []);

  useEffect(() => {
    if (!isOpen || !isImage) return;
    const handleResize = () => syncCanvasToImage();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, isImage, syncCanvasToImage]);

  useEffect(() => {
    if (!isOpen || !isImage) return;
    const container = imageContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        updateImageFitMode();
        syncCanvasToImage();
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isOpen, isImage, updateImageFitMode, syncCanvasToImage]);

  useEffect(() => {
    if (!isOpen || !isImage || !imageRef.current) return;
    const image = imageRef.current;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => syncCanvasToImage());
    });
    observer.observe(image);
    return () => observer.disconnect();
  }, [isOpen, isImage, syncCanvasToImage]);

  useEffect(() => {
    if (!isOpen || !isImage) return;
    setHistory([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [isOpen, isImage, imageSrc]);

  const startStroke = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');

    setHistory(prev => {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return [...prev, snapshot];
    });

    setHasUnsavedChanges(true);
    isDrawingRef.current = true;
    lastPointRef.current = { x, y };
    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = strokeSize * Math.min(scaleX, scaleY);
    ctx.strokeStyle = strokeColor;
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
  }, [strokeColor, strokeSize, tool]);

  const drawStroke = useCallback((event) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  }, []);

  const endStroke = useCallback((event) => {
    isDrawingRef.current = false;
    if (event?.currentTarget?.releasePointerCapture) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (err) {
        // Ignore capture errors from browsers that already released.
      }
    }
  }, []);

  const getCanvasCoordinates = (event, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    return { x, y, scaleX, scaleY };
  };

  const handlePdfPointerDown = useCallback((event) => {
    const canvas = event.currentTarget;
    if (!canvas) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();

    const pageNumber = Number(canvas.dataset.page || 1);
    setActivePdfPage(pageNumber);

    const ctx = canvas.getContext('2d');
    const { x, y, scaleX, scaleY } = getCanvasCoordinates(event, canvas);
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pdfHistoryRef.current[pageNumber] = [
      ...(pdfHistoryRef.current[pageNumber] || []),
      snapshot
    ];

    setHasUnsavedChanges(true);
    isDrawingRef.current = true;
    lastPointRef.current = { x, y };
    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = strokeSize * Math.min(scaleX, scaleY);
    ctx.strokeStyle = strokeColor;
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
  }, [strokeColor, strokeSize, tool]);

  const handlePdfPointerMove = useCallback((event) => {
    if (!isDrawingRef.current) return;
    const canvas = event.currentTarget;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(event, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  }, []);

  const handlePdfPointerUp = useCallback((event) => {
    isDrawingRef.current = false;
    if (event?.currentTarget?.releasePointerCapture) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (err) {
        // Ignore capture errors from browsers that already released.
      }
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (isPdf) {
      const canvas = pdfAnnotationRefs.current[activePdfPage];
      if (!canvas) return;
      const historyStack = pdfHistoryRef.current[activePdfPage] || [];
      if (historyStack.length === 0) return;
      const last = historyStack[historyStack.length - 1];
      const ctx = canvas.getContext('2d');
      ctx.putImageData(last, 0, 0);
      pdfHistoryRef.current[activePdfPage] = historyStack.slice(0, -1);
      setHasUnsavedChanges(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      const last = prev[prev.length - 1];
      const ctx = canvas.getContext('2d');
      ctx.putImageData(last, 0, 0);
      return next;
    });
    setHasUnsavedChanges(true);
  }, [activePdfPage, isPdf]);

  const handleClear = useCallback(() => {
    if (isPdf) {
      const canvas = pdfAnnotationRefs.current[activePdfPage];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      pdfHistoryRef.current[activePdfPage] = [
        ...(pdfHistoryRef.current[activePdfPage] || []),
        snapshot
      ];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasUnsavedChanges(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, snapshot]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasUnsavedChanges(true);
  }, [activePdfPage, isPdf]);

  const handleSaveAnnotations = useCallback(() => {
    if (isImage) {
      const image = imageRef.current;
      const annotations = canvasRef.current;
      if (!image || !annotations) return;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = annotations.width;
      exportCanvas.height = annotations.height;
      const ctx = exportCanvas.getContext('2d');

      ctx.drawImage(image, 0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(annotations, 0, 0);

      const mergedDataUrl = exportCanvas.toDataURL('image/png');
      onSave?.({
        ...file,
        dataUrl: mergedDataUrl,
        content: mergedDataUrl,
        annotatedDataUrl: mergedDataUrl,
        hasAnnotations: true
      });
      setHasUnsavedChanges(false);
      onClose?.();
      return;
    }

    if (isPdf) {
      const baseCanvas = pdfPageCanvasRefs.current[activePdfPage];
      const annotations = pdfAnnotationRefs.current[activePdfPage];
      if (!baseCanvas || !annotations) return;

      const annotationDataUrl = annotations.toDataURL('image/png');
      const annotatedPages = Array.isArray(file?.pdfAnnotatedPages)
        ? [...file.pdfAnnotatedPages]
        : [];
      annotatedPages[activePdfPage - 1] = annotationDataUrl;

      const nextFile = {
        ...file,
        pdfAnnotatedPages: annotatedPages,
        hasAnnotations: true
      };

      if (activePdfPage === 1) {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = baseCanvas.width;
        exportCanvas.height = baseCanvas.height;
        const ctx = exportCanvas.getContext('2d');
        ctx.drawImage(baseCanvas, 0, 0);
        ctx.drawImage(annotations, 0, 0);
        nextFile.pdfThumbnail = exportCanvas.toDataURL('image/png');
      }

      onSave?.(nextFile);
      setHasUnsavedChanges(false);
      onClose?.();
      return;
    }

    if (isText) {
      onSave?.({
        ...file,
        text: textDraft,
        content: textDraft,
        hasEdits: true
      });
      setHasUnsavedChanges(false);
      onClose?.();
    }
  }, [activePdfPage, file, isImage, isPdf, isText, onSave, onClose, textDraft]);

  const requestClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
      return;
    }
    onClose?.();
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    onClose?.();
  }, [onClose]);

  const handlePdfScroll = useCallback((event) => {
    const container = event.currentTarget;
    const pages = pdfPageRefs.current;
    if (!pages.length) return;
    const containerTop = container.getBoundingClientRect().top;
    let closestPage = 1;
    let closestDistance = Infinity;
    pages.forEach((page, index) => {
      if (!page) return;
      const rect = page.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerTop);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = index + 1;
      }
    });
    setActivePdfPage(closestPage);
  }, []);

  const scrollToPdfPage = useCallback((pageNumber) => {
    const target = pdfPageRefs.current[pageNumber - 1];
    if (target && pdfContainerRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActivePdfPage(pageNumber);
    }
  }, []);

  if (!isOpen || !file) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      requestClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>{file.name || 'File Preview'}</ModalTitle>
          <HeaderActions>
            {(isImage || isPdf || isText) && (
              <ToolButton onClick={handleSaveAnnotations}>Save</ToolButton>
            )}
            <CloseButton onClick={requestClose}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </CloseButton>
          </HeaderActions>
        </ModalHeader>
        {(isImage || isPdf) && (
          <ImageToolbar>
            <ToolGroup>
              <ToolButton $active={tool === 'draw'} onClick={() => setTool('draw')}>Draw</ToolButton>
              <ToolButton $active={tool === 'erase'} onClick={() => setTool('erase')}>Erase</ToolButton>
            </ToolGroup>
            <ToolGroup>
              {['#111111', '#EF4444', '#2563EB', '#10B981', '#F59E0B'].map(color => (
                <ColorSwatch
                  key={color}
                  $color={color}
                  $active={strokeColor === color}
                  onClick={() => setStrokeColor(color)}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </ToolGroup>
            <ToolGroup>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>Size</span>
              <SizeInput
                type="range"
                min="1"
                max="16"
                value={strokeSize}
                onChange={(event) => setStrokeSize(Number(event.target.value))}
              />
            </ToolGroup>
            <ToolGroup>
              <ToolButton onClick={handleUndo}>Undo</ToolButton>
              <ToolButton onClick={handleClear}>Clear</ToolButton>
            </ToolGroup>
          </ImageToolbar>
        )}
        <ViewerBody>
          {isImage && imageSrc && (
            <ImageViewer ref={imageContainerRef}>
              <ImageStage $fitMode={imageFitMode}>
                <ImagePreview
                  ref={imageRef}
                  src={imageSrc}
                  alt={file.name || 'Image preview'}
                  $fitMode={imageFitMode}
                  onLoad={() => {
                    requestAnimationFrame(() => {
                      updateImageFitMode();
                      syncCanvasToImage();
                    });
                  }}
                />
                <ImageCanvas
                  ref={canvasRef}
                  onPointerDown={startStroke}
                  onPointerMove={drawStroke}
                  onPointerUp={endStroke}
                  onPointerLeave={endStroke}
                />
              </ImageStage>
            </ImageViewer>
          )}
          {isImage && !imageSrc && (
            <FallbackText>Preview unavailable for this file.</FallbackText>
          )}
          {isPdf && (
            <>
              {pdfLoading && <FallbackText>Loading PDF...</FallbackText>}
              {pdfError && <FallbackText>{pdfError}</FallbackText>}
              {pdfSrc && !pdfError && (
                <PdfLayout>
                  <PdfSidebar>
                    {Array.from({ length: pdfPageCount }, (_, index) => (
                      <PdfPageButton
                        key={`page-${index + 1}`}
                        $active={activePdfPage === index + 1}
                        onClick={() => scrollToPdfPage(index + 1)}
                      >
                        {pdfThumbnails[index] && (
                          <PdfThumbnail
                            src={pdfThumbnails[index]}
                            alt={`Page ${index + 1} thumbnail`}
                          />
                        )}
                        Page {index + 1}
                      </PdfPageButton>
                    ))}
                  </PdfSidebar>
                  <PdfViewer ref={pdfContainerRef} onScroll={handlePdfScroll} />
                </PdfLayout>
              )}
              {!pdfSrc && !pdfError && <FallbackText>Preview unavailable for this file.</FallbackText>}
            </>
          )}
          {isText && (
            <TextEditor
              value={textDraft}
              onChange={(event) => {
                setTextDraft(event.target.value);
                setHasUnsavedChanges(true);
              }}
              spellCheck={false}
            />
          )}
          {!isImage && !isPdf && !isText && (
            <FallbackText>Preview is only available for images, PDFs, and text/code files.</FallbackText>
          )}
          {isImage && !imageSrc ? (
            <FallbackText>Preview unavailable for this file.</FallbackText>
          ) : null}
        </ViewerBody>
      </ModalContainer>
      {showConfirmClose && (
        <ConfirmOverlay onClick={() => setShowConfirmClose(false)}>
          <ConfirmCard onClick={(event) => event.stopPropagation()}>
            <ConfirmTitle>Discard changes?</ConfirmTitle>
            <ConfirmText>You have unsaved changes. Closing will discard them.</ConfirmText>
            <ConfirmActions>
              <ConfirmButton onClick={() => setShowConfirmClose(false)}>Cancel</ConfirmButton>
              <ConfirmButton $variant="danger" onClick={handleConfirmClose}>Discard</ConfirmButton>
            </ConfirmActions>
          </ConfirmCard>
        </ConfirmOverlay>
      )}
    </ModalOverlay>
  );
};

export default FileViewerModal;
