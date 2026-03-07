/* eslint-env browser */
(function initDrawing() {
  const canvas = document.getElementById('drawingCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let isEraser = false;
  let brushSize = 3;
  let brushColor = '#000000';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() {
    isDrawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  var brushBtn = document.getElementById('brushBtn');
  var eraserBtn = document.getElementById('eraserBtn');
  var brushSizeInput = document.getElementById('brushSize');
  var brushColorInput = document.getElementById('brushColor');
  var clearBtn = document.getElementById('clearCanvas');

  if (brushBtn) {
    brushBtn.addEventListener('click', function () {
      isEraser = false;
      brushBtn.classList.add('active');
      eraserBtn.classList.remove('active');
    });
  }

  if (eraserBtn) {
    eraserBtn.addEventListener('click', function () {
      isEraser = true;
      eraserBtn.classList.add('active');
      brushBtn.classList.remove('active');
    });
  }

  if (brushSizeInput) {
    brushSizeInput.addEventListener('input', function () {
      brushSize = parseInt(this.value, 10);
    });
  }

  if (brushColorInput) {
    brushColorInput.addEventListener('input', function () {
      brushColor = this.value;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }

  window.getDrawingData = function () {
    return canvas.toDataURL('image/png');
  };
}());
