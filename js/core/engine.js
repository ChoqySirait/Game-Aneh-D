// =================================================================
// 🚀 ENGINE ORCHESTRATOR & INPUT DISPATCHER
// =================================================================

class Engine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    this.lastTime = performance.now();
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false, rightDown: false };

    this.initCanvasResize();
    this.initInputListeners();
  }

  initCanvasResize() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
      if (this.onResize) this.onResize(this.canvas.width, this.canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();
  }

  initInputListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  start(updateCallback, renderCallback) {
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      updateCallback(dt);
      renderCallback(this.ctx);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}