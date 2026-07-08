// Pravio Notes Sketchpad Drawing Canvas

export class CanvasBoard {
    constructor(app) {
        this.app = app;
        this.isDrawing = false;
        this.color = '#6366f1';
        this.lineWidth = 4;
        this.tool = 'brush'; // 'brush', 'eraser'
        this.canvas = null;
        this.ctx = null;
    }

    render(container, isOverlay = false, note = null) {
        this.note = note;
        this.isOverlay = isOverlay;
        container.innerHTML = `
            <div class="${isOverlay ? '' : 'canvas-panel'}">
                <!-- Tool settings bar -->
                <div class="canvas-toolbar">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-right: 10px;">
                        ${isOverlay ? 'NOTE INSIGHT SKETCH' : 'FREE DRAW PANEL'}
                    </span>
                    
                    <div class="tool-group">
                        <button class="btn btn-secondary btn-sm tool-btn active" id="btn-draw-brush" title="Pen" style="display: flex; align-items: center; gap: 6px;"><i data-lucide="brush" style="width: 14px; height: 14px;"></i><span style="font-size: 0.7rem; font-weight: 600;">Pen</span></button>
                        <button class="btn btn-secondary btn-sm tool-btn" id="btn-draw-highlighter" title="Highlighter" style="display: flex; align-items: center; gap: 6px;"><i data-lucide="highlighter" style="width: 14px; height: 14px;"></i><span style="font-size: 0.7rem; font-weight: 600;">Highlighter</span></button>
                        <button class="btn btn-secondary btn-sm tool-btn" id="btn-draw-eraser" title="Eraser" style="display: flex; align-items: center; gap: 6px;"><i data-lucide="eraser" style="width: 14px; height: 14px;"></i><span style="font-size: 0.7rem; font-weight: 600;">Eraser</span></button>
                    </div>

                    <div class="tool-group">
                        <div class="color-dot active" style="background-color: #6366f1;" data-color="#6366f1"></div>
                        <div class="color-dot" style="background-color: #10b981;" data-color="#10b981"></div>
                        <div class="color-dot" style="background-color: #ef4444;" data-color="#ef4444"></div>
                        <div class="color-dot" style="background-color: #f59e0b;" data-color="#f59e0b"></div>
                        <div class="color-dot" style="background-color: #f8fafc;" data-color="#f8fafc"></div>
                    </div>

                    <div class="tool-group">
                        <input type="range" id="brush-width" min="1" max="20" value="4" style="width: 60px;">
                        <span id="brush-width-lbl" style="font-size: 0.75rem; font-family: var(--font-mono);">4px</span>
                    </div>

                    <button class="btn btn-secondary btn-sm" id="btn-draw-clear" style="margin-left: auto;"><i data-lucide="refresh-cw" style="width: 12px; height: 12px;"></i>Clear</button>
                </div>

                <!-- Live Canvas area -->
                <div class="canvas-element-wrapper" style="height: ${isOverlay ? '100%' : '520px'}; border: ${isOverlay ? 'none' : '1px solid var(--border-color)'}; background-color: ${isOverlay ? 'transparent' : 'var(--bg-card)'};">
                    <canvas id="sketch-canvas" class="canvas-sketch" style="background: transparent;"></canvas>
                </div>
            </div>
        `;

        lucide.createIcons();
        this.setupCanvas();
        this.setupEvents(container);
    }

    setupCanvas() {
        this.canvas = document.getElementById('sketch-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        
        // Handle canvas sizing for HDPI screens
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        this.ctx.scale(dpr, dpr);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Load saved drawing if exists
        if (this.note && this.note.drawingData) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = this.note.drawingData;
        }
    }

    setupEvents(container) {
        if (!this.canvas) return;

        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };
            }
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const hexToRgba = (hex, alpha) => {
            let c = hex.substring(1);
            if (c.length === 3) {
                c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
            }
            const r = parseInt(c.substring(0, 2), 16);
            const g = parseInt(c.substring(2, 4), 16);
            const b = parseInt(c.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const startDraw = (e) => {
            this.isDrawing = true;
            const pos = getPos(e);
            this.lastX = pos.x;
            this.lastY = pos.y;
            this.strokePoints = [pos];
            
            // Save pixels before drawing
            this.canvasDataBeforeStroke = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            e.preventDefault();
        };

        const draw = (e) => {
            if (!this.isDrawing) return;
            const pos = getPos(e);
            this.strokePoints.push(pos);
            
            if (this.tool === 'eraser') {
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineWidth = this.lineWidth * 3.5;
                this.ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else if (this.tool === 'highlighter') {
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.lineWidth = this.lineWidth * 4.5;
                this.ctx.strokeStyle = hexToRgba(this.color, 0.22);
            } else {
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.lineWidth = this.lineWidth;
                this.ctx.strokeStyle = this.color;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
            
            this.lastX = pos.x;
            this.lastY = pos.y;
            e.preventDefault();
        };

        const stopDraw = () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                
                // Recognize and draw shapes automatically
                if (this.tool !== 'eraser') {
                    const shape = this.recognizeShape(this.strokePoints);
                    if (shape) {
                        // Clear the rough mouse-drawn stroke from canvas
                        this.ctx.putImageData(this.canvasDataBeforeStroke, 0, 0);
                        
                        // Draw clean geometric shape
                        this.ctx.beginPath();
                        if (shape.type === 'line') {
                            this.ctx.moveTo(shape.start.x, shape.start.y);
                            this.ctx.lineTo(shape.end.x, shape.end.y);
                        } else if (shape.type === 'circle') {
                            this.ctx.ellipse(shape.x, shape.y, shape.rx, shape.ry, 0, 0, 2 * Math.PI);
                        } else if (shape.type === 'rect') {
                            this.ctx.rect(shape.x, shape.y, shape.w, shape.h);
                        } else if (shape.type === 'triangle') {
                            this.ctx.moveTo(shape.x1, shape.y1);
                            this.ctx.lineTo(shape.x2, shape.y2);
                            this.ctx.lineTo(shape.x3, shape.y3);
                            this.ctx.closePath();
                        } else if (shape.type === 'rhombus') {
                            this.ctx.moveTo(shape.x1, shape.y1);
                            this.ctx.lineTo(shape.x2, shape.y2);
                            this.ctx.lineTo(shape.x3, shape.y3);
                            this.ctx.lineTo(shape.x4, shape.y4);
                            this.ctx.closePath();
                        }
                        this.ctx.stroke();
                    }
                }
                
                if (this.note) {
                    this.note.drawingData = this.canvas.toDataURL();
                    this.app.saveToLocalStorage();
                }
            }
        };

        // Desktop drawing events
        this.canvas.addEventListener('mousedown', startDraw);
        this.canvas.addEventListener('mousemove', draw);
        this.canvas.addEventListener('mouseup', stopDraw);
        this.canvas.addEventListener('mouseleave', stopDraw);

        // Stylus / Touch drawing events
        this.canvas.addEventListener('touchstart', startDraw);
        this.canvas.addEventListener('touchmove', draw);
        this.canvas.addEventListener('touchend', stopDraw);

        // Width adjustment
        const widthSlider = container.querySelector('#brush-width');
        const widthLbl = container.querySelector('#brush-width-lbl');
        widthSlider.addEventListener('input', (e) => {
            this.lineWidth = parseInt(e.target.value);
            widthLbl.innerText = `${this.lineWidth}px`;
        });

        // Brush vs Highlighter vs Eraser Toggle
        const brushBtn = container.querySelector('#btn-draw-brush');
        const highlighterBtn = container.querySelector('#btn-draw-highlighter');
        const eraserBtn = container.querySelector('#btn-draw-eraser');
        const toolBtns = container.querySelectorAll('.tool-btn');

        brushBtn.addEventListener('click', () => {
            toolBtns.forEach(btn => btn.classList.remove('active'));
            brushBtn.classList.add('active');
            this.tool = 'brush';
        });

        highlighterBtn.addEventListener('click', () => {
            toolBtns.forEach(btn => btn.classList.remove('active'));
            highlighterBtn.classList.add('active');
            this.tool = 'highlighter';
        });

        eraserBtn.addEventListener('click', () => {
            toolBtns.forEach(btn => btn.classList.remove('active'));
            eraserBtn.classList.add('active');
            this.tool = 'eraser';
        });

        // Clear canvas
        container.querySelector('#btn-draw-clear').addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.note) {
                delete this.note.drawingData;
                this.app.saveToLocalStorage();
            }
        });

        // Color selection dots
        const dots = container.querySelectorAll('.color-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                this.color = dot.getAttribute('data-color');
                
                // Only revert to brush if they were on the eraser
                if (this.tool === 'eraser') {
                    this.tool = 'brush';
                    brushBtn.click();
                }
            });
        });

        // Make the drawing toolbar (.canvas-toolbar) draggable
        const toolbar = container.querySelector('.canvas-toolbar');
        if (toolbar && this.isOverlay) {
            let isDraggingToolbar = false;
            let startX = 0, startY = 0;
            
            toolbar.style.cursor = 'grab';
            
            // Inject a grip icon to guide user dragging
            const dragHandle = document.createElement('div');
            dragHandle.style.display = 'flex';
            dragHandle.style.alignItems = 'center';
            dragHandle.style.marginRight = '8px';
            dragHandle.innerHTML = '<i data-lucide="grip-vertical" style="width: 14px; height: 14px; color: var(--text-muted); cursor: grab;"></i>';
            toolbar.insertBefore(dragHandle, toolbar.firstChild);
            lucide.createIcons();
            
            const onMouseDown = (e) => {
                if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.color-dot')) return;
                
                isDraggingToolbar = true;
                toolbar.style.cursor = 'grabbing';
                
                const tbRect = toolbar.getBoundingClientRect();
                startX = e.clientX - tbRect.left;
                startY = e.clientY - tbRect.top;
                
                const onMouseMove = (ev) => {
                    if (!isDraggingToolbar) return;
                    let x = ev.clientX - startX;
                    let y = ev.clientY - startY;
                    
                    // Constrain bounds inside browser window
                    x = Math.max(10, Math.min(x, window.innerWidth - tbRect.width - 10));
                    y = Math.max(10, Math.min(y, window.innerHeight - tbRect.height - 10));
                    
                    toolbar.style.left = `${x}px`;
                    toolbar.style.top = `${y}px`;
                    toolbar.style.transform = 'none';
                };
                
                const onMouseUp = () => {
                    isDraggingToolbar = false;
                    toolbar.style.cursor = 'grab';
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
            };
            
            toolbar.addEventListener('mousedown', onMouseDown);
            
            // Stylus/Touch drag support
            toolbar.addEventListener('touchstart', (e) => {
                if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.color-dot')) return;
                isDraggingToolbar = true;
                const touch = e.touches[0];
                
                const tbRect = toolbar.getBoundingClientRect();
                startX = touch.clientX - tbRect.left;
                startY = touch.clientY - tbRect.top;
                
                const onTouchMove = (ev) => {
                    if (!isDraggingToolbar) return;
                    const t = ev.touches[0];
                    let x = t.clientX - startX;
                    let y = t.clientY - startY;
                    
                    x = Math.max(10, Math.min(x, window.innerWidth - tbRect.width - 10));
                    y = Math.max(10, Math.min(y, window.innerHeight - tbRect.height - 10));
                    
                    toolbar.style.left = `${x}px`;
                    toolbar.style.top = `${y}px`;
                    toolbar.style.transform = 'none';
                    ev.preventDefault();
                };
                
                const onTouchEnd = () => {
                    isDraggingToolbar = false;
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                };
                
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
            });
        }
    }

    recognizeShape(points) {
        if (points.length < 15) return null; // Ignore short strokes immediately (prevents dots, decimals, short letters)
        
        const A = points[0];
        const B = points[points.length - 1];
        const L = Math.hypot(B.x - A.x, B.y - A.y);
        
        // Calculate the actual path distance of the drawn stroke
        let actualPathLength = 0;
        for (let i = 1; i < points.length; i++) {
            actualPathLength += Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
        }
        
        // 1. Check for Straight Line
        // Require it to be reasonably long (prevent short letters/lines from snapping)
        // Require actual path length to match straight distance closely (prevent curvy letters like 2, S, 7 from snapping)
        if (L > 65 && actualPathLength < L * 1.12) {
            let maxDist = 0;
            for (let i = 0; i < points.length; i++) {
                const P = points[i];
                const dist = Math.abs((B.y - A.y)*P.x - (B.x - A.x)*P.y + B.x*A.y - B.y*A.x) / L;
                if (dist > maxDist) maxDist = dist;
            }
            if (maxDist < Math.max(12, L * 0.1)) {
                return { type: 'line', start: A, end: B };
            }
        }
        
        // 2. Check Bounding Box
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const w = maxX - minX;
        const h = maxY - minY;
        const centerX = minX + w / 2;
        const centerY = minY + h / 2;
        
        // Require shape bounding box to be large enough to distinguish it from normal letters (like o, 0, D, B, etc.)
        if (w < 85 || h < 85) return null;
        
        // Check if closed loop
        const startEndDist = Math.hypot(B.x - A.x, B.y - A.y);
        const perimeter = 2 * (w + h);
        
        if (startEndDist < Math.max(45, perimeter * 0.12)) {
            // Helper function to calculate distance from a point to a line segment
            const distToSegment = (P, C, D) => {
                const dx = D.x - C.x;
                const dy = D.y - C.y;
                const l2 = dx*dx + dy*dy;
                if (l2 === 0) return Math.hypot(P.x - C.x, P.y - C.y);
                let t = ((P.x - C.x) * dx + (P.y - C.y) * dy) / l2;
                t = Math.max(0, Math.min(1, t));
                return Math.hypot(P.x - (C.x + t * dx), P.y - (C.y + t * dy));
            };

            // 1. Check Triangle fit
            let sumTriangleDist = 0;
            const t1 = { x: centerX, y: minY }, t2 = { x: minX, y: maxY }, t3 = { x: maxX, y: maxY };
            for (let i = 0; i < points.length; i++) {
                const P = points[i];
                const d1 = distToSegment(P, t1, t2);
                const d2 = distToSegment(P, t2, t3);
                const d3 = distToSegment(P, t3, t1);
                sumTriangleDist += Math.min(d1, d2, d3);
            }
            const avgTriangleDist = sumTriangleDist / points.length;

            // 2. Check Rhombus fit
            let sumRhombusDist = 0;
            const r1 = { x: centerX, y: minY }, r2 = { x: maxX, y: centerY }, r3 = { x: centerX, y: maxY }, r4 = { x: minX, y: centerY };
            for (let i = 0; i < points.length; i++) {
                const P = points[i];
                const d1 = distToSegment(P, r1, r2);
                const d2 = distToSegment(P, r2, r3);
                const d3 = distToSegment(P, r3, r4);
                const d4 = distToSegment(P, r4, r1);
                sumRhombusDist += Math.min(d1, d2, d3, d4);
            }
            const avgRhombusDist = sumRhombusDist / points.length;

            // Check ellipse fit (Circle)
            let sumDev = 0;
            for (let i = 0; i < points.length; i++) {
                const P = points[i];
                const rx = w / 2;
                const ry = h / 2;
                if (rx > 0 && ry > 0) {
                    const val = Math.pow((P.x - centerX) / rx, 2) + Math.pow((P.y - centerY) / ry, 2);
                    sumDev += Math.abs(val - 1);
                }
            }
            const avgDev = sumDev / points.length;
            
            // Stricter deviation threshold for circles/ellipses
            if (avgDev < 0.22) {
                return { type: 'circle', x: centerX, y: centerY, rx: w / 2, ry: h / 2 };
            } 
            // Snap to Triangle
            else if (avgTriangleDist < Math.max(14, w * 0.14)) {
                return { type: 'triangle', x1: centerX, y1: minY, x2: minX, y2: maxY, x3: maxX, y3: maxY };
            }
            // Snap to Rhombus
            else if (avgRhombusDist < Math.max(14, w * 0.14)) {
                return { type: 'rhombus', x1: centerX, y1: minY, x2: maxX, y2: centerY, x3: centerX, y3: maxY, x4: minX, y4: centerY };
            }
            // Snap to rectangle only for large box outlines
            else if (avgDev < 0.42 && w > 100 && h > 100) {
                return { type: 'rect', x: minX, y: minY, w: w, h: h };
            }
        }
        
        return null;
    }
}
