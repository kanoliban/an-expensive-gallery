import React, { useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import * as THREE from 'three';
import type { Artwork } from '../src/types/gallery';
import { formatPrice } from '../src/utils/format';
import { getArtistById } from '../src/data';

// Trim white borders from an image and return a canvas
const trimWhiteBorders = (img: HTMLImageElement, threshold = 250): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = img.width;
    canvas.height = img.height;
    return canvas;
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const isWhiteish = (x: number, y: number): boolean => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    // Check if pixel is white-ish (high RGB values) or transparent
    return a < 10 || (r > threshold && g > threshold && b > threshold);
  };

  // Find bounds by scanning from edges
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  // Scan top
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isWhiteish(x, y)) {
        top = y;
        break outer;
      }
    }
  }

  // Scan bottom
  outer: for (let y = height - 1; y >= top; y--) {
    for (let x = 0; x < width; x++) {
      if (!isWhiteish(x, y)) {
        bottom = y;
        break outer;
      }
    }
  }

  // Scan left
  outer: for (let x = 0; x < width; x++) {
    for (let y = top; y <= bottom; y++) {
      if (!isWhiteish(x, y)) {
        left = x;
        break outer;
      }
    }
  }

  // Scan right
  outer: for (let x = width - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      if (!isWhiteish(x, y)) {
        right = x;
        break outer;
      }
    }
  }

  // Add small padding (2px) to avoid cutting too close
  const padding = 2;
  top = Math.max(0, top - padding);
  bottom = Math.min(height - 1, bottom + padding);
  left = Math.max(0, left - padding);
  right = Math.min(width - 1, right + padding);

  const trimmedWidth = right - left + 1;
  const trimmedHeight = bottom - top + 1;

  // Only trim if we're removing a meaningful border (at least 3px)
  if (left < 3 && top < 3 && right > width - 4 && bottom > height - 4) {
    return canvas; // No significant border, return original
  }

  const trimmedCanvas = document.createElement('canvas');
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) return canvas;

  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  trimmedCtx.drawImage(canvas, left, top, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

  return trimmedCanvas;
};

interface ExploreGalleryProps {
  isDarkMode: boolean;
  artworks: Artwork[];
}

interface HoveredArtwork {
  artwork: Artwork;
  x: number;
  y: number;
}

// Focused artwork data for the 3D fly-in
interface FocusedArtwork {
  artwork: Artwork;
  mesh: THREE.Mesh;
  originalPosition: THREE.Vector3;
  originalRotation: THREE.Euler;
}

const ExploreGallery: React.FC<ExploreGalleryProps> = ({ isDarkMode, artworks }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const detailsPanelRef = useRef<HTMLDivElement>(null);

  // Focused artwork state for 3D fly-in
  const focusedRef = useRef<FocusedArtwork | null>(null);
  const isAnimatingRef = useRef(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const segmentsRef = useRef<THREE.Group[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const artworkIndexRef = useRef(0);

  // Movement state
  const velocityRef = useRef({ x: 0, z: -0.02 }); // Auto-drift forward
  const rotationRef = useRef({ yaw: 0, pitch: 0 });
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPausedRef = useRef(false);
  const scrollBoostRef = useRef(0); // Scroll-to-speed boost

  const [hoveredArtwork, setHoveredArtwork] = useState<HoveredArtwork | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Configuration
  const TUNNEL_WIDTH = 24;
  const TUNNEL_HEIGHT = 16;
  const SEGMENT_DEPTH = 6;
  const NUM_SEGMENTS = 14;
  const FLOOR_COLS = 6;
  const WALL_ROWS = 4;
  const COL_WIDTH = TUNNEL_WIDTH / FLOOR_COLS;
  const ROW_HEIGHT = TUNNEL_HEIGHT / WALL_ROWS;

  // Movement settings
  const AUTO_SPEED = 0.02;
  const WALK_SPEED = 0.08;
  const SCROLL_BOOST_SPEED = 0.2; // Max speed boost from scrolling
  const SCROLL_DECAY = 0.92; // How quickly scroll boost decays
  const LOOK_SENSITIVITY = 0.002;
  const TOUCH_SENSITIVITY = 0.004;
  const MAX_PITCH = Math.PI / 4; // 45 degrees up/down

  // Get next artwork in rotation
  const getNextArtwork = useCallback((): Artwork => {
    if (artworks.length === 0) {
      return {
        id: 'placeholder',
        artistId: '',
        title: 'Artwork',
        year: 2024,
        medium: '',
        dimensions: { height: 0, width: 0, unit: 'in' },
        price: 0,
        currency: 'USD',
        status: 'available',
        images: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&fit=crop', alt: '', isPrimary: true, aspectRatio: 1 }],
        featured: false,
        order: 0,
      };
    }
    const artwork = artworks[artworkIndexRef.current % artworks.length];
    artworkIndexRef.current++;
    return artwork;
  }, [artworks]);

  const createSegment = useCallback((zPos: number) => {
    const group = new THREE.Group();
    group.position.z = zPos;

    const w = TUNNEL_WIDTH / 2;
    const h = TUNNEL_HEIGHT / 2;
    const d = SEGMENT_DEPTH;

    // Grid lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xb0b0b0, transparent: true, opacity: 0.5 });
    const lineGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];

    for (let i = 0; i <= FLOOR_COLS; i++) {
      const x = -w + (i * COL_WIDTH);
      vertices.push(x, -h, 0, x, -h, -d);
      vertices.push(x, h, 0, x, h, -d);
    }
    for (let i = 1; i < WALL_ROWS; i++) {
      const y = -h + (i * ROW_HEIGHT);
      vertices.push(-w, y, 0, -w, y, -d);
      vertices.push(w, y, 0, w, y, -d);
    }
    vertices.push(-w, -h, 0, w, -h, 0);
    vertices.push(-w, h, 0, w, h, 0);
    vertices.push(-w, -h, 0, -w, h, 0);
    vertices.push(w, -h, 0, w, h, 0);

    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMaterial);
    group.add(lines);

    populateImages(group, w, h, d);
    return group;
  }, []);

  const populateImages = useCallback((group: THREE.Group, w: number, h: number, d: number) => {
    const cellMargin = 0.4;

    const addImg = (pos: THREE.Vector3, rot: THREE.Euler, wd: number, ht: number) => {
      const artwork = getNextArtwork();
      const imageUrl = artwork.images[0]?.url || '';

      if (!imageUrl) return;

      const geom = new THREE.PlaneGeometry(wd - cellMargin, ht - cellMargin);
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });

      // Load image, trim white borders, then create texture
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const trimmedCanvas = trimWhiteBorders(img);
        const tex = new THREE.CanvasTexture(trimmedCanvas);
        tex.minFilter = THREE.LinearFilter;
        mat.map = tex;
        mat.needsUpdate = true;
        gsap.to(mat, { opacity: 0.9, duration: 1 });
      };
      img.src = imageUrl;

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.rotation.copy(rot);
      mesh.name = 'artwork_image';
      mesh.userData = { artwork };
      group.add(mesh);
    };

    // Floor
    let lastFloorIdx = -999;
    for (let i = 0; i < FLOOR_COLS; i++) {
      if (i > lastFloorIdx + 1 && Math.random() > 0.75) {
        addImg(
          new THREE.Vector3(-w + i * COL_WIDTH + COL_WIDTH / 2, -h + 0.01, -d / 2),
          new THREE.Euler(-Math.PI / 2, 0, 0),
          COL_WIDTH,
          d
        );
        lastFloorIdx = i;
      }
    }

    // Ceiling (sparser)
    let lastCeilIdx = -999;
    for (let i = 0; i < FLOOR_COLS; i++) {
      if (i > lastCeilIdx + 1 && Math.random() > 0.85) {
        addImg(
          new THREE.Vector3(-w + i * COL_WIDTH + COL_WIDTH / 2, h - 0.01, -d / 2),
          new THREE.Euler(Math.PI / 2, 0, 0),
          COL_WIDTH,
          d
        );
        lastCeilIdx = i;
      }
    }

    // Left Wall
    let lastLeftIdx = -999;
    for (let i = 0; i < WALL_ROWS; i++) {
      if (i > lastLeftIdx + 1 && Math.random() > 0.70) {
        addImg(
          new THREE.Vector3(-w + 0.01, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2),
          new THREE.Euler(0, Math.PI / 2, 0),
          d,
          ROW_HEIGHT
        );
        lastLeftIdx = i;
      }
    }

    // Right Wall
    let lastRightIdx = -999;
    for (let i = 0; i < WALL_ROWS; i++) {
      if (i > lastRightIdx + 1 && Math.random() > 0.70) {
        addImg(
          new THREE.Vector3(w - 0.01, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2),
          new THREE.Euler(0, -Math.PI / 2, 0),
          d,
          ROW_HEIGHT
        );
        lastRightIdx = i;
      }
    }
  }, [getNextArtwork]);

  // Desktop: Mouse look
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate offset from center
    const offsetX = (event.clientX - rect.left - centerX) / centerX;
    const offsetY = (event.clientY - rect.top - centerY) / centerY;

    // Smooth rotation based on mouse position
    rotationRef.current.yaw = -offsetX * 0.5;
    rotationRef.current.pitch = -offsetY * 0.3;
    rotationRef.current.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, rotationRef.current.pitch));

    // Raycasting for hover
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const allMeshes: THREE.Mesh[] = [];
    segmentsRef.current.forEach(segment => {
      segment.traverse(child => {
        if (child instanceof THREE.Mesh && child.name === 'artwork_image') {
          allMeshes.push(child);
        }
      });
    });

    const intersects = raycasterRef.current.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const artworkData = hit.userData.artwork as Artwork;
      if (artworkData && artworkData.id !== 'placeholder') {
        setHoveredArtwork({
          artwork: artworkData,
          x: event.clientX,
          y: event.clientY,
        });
        canvasRef.current.style.cursor = 'pointer';
      }
    } else {
      setHoveredArtwork(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
    }
  }, []);

  // Focus artwork - animate it flying towards camera
  const focusArtwork = useCallback((mesh: THREE.Mesh, artworkData: Artwork) => {
    if (!cameraRef.current || !sceneRef.current || isAnimatingRef.current) return;
    if (focusedRef.current) return; // Already focused

    isAnimatingRef.current = true;
    isPausedRef.current = true;
    setIsPaused(true);

    // Store original state
    const originalPosition = mesh.position.clone();
    const originalRotation = mesh.rotation.clone();

    // Get mesh world position
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    // Calculate target position: in front of camera
    const camera = cameraRef.current;
    const targetDistance = 3;
    const targetPos = new THREE.Vector3(0, 0, -targetDistance);
    targetPos.applyQuaternion(camera.quaternion);
    targetPos.add(camera.position);

    // Move mesh to scene root for animation (remove from segment)
    const parent = mesh.parent;
    if (parent) {
      parent.remove(mesh);
      sceneRef.current.add(mesh);
      mesh.position.copy(worldPos);
    }

    // Store focused state
    focusedRef.current = { artwork: artworkData, mesh, originalPosition, originalRotation };
    setSelectedArtwork(artworkData);

    // Animate mesh flying to camera
    gsap.to(mesh.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.5,
      ease: 'power2.out',
    });

    // Make fully opaque when focused
    const material = mesh.material as THREE.MeshBasicMaterial;
    gsap.to(material, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });

    // Rotate to face camera
    gsap.to(mesh.rotation, {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        isAnimatingRef.current = false;
        // Show details panel
        if (detailsPanelRef.current) {
          gsap.fromTo(detailsPanelRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3 });
        }
      },
    });
  }, []);

  // Unfocus artwork - animate back to wall
  const unfocusArtwork = useCallback(() => {
    if (!focusedRef.current || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    const { mesh } = focusedRef.current;

    // Hide details panel first
    if (detailsPanelRef.current) {
      gsap.to(detailsPanelRef.current, { opacity: 0, x: 20, duration: 0.2 });
    }

    // Fade out the mesh
    const material = mesh.material as THREE.MeshBasicMaterial;
    gsap.to(material, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        // Remove mesh from scene
        if (sceneRef.current) {
          sceneRef.current.remove(mesh);
          mesh.geometry.dispose();
          if (material.map) material.map.dispose();
          material.dispose();
        }

        focusedRef.current = null;
        setSelectedArtwork(null);
        isPausedRef.current = false;
        setIsPaused(false);
        isAnimatingRef.current = false;
      },
    });
  }, []);

  // Desktop: Click - focus artwork (3D fly-in)
  const handleClick = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    // If already focused, clicking anywhere unfocuses
    if (focusedRef.current) {
      unfocusArtwork();
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const allMeshes: THREE.Mesh[] = [];
    segmentsRef.current.forEach(segment => {
      segment.traverse(child => {
        if (child instanceof THREE.Mesh && child.name === 'artwork_image') {
          allMeshes.push(child);
        }
      });
    });

    const intersects = raycasterRef.current.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const artworkData = hit.userData.artwork as Artwork;
      if (artworkData && artworkData.id !== 'placeholder') {
        focusArtwork(hit, artworkData);
      }
    }
  }, [focusArtwork, unfocusArtwork]);

  // Mobile: Touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length === 1) {
      touchStartRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }, []);

  // Mobile: Touch move - horizontal = look, vertical = speed boost
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current || event.touches.length !== 1) return;
    event.preventDefault();

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Horizontal swipes = look left/right (unchanged)
    rotationRef.current.yaw -= deltaX * TOUCH_SENSITIVITY;

    // Vertical swipes = speed boost (swipe up = faster)
    // Only apply speed boost if not focused on an artwork
    if (!focusedRef.current) {
      // Swipe up (negative deltaY) = go faster, swipe down = slow down
      const speedDelta = -deltaY * 0.002;
      scrollBoostRef.current = Math.max(0, Math.min(SCROLL_BOOST_SPEED * 1.5, scrollBoostRef.current + speedDelta));
    }

    // Minimal pitch adjustment (10% of before) so they can still look up/down slightly
    rotationRef.current.pitch -= deltaY * TOUCH_SENSITIVITY * 0.1;
    rotationRef.current.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, rotationRef.current.pitch));

    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  // Mobile: Touch end (tap to focus artwork)
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    // If already focused, tapping anywhere unfocuses
    if (focusedRef.current) {
      unfocusArtwork();
      touchStartRef.current = null;
      return;
    }

    // Check if it was a tap (not a drag)
    if (touchStartRef.current && event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const rect = canvasRef.current.getBoundingClientRect();

      mouseRef.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const allMeshes: THREE.Mesh[] = [];
      segmentsRef.current.forEach(segment => {
        segment.traverse(child => {
          if (child instanceof THREE.Mesh && child.name === 'artwork_image') {
            allMeshes.push(child);
          }
        });
      });

      const intersects = raycasterRef.current.intersectObjects(allMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const artworkData = hit.userData.artwork as Artwork;
        if (artworkData && artworkData.id !== 'placeholder') {
          focusArtwork(hit, artworkData);
        }
      }
    }

    touchStartRef.current = null;
  }, [focusArtwork, unfocusArtwork]);

  // Scroll to speed up
  const handleWheel = useCallback((event: WheelEvent) => {
    // Don't boost if artwork is focused
    if (focusedRef.current) return;

    // Scroll down (positive deltaY) = move forward faster
    const scrollAmount = Math.abs(event.deltaY) / 100;
    scrollBoostRef.current = Math.min(SCROLL_BOOST_SPEED, scrollBoostRef.current + scrollAmount * 0.05);
  }, []);

  // Keyboard controls
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    // If artwork is focused, ESC unfocuses it
    if (key === 'escape') {
      if (focusedRef.current) {
        unfocusArtwork();
        return;
      }
      navigate('/');
      return;
    }

    // Don't process movement keys if artwork is focused
    if (focusedRef.current) return;

    if (key === 'w' || key === 'arrowup') keysRef.current.w = true;
    if (key === 'a' || key === 'arrowleft') keysRef.current.a = true;
    if (key === 's' || key === 'arrowdown') keysRef.current.s = true;
    if (key === 'd' || key === 'arrowright') keysRef.current.d = true;
    if (key === ' ') {
      event.preventDefault();
      isPausedRef.current = !isPausedRef.current;
      setIsPaused(isPausedRef.current);
    }
  }, [navigate, unfocusArtwork]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') keysRef.current.w = false;
    if (key === 'a' || key === 'arrowleft') keysRef.current.a = false;
    if (key === 's' || key === 'arrowdown') keysRef.current.s = false;
    if (key === 'd' || key === 'arrowright') keysRef.current.d = false;
  }, []);

  // Scene setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x050505 : 0xffffff);
    sceneRef.current = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Create segments
    const segments: THREE.Group[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const z = -i * SEGMENT_DEPTH;
      const segment = createSegment(z);
      scene.add(segment);
      segments.push(segment);
    }
    segmentsRef.current = segments;

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;

      // Apply scroll boost decay
      scrollBoostRef.current *= SCROLL_DECAY;
      if (scrollBoostRef.current < 0.001) scrollBoostRef.current = 0;

      // Auto-drift: always world-space -Z (forward in tunnel), independent of where you look
      // Add scroll boost for faster movement when scrolling
      const totalSpeed = AUTO_SPEED + scrollBoostRef.current;
      const driftZ = isPausedRef.current ? 0 : -totalSpeed;

      // WASD: view-relative movement (rotated by yaw)
      let wasdX = 0;
      let wasdZ = 0;

      if (!isPausedRef.current) {
        if (keysRef.current.w) wasdZ -= WALK_SPEED;
        if (keysRef.current.s) wasdZ += WALK_SPEED;
        if (keysRef.current.a) wasdX -= WALK_SPEED;
        if (keysRef.current.d) wasdX += WALK_SPEED;
      }

      // Rotate WASD by yaw (so W moves where you're looking)
      const yaw = rotationRef.current.yaw;
      const rotatedWasdX = wasdX * Math.cos(yaw) - wasdZ * Math.sin(yaw);
      const rotatedWasdZ = wasdX * Math.sin(yaw) + wasdZ * Math.cos(yaw);

      // Update camera position: drift is world-space, WASD is view-space
      cameraRef.current.position.x += rotatedWasdX;
      cameraRef.current.position.z += driftZ + rotatedWasdZ;

      // Clamp X position to stay in tunnel
      const maxX = TUNNEL_WIDTH / 2 - 2;
      cameraRef.current.position.x = Math.max(-maxX, Math.min(maxX, cameraRef.current.position.x));

      // Apply camera rotation
      cameraRef.current.rotation.y = rotationRef.current.yaw;
      cameraRef.current.rotation.x = rotationRef.current.pitch;

      // Infinite tunnel logic
      const tunnelLength = NUM_SEGMENTS * SEGMENT_DEPTH;
      const camZ = cameraRef.current.position.z;

      segmentsRef.current.forEach(segment => {
        // Moving forward
        if (segment.position.z > camZ + SEGMENT_DEPTH * 2) {
          let minZ = 0;
          segmentsRef.current.forEach(s => (minZ = Math.min(minZ, s.position.z)));
          segment.position.z = minZ - SEGMENT_DEPTH;
          refreshSegment(segment);
        }

        // Moving backward
        if (segment.position.z < camZ - tunnelLength - SEGMENT_DEPTH) {
          let maxZ = -999999;
          segmentsRef.current.forEach(s => (maxZ = Math.max(maxZ, s.position.z)));
          segment.position.z = maxZ + SEGMENT_DEPTH;
          refreshSegment(segment);
        }
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    const refreshSegment = (segment: THREE.Group) => {
      const toRemove: THREE.Object3D[] = [];
      segment.traverse(c => {
        if (c.name === 'artwork_image') toRemove.push(c);
      });
      toRemove.forEach(c => {
        segment.remove(c);
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          const material = c.material as THREE.MeshBasicMaterial;
          if (material.map) material.map.dispose();
          material.dispose();
        }
      });
      const w = TUNNEL_WIDTH / 2;
      const h = TUNNEL_HEIGHT / 2;
      const d = SEGMENT_DEPTH;
      populateImages(segment, w, h, d);
    };

    animate();

    // Event listeners
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [createSegment, populateImages, handleMouseMove, handleClick, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel, handleKeyDown, handleKeyUp]);

  // Theme update
  useEffect(() => {
    if (!sceneRef.current) return;

    const bgHex = isDarkMode ? 0x050505 : 0xffffff;
    const lineHex = isDarkMode ? 0x555555 : 0xb0b0b0;
    const lineOp = isDarkMode ? 0.35 : 0.5;

    sceneRef.current.background = new THREE.Color(bgHex);

    segmentsRef.current.forEach(segment => {
      segment.children.forEach(child => {
        if (child instanceof THREE.LineSegments) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.color.setHex(lineHex);
          mat.opacity = lineOp;
          mat.needsUpdate = true;
        }
      });
    });
  }, [isDarkMode]);

  // Hide controls hint after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Overlay entrance animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.3 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}
    >
      <canvas ref={canvasRef} className="size-full block" />

      {/* Hover tooltip */}
      {hoveredArtwork && (
        <div
          className="fixed z-30 pointer-events-none"
          style={{
            left: hoveredArtwork.x + 16,
            top: hoveredArtwork.y + 16,
          }}
        >
          <div className={`px-4 py-3 shadow-lg ${isDarkMode ? 'bg-white text-[#0F0F0F]' : 'bg-[#0F0F0F] text-white'}`}>
            <p className="text-sm font-medium italic">{hoveredArtwork.artwork.title}</p>
            <p className="text-xs mt-1 tabular-nums">
              {formatPrice(hoveredArtwork.artwork.price, hoveredArtwork.artwork.currency)}
            </p>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div ref={overlayRef} className="fixed inset-0 z-20 pointer-events-none">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-auto">
          <Link
            to="/"
            className={`text-sm font-medium transition-opacity hover:opacity-70 ${isDarkMode ? 'text-white' : 'text-[#0F0F0F]'}`}
          >
            ← Exit Gallery
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                isPausedRef.current = !isPausedRef.current;
                setIsPaused(isPausedRef.current);
              }}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                isDarkMode
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/5 text-[#0F0F0F] hover:bg-black/10'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <Link
              to="/collection"
              className={`px-4 py-2 text-sm font-medium transition-all ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-[#0F0F0F] text-white hover:bg-[#1a1a1a]'
              }`}
            >
              View Collection
            </Link>
          </div>
        </div>

        {/* Controls hint */}
        {showControls && (
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-center transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              <span className="hidden md:inline">Move mouse to look • WASD to walk • Scroll to speed up • Click artwork to view</span>
              <span className="md:hidden">Swipe sideways to look • Swipe up to speed up • Tap artwork to view</span>
            </p>
          </div>
        )}

        {/* Pause indicator (only show if not viewing artwork) */}
        {isPaused && !selectedArtwork && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`px-8 py-4 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
              <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-[#0F0F0F]'}`}>
                Paused
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Artwork Details Panel - Museum placard style */}
      {selectedArtwork && (
        <div
          ref={detailsPanelRef}
          className={`fixed z-40 pointer-events-auto
            md:right-0 md:top-0 md:bottom-0 md:w-full md:max-w-md md:p-8 md:flex md:flex-col md:justify-center
            bottom-0 left-0 right-0 p-4 md:left-auto`}
          style={{ opacity: 0 }}
        >
          {/* Desktop: Large panel | Mobile: Small placard */}
          <div className={`
            ${isDarkMode ? 'bg-[#0a0a0a]/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}
            md:p-8 p-4
          `}>
            {/* Close button - desktop only, mobile taps anywhere */}
            <button
              onClick={unfocusArtwork}
              className={`absolute top-2 right-2 md:top-4 md:right-4 p-1.5 md:p-2 transition-colors ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 md:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Mobile: Horizontal compact layout | Desktop: Vertical */}
            <div className="md:block flex items-start gap-4">
              {/* Info section */}
              <div className="flex-1 min-w-0">
                {/* Title - smaller on mobile */}
                <h2 className={`md:text-2xl text-base font-medium italic md:mb-2 mb-0.5 truncate ${isDarkMode ? 'text-white' : 'text-[#0F0F0F]'}`}>
                  {selectedArtwork.title}
                </h2>

                {/* Artist */}
                {(() => {
                  const artist = getArtistById(selectedArtwork.artistId);
                  return artist ? (
                    <p className={`md:text-sm text-xs md:mb-4 mb-1 ${isDarkMode ? 'text-white/70' : 'text-[#6B6B6B]'}`}>
                      {artist.name}
                    </p>
                  ) : null;
                })()}

                {/* Year & Medium - single line on mobile */}
                <p className={`md:text-sm text-[10px] md:mb-1 ${isDarkMode ? 'text-white/50' : 'text-[#9B9B9B]'}`}>
                  <span>{selectedArtwork.year}</span>
                  <span className="md:hidden"> · </span>
                  <span className="md:block">{selectedArtwork.medium}</span>
                </p>

                {/* Price - visible on desktop, hidden on mobile (shown in actions area) */}
                <p className={`hidden md:block text-lg font-medium tabular-nums mb-8 ${isDarkMode ? 'text-white' : 'text-[#0F0F0F]'}`}>
                  {formatPrice(selectedArtwork.price, selectedArtwork.currency)}
                </p>
              </div>

              {/* Mobile: Price + compact actions */}
              <div className="md:hidden flex flex-col items-end gap-2 shrink-0">
                <p className={`text-sm font-medium tabular-nums ${isDarkMode ? 'text-white' : 'text-[#0F0F0F]'}`}>
                  {formatPrice(selectedArtwork.price, selectedArtwork.currency)}
                </p>
                <div className="flex gap-2">
                  <Link
                    to={`/work/${selectedArtwork.id}`}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${
                      isDarkMode
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-[#0F0F0F] text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Details
                  </Link>
                  <Link
                    to="/inquire"
                    className={`px-3 py-1.5 text-xs font-medium transition-all border ${
                      isDarkMode
                        ? 'border-white/30 text-white hover:bg-white/10'
                        : 'border-[#0F0F0F]/30 text-[#0F0F0F] hover:bg-black/5'
                    }`}
                  >
                    Inquire
                  </Link>
                </div>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex gap-3">
              <Link
                to={`/work/${selectedArtwork.id}`}
                className={`flex-1 py-3 text-center text-sm font-medium transition-all ${
                  isDarkMode
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-[#0F0F0F] text-white hover:bg-[#1a1a1a]'
                }`}
              >
                View Details
              </Link>
              <Link
                to="/inquire"
                className={`flex-1 py-3 text-center text-sm font-medium transition-all border ${
                  isDarkMode
                    ? 'border-white/30 text-white hover:bg-white/10'
                    : 'border-[#0F0F0F]/30 text-[#0F0F0F] hover:bg-black/5'
                }`}
              >
                Inquire
              </Link>
            </div>

            {/* ESC hint - desktop only */}
            <p className={`hidden md:block mt-6 text-xs text-center ${isDarkMode ? 'text-white/30' : 'text-[#9B9B9B]'}`}>
              Press ESC or tap anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreGallery;
