import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Interactive 3D Three.js Hero Canvas:
 * Renders floating layered glassmorphic PDF sheets, rotating wireframe polyhedra,
 * glowing accent rings, and orbiting data particles with mouse-driven parallax.
 */
export default function Hero3DScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 7.6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xc7d2fe, 0.9);
    scene.add(ambient);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 4.5, 18);
    purpleLight.position.set(-3.5, 3, 4);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 4.2, 18);
    cyanLight.position.set(3.8, -2.2, 4.2);
    scene.add(cyanLight);

    // Main Floating 3D PDF Document Group
    const docGroup = new THREE.Group();
    scene.add(docGroup);

    // Build crisp PDF page canvas texture dynamically
    const createPdfPageTexture = (variant = 0) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 680;
      const ctx = canvas.getContext('2d');

      // Card background
      const grad = ctx.createLinearGradient(0, 0, 512, 680);
      if (variant === 0) {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#131d3b');
      } else {
        grad.addColorStop(0, '#111827');
        grad.addColorStop(1, '#1e1b4b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 680);

      // Subtle border glow
      ctx.strokeStyle = variant === 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(167, 139, 250, 0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 496, 664);

      // Header bar
      const headerGrad = ctx.createLinearGradient(36, 40, 476, 110);
      headerGrad.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
      headerGrad.addColorStop(1, 'rgba(6, 182, 212, 0.35)');
      ctx.fillStyle = headerGrad;
      ctx.beginPath();
      ctx.roundRect(36, 42, 440, 74, 14);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText(variant === 0 ? 'NEXPDF PRO STUDIO' : 'EXPORT READY', 58, 88);

      // Simulated editable text blocks
      const drawBar = (x, y, w, h, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        ctx.fill();
      };

      drawBar(36, 146, 280, 18, 'rgba(226, 232, 240, 0.85)');
      drawBar(36, 178, 390, 12, 'rgba(148, 163, 184, 0.45)');
      drawBar(36, 202, 340, 12, 'rgba(148, 163, 184, 0.45)');

      // Highlighted selected editable text box
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(32, 240, 448, 96);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
      ctx.fillRect(32, 240, 448, 96);

      drawBar(52, 264, 240, 16, '#38bdf8');
      drawBar(52, 294, 380, 12, 'rgba(226, 232, 240, 0.72)');

      // Embedded chart/image card preview
      const imgGrad = ctx.createLinearGradient(36, 366, 250, 520);
      imgGrad.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
      imgGrad.addColorStop(1, 'rgba(59, 130, 246, 0.25)');
      ctx.fillStyle = imgGrad;
      ctx.beginPath();
      ctx.roundRect(36, 366, 220, 155, 14);
      ctx.fill();

      // Bars inside preview image
      drawBar(62, 460, 24, 42, '#22d3ee');
      drawBar(98, 430, 24, 72, '#8b5cf6');
      drawBar(134, 405, 24, 97, '#38bdf8');
      drawBar(170, 442, 24, 60, '#a78bfa');

      // Right column lines
      drawBar(276, 376, 196, 14, 'rgba(226, 232, 240, 0.65)');
      drawBar(276, 404, 180, 11, 'rgba(148, 163, 184, 0.42)');
      drawBar(276, 428, 190, 11, 'rgba(148, 163, 184, 0.42)');
      drawBar(276, 452, 140, 11, 'rgba(148, 163, 184, 0.42)');

      // Signature vector flourish
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(46, 605);
      ctx.bezierCurveTo(90, 560, 125, 635, 178, 588);
      ctx.bezierCurveTo(212, 558, 242, 616, 290, 594);
      ctx.stroke();

      drawBar(330, 586, 144, 34, 'rgba(139, 92, 246, 0.45)');

      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 4;
      return tex;
    };

    const frontTex = createPdfPageTexture(0);
    const backTex = createPdfPageTexture(1);

    const sheetGeo = new THREE.BoxGeometry(2.55, 3.4, 0.05);
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.25,
      metalness: 0.15,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      emissive: 0x1e1b4b,
      roughness: 0.3,
      metalness: 0.6,
    });

    const primarySheet = new THREE.Mesh(sheetGeo, [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, edgeMat]);
    primarySheet.position.set(0, 0, 0.32);
    docGroup.add(primarySheet);

    // Layered rear pages for 3D depth
    const rearMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const rearSheet1 = new THREE.Mesh(sheetGeo, [edgeMat, edgeMat, edgeMat, edgeMat, rearMat, edgeMat]);
    rearSheet1.position.set(-0.42, -0.18, -0.35);
    rearSheet1.rotation.z = 0.09;
    docGroup.add(rearSheet1);

    const rearSheet2 = new THREE.Mesh(sheetGeo, [edgeMat, edgeMat, edgeMat, edgeMat, rearMat, edgeMat]);
    rearSheet2.position.set(0.46, 0.16, -0.82);
    rearSheet2.rotation.z = -0.08;
    docGroup.add(rearSheet2);

    // Floating Geometric Polyhedra
    const wireMatCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.5 });
    const wireMatPurple = new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.45 });

    const octa = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), wireMatCyan);
    octa.position.set(-2.35, 1.35, 0.7);
    scene.add(octa);

    const icosa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 0), wireMatPurple);
    icosa.position.set(2.45, -1.15, 0.55);
    scene.add(icosa);

    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 12, 32), wireMatCyan);
    torus.position.set(2.25, 1.45, -0.2);
    scene.add(torus);

    // Glowing Orbiting Particles
    const particleCount = 90;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.045, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Mouse parallax target
    const pointer = { x: 0, y: 0 };
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animId;
    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();

      docGroup.position.y = Math.sin(t * 1.4) * 0.14;
      docGroup.rotation.y += (pointer.x * 0.42 + Math.sin(t * 0.65) * 0.16 - docGroup.rotation.y) * 0.06;
      docGroup.rotation.x += (-pointer.y * 0.25 + Math.cos(t * 0.55) * 0.06 - docGroup.rotation.x) * 0.06;

      rearSheet1.position.y = -0.18 + Math.sin(t * 1.2 + 1) * 0.08;
      rearSheet2.position.y = 0.16 + Math.cos(t * 1.1) * 0.08;

      octa.rotation.x = t * 0.5;
      octa.rotation.y = t * 0.7;
      octa.position.y = 1.35 + Math.sin(t * 1.6) * 0.15;

      icosa.rotation.x = -t * 0.4;
      icosa.rotation.y = t * 0.6;
      icosa.position.y = -1.15 + Math.cos(t * 1.4) * 0.15;

      torus.rotation.x = t * 0.8;
      torus.rotation.z = t * 0.4;

      particles.rotation.y = t * 0.04;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      frontTex.dispose();
      backTex.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-[380px] sm:h-[440px] lg:h-[500px] relative select-none" />;
}
