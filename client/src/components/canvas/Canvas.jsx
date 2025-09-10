

import React, { useCallback, useEffect, useRef, useState } from "react";
  // Clear canvas function
  const clearCanvas = () => {
    if (context && canvasDiv) {
      context.clearRect(0, 0, canvasDiv.width, canvasDiv.height);
    }
    // Optionally, emit clear event to room for collaborative clearing
    if (roomName) {
      socket.emit('clear-canvas', { roomName });
    }
  };
import './Canvas.scss';
import { useParams } from 'react-router-dom';
import socket from '../../utils/socket';
import eraserIcon from '../../assets/icons/eraser.svg';
import penIcon from '../../assets/icons/pen.svg';


const Canvas = () => {
  const [context, setContext] = useState(null);
  const [canvasDiv, setCanvasDiv] = useState(null);
  const [color, setColor] = useState('#ffffff');
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(16);
  const [penWidth, setPenWidth] = useState(2);
  const [cursorPos, setCursorPos] = useState(null);
  const canvasParentId = 'canvas-parent';
  const canvasElementId = 'canvas-element';
  let DPR = window.devicePixelRatio || 1;
  const roomName = useParams().roomName;
  const mouseDownRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Set canvas context and canvas element ref
  const setCanvasRef = useCallback((element) => {
    if (element !== null) {
      const canvasContext = element.getContext('2d');
      setContext(canvasContext);
      setCanvasDiv(element);
    }
  }, []);

  // Function to resize canvas and scale context
  const resizeCanvas = useCallback(() => {
    if (canvasDiv) {
      // Make canvas fill viewport below navbar and toolbar
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // 64px navbar, 56px toolbar
      const height = vh - 64 - 56;
      canvasDiv.width = vw * DPR;
      canvasDiv.height = height * DPR;
      canvasDiv.style.width = `${vw}px`;
      canvasDiv.style.height = `${height}px`;
      if (context) {
        context.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        context.scale(DPR, DPR);
      }
    }
  }, [DPR, canvasDiv, context]);

  // Resize canvas on component mount and window resize
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [context, resizeCanvas, canvasDiv]);

  // Listen for drawing events from socket
  useEffect(() => {
    if (!context) return;
    const handleDrawing = ({ drawingData }) => {
      const { prevX, prevY, x, y, color: remoteColor, lineWidth } = drawingData;
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.strokeStyle = remoteColor || '#ffffff';
      context.lineWidth = lineWidth || 2;
      context.lineCap = 'round';
      context.stroke();
      // For pen, draw a filled circle at the current point to fill any gaps
  if (remoteColor !== '#000') {
        context.beginPath();
        context.arc(x, y, (lineWidth || 2) / 2, 0, 2 * Math.PI);
        context.fillStyle = remoteColor || '#ffffff';
        context.fill();
      }
    };
    const handleClear = () => {
      if (context && canvasDiv) {
        context.clearRect(0, 0, canvasDiv.width, canvasDiv.height);
      }
    };
    socket.on('drawing', handleDrawing);
    socket.on('clear-canvas', handleClear);
    return () => {
      socket.off('drawing', handleDrawing);
      socket.off('clear-canvas', handleClear);
    };
  }, [context, canvasDiv]);


  const getRelativeCoords = (e) => {
    const rect = canvasDiv.getBoundingClientRect();
    // Always use logical coordinates (not multiplied by DPR)
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const onMouseDown = (e) => {
    if (context) {
      const { x, y } = getRelativeCoords(e);
      lastPosRef.current = { x, y };
      mouseDownRef.current = true;
    }
  };

  const onMouseUp = () => {
    mouseDownRef.current = false;
  };

  const onMouseMove = (e) => {
    const { x, y } = getRelativeCoords(e);
    if (isErasing) setCursorPos({ x, y });
    else setCursorPos(null);
    if (mouseDownRef.current && context) {
      const { x: prevX, y: prevY } = lastPosRef.current;
  const drawColor = isErasing ? '#000' : color;
      const lineWidth = isErasing ? eraserSize : penWidth;
      // Draw line
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.strokeStyle = drawColor;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.stroke();
      // For pen, draw a filled circle at the current point to fill any gaps
      if (!isErasing) {
        context.beginPath();
        context.arc(x, y, penWidth / 2, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
      }
      // Emit to server
      if (roomName) {
        socket.emit('drawing', { roomName, drawingData: { prevX, prevY, x, y, color: drawColor, lineWidth } });
      }
      lastPosRef.current = { x, y };
    }
  };

  return (
    <div className="canvas-container" id={canvasParentId}>
      <div className="canvas-toolbar-bar">
        <button
          className={`canvas-toolbar-btn${!isErasing ? ' active' : ''}`}
          title="Pen"
          onClick={() => setIsErasing(false)}
        >
          <img src={penIcon} alt="Pen" className="canvas-toolbar-icon" style={{ filter: !isErasing ? 'none' : 'grayscale(1)' }} />
        </button>
        <button
          className={`canvas-toolbar-btn${isErasing ? ' active' : ''}`}
          title="Eraser"
          onClick={() => setIsErasing(true)}
        >
          <img src={eraserIcon} alt="Eraser" className="canvas-toolbar-icon" style={{ filter: isErasing ? 'none' : 'grayscale(1)' }} />
        </button>
        {!isErasing && (
          <label className="canvas-color-label">
            <span>Color:</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          </label>
        )}
        {!isErasing && (
          <label className="canvas-pen-label">
            <span>Pen Width:</span>
            <input
              type="range"
              min={1}
              max={16}
              value={penWidth}
              onChange={e => setPenWidth(Number(e.target.value))}
            />
            <span>{penWidth}px</span>
          </label>
        )}
        {isErasing && (
          <label className="canvas-eraser-label">
            <span>Eraser Size:</span>
            <input
              type="range"
              min={8}
              max={48}
              value={eraserSize}
              onChange={e => setEraserSize(Number(e.target.value))}
            />
            <span>{eraserSize}px</span>
          </label>
        )}
        <button
          className="canvas-toolbar-btn canvas-clear-btn"
          title="Clear Canvas"
          onClick={clearCanvas}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="16" height="12" rx="2" fill="#ff4d4f"/>
            <rect x="7" y="2" width="8" height="4" rx="1" fill="#ff7875"/>
            <rect x="9" y="10" width="4" height="6" rx="1" fill="#fff"/>
          </svg>
        </button>
      </div>
      <canvas
        id={canvasElementId}
        className="canvas-element"
        ref={setCanvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{ cursor: 'crosshair' }}
      />
      {/* No eraser circle, only show + at cursor when erasing */}
      {isErasing  && (
        <div
          style={{
            position: 'absolute',
            width: 24,
            height: 24,
            pointerEvents: 'none',
            zIndex: 11,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={24} height={24} style={{ position: 'absolute', left: 0, top: 0 }}>
            <line x1={12} y1={6} x2={12} y2={18} stroke="#398bfd" strokeWidth="2" />
            <line x1={6} y1={12} x2={18} y2={12} stroke="#398bfd" strokeWidth="2" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Canvas;
