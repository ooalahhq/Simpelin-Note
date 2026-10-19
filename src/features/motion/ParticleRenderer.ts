export type Palette = {
  core: number;
  bright: number;
  ink: number;
  shard: number;
  leaf: number;
  leafDark: number;
  frost: number;
  frostDark: number;
  rune: number;
  runeDark: number;
};
export interface Painter {
  clear: () => void;
  line: (
    x: number,
    y: number,
    x2: number,
    y2: number,
    width: number,
    color: number,
    alpha: number,
  ) => void;
  ring: (
    x: number,
    y: number,
    r: number,
    width: number,
    color: number,
    alpha: number,
  ) => void;
  dot: (
    x: number,
    y: number,
    r: number,
    color: number,
    alpha: number,
    square?: boolean,
  ) => void;
  render: () => void;
  resize: () => void;
  destroy: () => void;
  name: string;
}
export function readPalette(): Palette {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const get = (token: string) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = css.getPropertyValue(token).trim();
    ctx.fillRect(0, 0, 1, 1);
    const v = ctx.getImageData(0, 0, 1, 1).data;
    return (v[0] << 16) | (v[1] << 8) | v[2];
  };
  return {
    core: get("--fx-core"),
    bright: get("--fx-bright"),
    ink: get("--fx-ink"),
    shard: get("--fx-shard"),
    leaf: get("--fx-leaf"),
    leafDark: get("--fx-leaf-dark"),
    frost: get("--fx-frost"),
    frostDark: get("--fx-frost-dark"),
    rune: get("--fx-rune"),
    runeDark: get("--fx-rune-dark"),
  };
}
export async function createPainter(host: HTMLDivElement): Promise<Painter> {
  try {
    const { Application, Graphics } = await import("pixi.js");
    const app = new Application();
    await app.init({
      backgroundAlpha: 0,
      resizeTo: window,
      antialias: false,
      resolution: 1,
      autoDensity: true,
      autoStart: false,
      preference: "webgl",
      powerPreference: "low-power",
    });
    host.appendChild(app.canvas);
    const g = new Graphics();
    g.blendMode = "add";
    app.stage.addChild(g);
    return {
      name: "PixiJS · WebGL",
      clear: () => g.clear(),
      line: (x, y, x2, y2, width, color, alpha) => {
        g.moveTo(x, y).lineTo(x2, y2).stroke({ width, color, alpha });
      },
      ring: (x, y, r, width, color, alpha) => {
        g.circle(x, y, Math.max(0.1, r)).stroke({ width, color, alpha });
      },
      dot: (x, y, r, color, alpha, square) => {
        if (square)
          g.rect(
            Math.round(x - r),
            Math.round(y - r),
            Math.max(1, Math.round(r * 2)),
            Math.max(1, Math.round(r * 2)),
          );
        else g.circle(x, y, Math.max(0.1, r));
        g.fill({ color, alpha });
      },
      render: () => app.render(),
      resize: () => app.resize(),
      destroy: () => app.destroy(true, { children: true }),
    };
  } catch {
    const canvas = document.createElement("canvas");
    host.appendChild(canvas);
    const c = canvas.getContext("2d");
    if (!c) throw new Error("Canvas tidak tersedia.");
    const resize = () => {
      const d = Math.min(devicePixelRatio, 2);
      canvas.width = innerWidth * d;
      canvas.height = innerHeight * d;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      c.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    c.imageSmoothingEnabled = false;
    const color = (n: number) => `rgb(${n >> 16},${(n >> 8) & 255},${n & 255})`;
    return {
      name: "Canvas 2D · fallback",
      clear: () => c.clearRect(0, 0, innerWidth, innerHeight),
      line: (x, y, x2, y2, width, n, alpha) => {
        c.globalAlpha = alpha;
        c.strokeStyle = color(n);
        c.lineWidth = width;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x2, y2);
        c.stroke();
      },
      ring: (x, y, r, width, n, alpha) => {
        c.globalAlpha = alpha;
        c.strokeStyle = color(n);
        c.lineWidth = width;
        c.beginPath();
        c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
        c.stroke();
      },
      dot: (x, y, r, n, alpha, square) => {
        c.globalAlpha = alpha;
        c.fillStyle = color(n);
        if (square)
          c.fillRect(
            Math.round(x - r),
            Math.round(y - r),
            Math.max(1, Math.round(r * 2)),
            Math.max(1, Math.round(r * 2)),
          );
        else {
          c.beginPath();
          c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
          c.fill();
        }
      },
      render: () => {},
      resize,
      destroy: () => canvas.remove(),
    };
  }
}
