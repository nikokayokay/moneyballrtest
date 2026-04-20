import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number;
  phi: number;
  radius: number;
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

export interface SphereImageGridProps {
  images?: ImageData[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  onImageClick?: (image: ImageData) => void;
}

interface RotationState {
  x: number;
  y: number;
  z: number;
}

interface VelocityState {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  },
};

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  images = [],
  containerSize = 400,
  sphereRadius = 200,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = "",
  onImageClick,
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [rotation, setRotation] = useState<RotationState>({ x: 15, y: 15, z: 0 });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [imagePositions, setImagePositions] = useState<SphericalPosition[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const velocityRef = useRef<VelocityState>({ x: 0, y: 0 });

  const actualSphereRadius = sphereRadius || containerSize * 0.5;
  const baseImageSize = containerSize * baseImageScale;

  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  const generateSpherePositions = useCallback((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const imageCount = images.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = 2 * Math.PI / goldenRatio;

    for (let i = 0; i < imageCount; i++) {
      const t = i / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;

      if (phi < 90) {
        phi = Math.max(5, phi - poleBonus);
      } else {
        phi = Math.min(175, phi + poleBonus);
      }

      phi = 15 + (phi / 180) * 150;
      theta = (theta + ((i * 17) % 20) - 10) % 360;
      phi = Math.max(0, Math.min(180, phi + ((i * 11) % 10) - 5));
      positions.push({ theta, phi, radius: actualSphereRadius });
    }

    return positions;
  }, [images.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback((): WorldPosition[] => {
    const positions = imagePositions.map((pos, index) => {
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);

      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      const fadeZoneStart = -10;
      const fadeZoneEnd = -30;
      const isVisible = z > fadeZoneEnd;
      const fadeOpacity = z <= fadeZoneStart ? Math.max(0, (z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd)) : 1;
      const isPoleImage = pos.phi < 30 || pos.phi > 150;
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      const distanceRatio = Math.min(distanceFromCenter / actualSphereRadius, 1);
      const distancePenalty = isPoleImage ? 0.4 : 0.7;
      const centerScale = Math.max(0.3, 1 - distanceRatio * distancePenalty);
      const depthScale = (z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

      return {
        x,
        y,
        z,
        scale,
        zIndex: Math.round(1000 + z),
        isVisible,
        fadeOpacity,
        originalIndex: index,
      };
    });

    const adjustedPositions = [...positions];
    for (let i = 0; i < adjustedPositions.length; i++) {
      const pos = adjustedPositions[i];
      if (!pos.isVisible) continue;
      let adjustedScale = pos.scale;
      const imageSize = baseImageSize * adjustedScale;

      for (let j = 0; j < adjustedPositions.length; j++) {
        if (i === j) continue;
        const other = adjustedPositions[j];
        if (!other.isVisible) continue;
        const otherSize = baseImageSize * other.scale;
        const distance = Math.sqrt(((pos.x - other.x) ** 2) + ((pos.y - other.y) ** 2));
        const minDistance = (imageSize + otherSize) / 2 + 25;

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const reductionFactor = Math.max(0.4, 1 - (overlap / minDistance) * 0.6);
          adjustedScale = Math.min(adjustedScale, adjustedScale * reductionFactor);
        }
      }

      adjustedPositions[i] = { ...pos, scale: Math.max(0.25, adjustedScale) };
    }

    return adjustedPositions;
  }, [imagePositions, rotation, actualSphereRadius, baseImageSize]);

  const clampRotationSpeed = useCallback((speed: number): number => {
    return Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));
  }, [maxRotationSpeed]);

  const updateMomentum = useCallback(() => {
    if (isDragging || document.hidden) return;

    const currentVelocity = velocityRef.current;
    const nextVelocity = {
      x: currentVelocity.x * momentumDecay,
      y: currentVelocity.y * momentumDecay,
    };

    if (!autoRotate && Math.abs(nextVelocity.x) < 0.01 && Math.abs(nextVelocity.y) < 0.01) {
      velocityRef.current = { x: 0, y: 0 };
      setVelocity({ x: 0, y: 0 });
      return;
    }

    velocityRef.current = nextVelocity;
    setVelocity(nextVelocity);
    setRotation((prev) => {
      const newY = prev.y + (autoRotate ? autoRotateSpeed : 0) + clampRotationSpeed(nextVelocity.y);
      return {
        x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(nextVelocity.x)),
        y: SPHERE_MATH.normalizeAngle(newY),
        z: prev.z,
      };
    });
  }, [autoRotate, autoRotateSpeed, clampRotationSpeed, isDragging, momentumDecay]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = event.clientX - lastMousePos.current.x;
    const deltaY = event.clientY - lastMousePos.current.y;
    const rotationDelta = {
      x: -deltaY * dragSensitivity,
      y: deltaX * dragSensitivity,
    };

    setRotation((prev) => ({
      x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
      y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
      z: prev.z,
    }));

    setVelocity({
      x: clampRotationSpeed(rotationDelta.x),
      y: clampRotationSpeed(rotationDelta.y),
    });
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  }, [clampRotationSpeed, dragSensitivity, isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isDragging) return;
    event.preventDefault();
    const touch = event.touches[0];
    const deltaX = touch.clientX - lastMousePos.current.x;
    const deltaY = touch.clientY - lastMousePos.current.y;
    const rotationDelta = {
      x: -deltaY * dragSensitivity,
      y: deltaX * dragSensitivity,
    };

    setRotation((prev) => ({
      x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
      y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
      z: prev.z,
    }));
    setVelocity({
      x: clampRotationSpeed(rotationDelta.x),
      y: clampRotationSpeed(rotationDelta.y),
    });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, [clampRotationSpeed, dragSensitivity, isDragging]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setImagePositions(generateSpherePositions());
  }, [generateSpherePositions]);

  useEffect(() => {
    const animate = () => {
      updateMomentum();
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (isMounted) {
      animationFrame.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [isMounted, updateMomentum]);

  useEffect(() => {
    if (!isMounted) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, isMounted]);

  const worldPositions = useMemo(() => calculateWorldPositions(), [calculateWorldPositions]);

  const renderImageNode = useCallback((image: ImageData, index: number) => {
    const position = worldPositions[index];
    if (!position || !position.isVisible) return null;

    const imageSize = baseImageSize * position.scale;
    const isHovered = hoveredIndex === index;
    const finalScale = isHovered ? Math.min(hoverScale, hoverScale / position.scale) : 1;

    return (
      <button
        key={image.id}
        type="button"
        className="group absolute cursor-pointer select-none rounded-full transition-transform duration-200 ease-out"
        style={{
          width: `${imageSize}px`,
          height: `${imageSize}px`,
          left: `${containerSize / 2 + position.x}px`,
          top: `${containerSize / 2 + position.y}px`,
          opacity: position.fadeOpacity,
          transform: `translate(-50%, -50%) scale(${finalScale})`,
          zIndex: position.zIndex,
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={(event) => {
          event.stopPropagation();
          if (onImageClick) {
            onImageClick(image);
            return;
          }
          setSelectedImage(image);
        }}
        aria-label={image.title ? `${image.title}: ${image.description || image.alt}` : image.alt}
      >
        <span className="relative block h-full w-full overflow-hidden rounded-full border border-slate-700/70 bg-slate-950 shadow-[0_14px_32px_rgba(0,0,0,0.34)] transition duration-200 group-hover:border-emerald-300/70">
          <img
            src={image.src}
            alt={image.alt}
            className="player-headshot-sphere h-full w-full saturate-75 transition duration-200 group-hover:saturate-100"
            draggable={false}
            loading={index < 6 ? "eager" : "lazy"}
          />
        </span>
      </button>
    );
  }, [baseImageSize, containerSize, hoveredIndex, hoverScale, onImageClick, worldPositions]);

  const renderSpotlightModal = () => {
    if (!selectedImage) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
        onClick={() => setSelectedImage(null)}
      >
        <div
          className="w-full max-w-md overflow-hidden border border-white/10 bg-[#08101b] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative aspect-square bg-[#050914]">
            <img src={selectedImage.src} alt={selectedImage.alt} className="player-headshot h-full w-full" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Close player preview"
            >
              <X size={16} />
            </button>
          </div>

          {(selectedImage.title || selectedImage.description) && (
            <div className="p-5">
              {selectedImage.title ? (
                <h3 className="font-['Barlow_Condensed'] text-3xl font-semibold uppercase tracking-[0.08em] text-white">{selectedImage.title}</h3>
              ) : null}
              {selectedImage.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-400">{selectedImage.description}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div
        className="flex animate-pulse items-center justify-center bg-[#080d16]"
        style={{ width: containerSize, height: containerSize }}
      >
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Loading impact sphere</div>
      </div>
    );
  }

  if (!images.length) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-white/10 bg-[#080d16]"
        style={{ width: containerSize, height: containerSize }}
      >
        <div className="text-center text-sm text-slate-500">
          <p>Not enough player data</p>
          <p className="text-xs">Impact players appear after live stats load.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`relative select-none cursor-grab overflow-hidden active:cursor-grabbing ${className}`}
        style={{
          width: containerSize,
          height: containerSize,
          perspective: `${perspective}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(0,0,0,0.62)_78%)]" />
        <div className="relative h-full w-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => renderImageNode(image, index))}
        </div>
      </div>

      {renderSpotlightModal()}
    </>
  );
};

export default SphereImageGrid;
