


import React, { useCallback, useEffect, useRef, useState } from "react";
import './Canvas.scss';
import { useParams } from 'react-router-dom';

import socket from '../../utils/socket';
import penIcon from '../../assets/icons/pen.svg';
import eraserIcon from '../../assets/icons/eraser.svg';

const Canvas = () => {
  const [context, setContext] = useState(null);
  const [canvasDiv, setCanvasDiv] = useState(null);
  const [color, setColor] = useState('#ffffff');
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(16);
  const [penWidth, setPenWidth] = useState(2);
  const [cursorPos, setCursorPos] = useState(null);
  const [roomCount, setRoomCount] = useState(1);
  const canvasParentId = 'canvas-parent';
  const canvasElementId = 'canvas-element';
  let DPR = window.devicePixelRatio || 1;
  const roomName = useParams().roomName;
  const mouseDownRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const clearCanvas = () => {
    console.log('clearCanvas called', { context, canvasDiv, roomName });
    if (context && canvasDiv) {
      context.clearRect(0, 0, canvasDiv.width, canvasDiv.height);
      console.log('Canvas cleared');
    } else {
      console.warn('Context or canvasDiv not set');
    }
    if (roomName) {
      socket.emit('clear-canvas', { roomName });
      console.log('clear-canvas event emitted');
    }
  };

  const setCanvasRef = useCallback((element) => {
    if (element !== null) {
      const canvasContext = element.getContext('2d');
      setContext(canvasContext);
      setCanvasDiv(element);
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    if (canvasDiv) {
      const vw = window.innerWidth;
      const vh = window.innerHeight - 64 - 56;
      canvasDiv.width = vw * DPR;
      canvasDiv.height = vh * DPR;
      canvasDiv.style.width = `${vw}px`;
      canvasDiv.style.height = `${vh}px`;
      canvasDiv.style.display = 'block';
      canvasDiv.style.margin = '0';
      if (context) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(DPR, DPR);
      }
    }
  }, [DPR, canvasDiv, context]);


  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [context, resizeCanvas, canvasDiv]);

  useEffect(() => {
    if (roomName) {
      socket.emit('join-room', { roomName });
      socket.emit('get-room-count', { roomName });
    }
  }, [roomName]);

  useEffect(() => {
    const handleRoomCount = ({ count }) => {
      setRoomCount(count);
    };
    socket.on('room-count', handleRoomCount);
    return () => {
      socket.off('room-count', handleRoomCount);
    };
  }, []);

  useEffect(() => {
    if (!context) return;
    const handleDrawing = ({ drawingData }) => {
  const { prevX, prevY, x, y, color: remoteColor, lineWidth } = drawingData;
  const p1 = normToCanvas(prevX, prevY);
  const p2 = normToCanvas(x, y);
  const base = Math.min(canvasDiv.width, canvasDiv.height) / DPR;
  const scale = base / 800;
  const scaledLineWidth = (lineWidth || 2) * scale;
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.strokeStyle = remoteColor || '#ffffff';
      context.lineWidth = scaledLineWidth;
      context.lineCap = 'round';
      context.stroke();
      if (remoteColor !== '#000') {
        context.beginPath();
        context.arc(p2.x, p2.y, scaledLineWidth / 2, 0, 2 * Math.PI);
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
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  const normToCanvas = (nx, ny) => {
    return {
      x: nx * canvasDiv.width / DPR,
      y: ny * canvasDiv.height / DPR
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
  const base = Math.min(canvasDiv.width, canvasDiv.height) / DPR;
  const scale = base / 800;
      const lineWidth = (isErasing ? eraserSize : penWidth) * scale;
      const p1 = normToCanvas(prevX, prevY);
      const p2 = normToCanvas(x, y);
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.strokeStyle = drawColor;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.stroke();
      if (!isErasing) {
        context.beginPath();
        context.arc(p2.x, p2.y, lineWidth / 2, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
      }
      if (roomName) {
        socket.emit('drawing', { roomName, drawingData: { prevX, prevY, x, y, color: drawColor, lineWidth: isErasing ? eraserSize : penWidth } });
      }
      lastPosRef.current = { x, y };
    }
  };


  const onTouchStart = (e) => {
    e.preventDefault();
    if (context) {
      const { x, y } = getRelativeCoords(e);
      lastPosRef.current = { x, y };
      mouseDownRef.current = true;
    }
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    mouseDownRef.current = false;
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    const { x, y } = getRelativeCoords(e);
    if (isErasing) setCursorPos({ x, y });
    else setCursorPos(null);
    if (mouseDownRef.current && context) {
      const { x: prevX, y: prevY } = lastPosRef.current;
      const drawColor = isErasing ? '#000' : color;
  const base = Math.min(canvasDiv.width, canvasDiv.height) / DPR;
  const scale = base / 800;
      const lineWidth = (isErasing ? eraserSize : penWidth) * scale;
      const p1 = normToCanvas(prevX, prevY);
      const p2 = normToCanvas(x, y);
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.strokeStyle = drawColor;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.stroke();
      if (!isErasing) {
        context.beginPath();
        context.arc(p2.x, p2.y, lineWidth / 2, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
      }
      if (roomName) {
        socket.emit('drawing', { roomName, drawingData: { prevX, prevY, x, y, color: drawColor, lineWidth: isErasing ? eraserSize : penWidth } });
      }
      lastPosRef.current = { x, y };
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  return (
    <div className="canvas-container" id={canvasParentId}>
      <div style={{position: 'absolute', top: 8, right: 16, zIndex: 20, background: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 500, boxShadow: '0 1px 4px #0001'}}>
        <span role="img" aria-label="users" style={{marginRight: 6}}>👥</span>
        {roomCount} {roomCount === 1 ? 'person' : 'people'} in room
      </div>
  <div className="canvas-toolbar-bar open">
        <button
          className={`canvas-toolbar-btn${!isErasing ? ' active' : ''}`}
          title="Pen"
          onClick={() => setIsErasing(false)}
        >
          <i class="bi bi-pencil-fill"></i>
        </button>
        <button
          className={`canvas-toolbar-btn${isErasing ? ' active' : ''}`}
          title="Eraser"
          onClick={() => setIsErasing(true)}
        >
          <i class="bi bi-eraser-fill"></i>
          </button>
        {!isErasing && (
          <label className="canvas-color-label">
            <span>Color:</span>
            <span className="color-preview" style={{
              display: 'inline-block',
              width: 20,
              height: 20,
              borderRadius: '4px',
              border: '1.5px solid #888',
              background: color,
              margin: '0 8px',
              verticalAlign: 'middle',
            }} />
            <input className="co" type="color" value={color} onChange={e => setColor(e.target.value)} />
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
          <i class="bi bi-trash3-fill"></i>
        </button>
      </div>
      <canvas
        id={canvasElementId}
        className="canvas-element"
        ref={setCanvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ cursor: 'crosshair', touchAction: 'none' }}
      />
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
