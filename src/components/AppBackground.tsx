import { useEffect, useMemo, useRef, useState } from "react";

export type AppBackgroundVariant = "home" | "player" | "live";

type AppBackgroundProps = {
  variant?: AppBackgroundVariant;
};

const VARIANT_SETTINGS: Record<AppBackgroundVariant, {
  scrollSpeed: number;
  meshAmount: number;
  noiseAmount: number;
  asciiAmount: number;
  accent: [number, number, number];
  overlay: string;
}> = {
  home: {
    scrollSpeed: 0.014,
    meshAmount: 0.68,
    noiseAmount: 0.018,
    asciiAmount: 0.14,
    accent: [0.00, 0.78, 0.72],
    overlay: "bg-black/60",
  },
  player: {
    scrollSpeed: 0.010,
    meshAmount: 0.60,
    noiseAmount: 0.012,
    asciiAmount: 0.10,
    accent: [0.00, 0.52, 0.42],
    overlay: "bg-black/68",
  },
  live: {
    scrollSpeed: 0.015,
    meshAmount: 0.70,
    noiseAmount: 0.020,
    asciiAmount: 0.15,
    accent: [0.08, 0.86, 0.95],
    overlay: "bg-black/56",
  },
};

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_scrollSpeed;
  uniform float u_meshAmount;
  uniform float u_noiseAmount;
  uniform float u_asciiAmount;
  uniform vec3 u_accent;
  varying vec2 v_uv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
    vec2 p = (uv - 0.5) * aspect;
    float t = u_time * u_scrollSpeed;

    float gridX = 1.0 - smoothstep(0.0, 0.018, abs(fract((uv.x + t * 0.18) * 26.0) - 0.5));
    float gridY = 1.0 - smoothstep(0.0, 0.018, abs(fract((uv.y - t * 0.13) * 18.0) - 0.5));
    float grid = (gridX + gridY) * 0.035 * u_meshAmount;

    float flow = noise((p * 3.2) + vec2(t * 1.8, -t * 1.2));
    float fine = noise((uv * 92.0) + vec2(0.0, t * 30.0)) * u_noiseAmount;
    float scan = step(0.88, fract((uv.y - t * 2.5) * 42.0)) * 0.018 * u_asciiAmount;
    float centerFade = smoothstep(0.88, 0.05, length(p));

    vec3 base = vec3(0.010, 0.022, 0.050);
    vec3 navy = vec3(0.020, 0.055, 0.105);
    vec3 color = mix(base, navy, centerFade * 0.62);
    color += u_accent * ((flow * 0.055 + grid + scan) * centerFade);
    color += vec3(fine);
    color *= 0.68;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export function AppBackground({ variant = "home" }: AppBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const settings = useMemo(() => VARIANT_SETTINGS[variant], [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      stencil: false,
    });

    if (!gl) {
      setWebglFailed(true);
      return;
    }

    const program = createProgram(gl);
    if (!program) {
      setWebglFailed(true);
      return;
    }

    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const scrollSpeed = gl.getUniformLocation(program, "u_scrollSpeed");
    const meshAmount = gl.getUniformLocation(program, "u_meshAmount");
    const noiseAmount = gl.getUniformLocation(program, "u_noiseAmount");
    const asciiAmount = gl.getUniformLocation(program, "u_asciiAmount");
    const accent = gl.getUniformLocation(program, "u_accent");
    const buffer = gl.createBuffer();
    if (!buffer) {
      setWebglFailed(true);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      3, -1,
      -1, 3,
    ]), gl.STATIC_DRAW);

    let animation = 0;
    let lastFrame = 0;
    const targetFrameMs = 1000 / 30;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(window.innerWidth * dpr));
      const height = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const render = (now: number) => {
      if (!document.hidden && now - lastFrame >= targetFrameMs) {
        lastFrame = now;
        resize();
        gl.useProgram(program);
        gl.enableVertexAttribArray(position);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(resolution, canvas.width, canvas.height);
        gl.uniform1f(time, now * 0.001);
        gl.uniform1f(scrollSpeed, settings.scrollSpeed);
        gl.uniform1f(meshAmount, settings.meshAmount);
        gl.uniform1f(noiseAmount, settings.noiseAmount);
        gl.uniform1f(asciiAmount, settings.asciiAmount);
        gl.uniform3f(accent, settings.accent[0], settings.accent[1], settings.accent[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      animation = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    animation = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [settings]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 h-screen w-screen"
        />
        <div
          className={`pointer-events-none fixed inset-0 transition-opacity duration-500 ${
            webglFailed
              ? "bg-[radial-gradient(circle_at_24%_18%,rgba(14,116,144,0.18),transparent_34%),linear-gradient(135deg,#050914,#07111f_48%,#050914)]"
              : ""
          }`}
        />
      </div>
      <div className={`pointer-events-none absolute inset-0 z-10 ${settings.overlay}`} />
    </>
  );
}
