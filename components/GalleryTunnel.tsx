import React, { useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import * as THREE from 'three';
import type { Artwork } from '../src/types/gallery';
import { formatPrice } from '../src/utils/format';

interface GalleryTunnelProps {
  isDarkMode: boolean;
  artworks: Artwork[];
}

interface HoveredArtwork {
  artwork: Artwork;
  x: number;
  y: number;
}

const GalleryTunnel: React.FC<GalleryTunnelProps> = ({ isDarkMode, artworks }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const segmentsRef = useRef<THREE.Group[]>([]);
  const scrollPosRef = useRef(0);
  const transitionBoostRef = useRef(0); // For explore transition acceleration
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const artworkIndexRef = useRef(0);

  const [hoveredArtwork, setHoveredArtwork] = useState<HoveredArtwork | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Configuration
  const TUNNEL_WIDTH = 24;
  const TUNNEL_HEIGHT = 16;
  const SEGMENT_DEPTH = 6;
  const NUM_SEGMENTS = 14;
  const FLOOR_COLS = 6;
  const WALL_ROWS = 4;
  const COL_WIDTH = TUNNEL_WIDTH / FLOOR_COLS;
  const ROW_HEIGHT = TUNNEL_HEIGHT / WALL_ROWS;

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
  }, [getNextArtwork]);

  const populateImages = useCallback((group: THREE.Group, w: number, h: number, d: number) => {
    const textureLoader = new THREE.TextureLoader();
    const cellMargin = 0.4;

    const addImg = (pos: THREE.Vector3, rot: THREE.Euler, wd: number, ht: number) => {
      const artwork = getNextArtwork();
      const imageUrl = artwork.images[0]?.url || '';

      if (!imageUrl) return;

      const geom = new THREE.PlaneGeometry(wd - cellMargin, ht - cellMargin);
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });

      textureLoader.load(imageUrl, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        mat.map = tex;
        mat.needsUpdate = true;
        gsap.to(mat, { opacity: 0.85, duration: 1 });
      });

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
      if (i > lastFloorIdx + 1 && Math.random() > 0.80) {
        addImg(
          new THREE.Vector3(-w + i * COL_WIDTH + COL_WIDTH / 2, -h, -d / 2),
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
      if (i > lastCeilIdx + 1 && Math.random() > 0.88) {
        addImg(
          new THREE.Vector3(-w + i * COL_WIDTH + COL_WIDTH / 2, h, -d / 2),
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
      if (i > lastLeftIdx + 1 && Math.random() > 0.80) {
        addImg(
          new THREE.Vector3(-w, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2),
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
      if (i > lastRightIdx + 1 && Math.random() > 0.80) {
        addImg(
          new THREE.Vector3(w, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2),
          new THREE.Euler(0, -Math.PI / 2, 0),
          d,
          ROW_HEIGHT
        );
        lastRightIdx = i;
      }
    }
  }, [getNextArtwork]);

  // Mouse interaction
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

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

  const handleClick = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

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
        navigate(`/work/${artworkData.id}`);
      }
    }
  }, [navigate]);

  // Scene setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
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

    const segments: THREE.Group[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const z = -i * SEGMENT_DEPTH;
      const segment = createSegment(z);
      scene.add(segment);
      segments.push(segment);
    }
    segmentsRef.current = segments;

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;

      // Add transition boost for explore acceleration
      const boostZ = transitionBoostRef.current;
      if (transitionBoostRef.current > 0) {
        transitionBoostRef.current *= 1.008; // Gentle acceleration during transition
      }

      const targetZ = -scrollPosRef.current * 0.05 - boostZ;
      const currentZ = cameraRef.current.position.z;
      cameraRef.current.position.z += (targetZ - currentZ) * 0.1;

      const tunnelLength = NUM_SEGMENTS * SEGMENT_DEPTH;
      const camZ = cameraRef.current.position.z;

      segmentsRef.current.forEach(segment => {
        if (segment.position.z > camZ + SEGMENT_DEPTH) {
          let minZ = 0;
          segmentsRef.current.forEach(s => (minZ = Math.min(minZ, s.position.z)));
          segment.position.z = minZ - SEGMENT_DEPTH;

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
        }

        if (segment.position.z < camZ - tunnelLength - SEGMENT_DEPTH) {
          let maxZ = -999999;
          segmentsRef.current.forEach(s => (maxZ = Math.max(maxZ, s.position.z)));
          segment.position.z = maxZ + SEGMENT_DEPTH;

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
        }
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    const onScroll = () => {
      scrollPosRef.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const canvas = canvasRef.current;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [createSegment, populateImages, handleMouseMove, handleClick]);

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

  // Text entrance animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.5 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Handle explore transition - fade out content and accelerate into tunnel
  const handleExploreClick = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Start tunnel acceleration (gentle start)
    transitionBoostRef.current = 0.2;

    // Animate content out smoothly
    gsap.to(contentRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      ease: 'power2.inOut',
    });

    // Navigate after animation completes
    setTimeout(() => {
      navigate('/explore');
    }, 1400);
  }, [isTransitioning, navigate]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[10000vh] transition-colors duration-700 ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}
    >
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
        <canvas ref={canvasRef} className="size-full block" />
      </div>

      {/* Hover tooltip */}
      {hoveredArtwork && (
        <div
          className="fixed z-20 pointer-events-none"
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

      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div ref={contentRef} className="text-center flex flex-col items-center max-w-3xl px-6 pointer-events-auto">
          <h1
            className={`text-[5rem] md:text-[7rem] lg:text-[8rem] leading-[0.85] font-bold tracking-tighter mb-8 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-dark'}`}
          >
            An Expensive Gallery
          </h1>

          <p
            className={`text-lg md:text-xl font-normal max-w-lg leading-relaxed mb-10 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-muted'}`}
          >
            Art. Priced accordingly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <button
              onClick={handleExploreClick}
              disabled={isTransitioning}
              className={`rounded-full px-8 py-3.5 text-sm font-medium hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#0F0F0F] text-white'} ${isTransitioning ? 'pointer-events-none' : ''}`}
            >
              Explore Gallery
            </button>
            <Link
              to="/collection"
              className={`text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 ${isDarkMode ? 'text-white' : 'text-[#0F0F0F]'}`}
            >
              View Collection <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryTunnel;
