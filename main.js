// 3D/4D Hybrid WebGL Portfolio Engine - Fluid Sunset Theme - Nivedh J
// Desktop (>= 1024px) -> Morphing 3D Glass Blob (Refractive, Organic, Smooth)
// Mobile (< 1024px) -> Rotating 4D Tesseract (Perspective Projected, Interactive)

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initThreeJS();
    initGSAPScroll();
    initTypedJS();
    initMobileMenu();
    initCard3DTilt();
});

/* =========================================================================
   1. CUSTOM CURSOR
   ========================================================================= */
function initCursor() {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    
    let mouse = { x: 0, y: 0 };
    let ringPos = { x: 0, y: 0 };
    
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        if (dot) {
            dot.style.left = `${mouse.x}px`;
            dot.style.top = `${mouse.y}px`;
        }
    });

    function updateRing() {
        const ease = 0.12;
        ringPos.x += (mouse.x - ringPos.x) * ease;
        ringPos.y += (mouse.y - ringPos.y) * ease;
        
        if (ring) {
            ring.style.left = `${ringPos.x}px`;
            ring.style.top = `${ringPos.y}px`;
        }
        
        requestAnimationFrame(updateRing);
    }
    updateRing();

    const hoverables = document.querySelectorAll('a, button, .project-card, .mini-card, .early-card, .concept-tag');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (dot && ring) {
                dot.style.width = '10px';
                dot.style.height = '10px';
                ring.style.width = '48px';
                ring.style.height = '48px';
                ring.style.borderColor = '#FDA4AF'; // Peach hover
                ring.style.background = 'rgba(253, 164, 175, 0.06)';
            }
        });
        el.addEventListener('mouseleave', () => {
            if (dot && ring) {
                dot.style.width = '8px';
                dot.style.height = '8px';
                ring.style.width = '32px';
                ring.style.height = '32px';
                ring.style.borderColor = 'rgba(253, 164, 175, 0.4)';
                ring.style.background = 'none';
            }
        });
    });
}

/* =========================================================================
   2. THREE.JS DUAL-MODE WEBGL SCENE STATE MACHINE
   ========================================================================= */
let scene, camera, renderer, ambientLight, keyLight, fillLight, backLight;
let currentMode = ""; // "3D" (Blob) or "4D" (Tesseract)

// Mouse Parallax
let mouseX = 0, mouseY = 0;
let targetCameraY = 0;
let targetBlobX = 180;
let targetBlobY = 0;
let targetBlobZ = 0;

let currentBlobX = 180;
let currentBlobY = 0;
let currentBlobZ = 0;

let scrollSpeed = 0;
let lastScrollY = 0;

// A. 3D GLob state values
let blobMesh;
let originalBlobPositions, blobPositions;

// B. 4D Tesseract state values
let vertexMeshes = [];
let tesseractLines;
let edges = [];
let projected3D = [];
let original4D = [];
let explosionLerp = 0.0;
let explosionDirections = [];
let projectionDistance = 2.0; // W-axis depth projection factor 'd'

// 4D vertex coordinates
const vertices4D = [
    [-1, -1, -1, -1], [ 1, -1, -1, -1], [ 1,  1, -1, -1], [-1,  1, -1, -1],
    [-1, -1,  1, -1], [ 1, -1,  1, -1], [ 1,  1,  1, -1], [-1,  1,  1, -1],
    [-1, -1, -1,  1], [ 1, -1, -1,  1], [ 1,  1, -1,  1], [-1,  1, -1,  1],
    [-1, -1,  1,  1], [ 1, -1,  1,  1], [ 1,  1,  1,  1], [-1,  1,  1,  1]
];

// 4D Rotation operations
function rotateXY(v, theta) {
    const cos = Math.cos(theta), sin = Math.sin(theta);
    const x = v[0] * cos - v[1] * sin;
    const y = v[0] * sin + v[1] * cos;
    return [x, y, v[2], v[3]];
}

function rotateZW(v, theta) {
    const cos = Math.cos(theta), sin = Math.sin(theta);
    const z = v[2] * cos - v[3] * sin;
    const w = v[2] * sin + v[3] * cos;
    return [v[0], v[1], z, w];
}

function rotateXW(v, theta) {
    const cos = Math.cos(theta), sin = Math.sin(theta);
    const x = v[0] * cos - v[3] * sin;
    const w = v[0] * sin + v[3] * cos;
    return [x, v[1], v[2], w];
}

function rotateYW(v, theta) {
    const cos = Math.cos(theta), sin = Math.sin(theta);
    const y = v[1] * cos - v[3] * sin;
    const w = v[1] * sin + v[3] * cos;
    return [v[0], y, v[2], w];
}

// Perspective project coordinates from 4D to 3D space
function project4D(v, d) {
    const x = v[0], y = v[1], z = v[2], w = v[3];
    const f = 1.0 / (d - w);
    const sizeMultiplier = 160;
    return new THREE.Vector3(x * f * sizeMultiplier, y * f * sizeMultiplier, z * f * sizeMultiplier);
}

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Core Scene, Fog, Camera
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0C061A, 0.0009);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 850;

    // 2. WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0C061A, 1);
    container.appendChild(renderer.domElement);

    // 3. Ambient and Spotlight Rigging (Fluid Sunset highlights)
    ambientLight = new THREE.AmbientLight(0x0C061A, 1.8);
    scene.add(ambientLight);

    // Golden spotlight
    keyLight = new THREE.DirectionalLight(0xFBBF24, 2.5);
    keyLight.position.set(400, 300, 300);
    scene.add(keyLight);

    // Neon pink/peach fill
    fillLight = new THREE.DirectionalLight(0xEC4899, 2.0);
    fillLight.position.set(-400, -300, 300);
    scene.add(fillLight);

    // Purple highlight contours
    backLight = new THREE.DirectionalLight(0x8B5CF6, 2.5);
    backLight.position.set(0, 400, -300);
    scene.add(backLight);

    // 4. Initialize active rendering mesh based on viewport width
    determineAndInitMode();

    // 5. Parallax mouse tracking
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.12;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.12;
    });

    // 6. Generic Click Trigger
    document.addEventListener('click', () => {
        if (currentMode === "3D" && blobMesh) {
            // Blob squish stretch morph
            gsap.to(blobMesh.scale, {
                x: 1.15, y: 0.85, z: 1.15,
                duration: 0.25,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(blobMesh.scale, {
                        x: 1, y: 1, z: 1,
                        duration: 0.75,
                        ease: "elastic.out(1, 0.3)"
                    });
                }
            });
        } else if (currentMode === "4D") {
            // Tesseract quantum explosion
            explosionLerp = 1.0;
            gsap.to(camera.position, {
                z: camera.position.z - 40,
                duration: 0.15,
                yoyo: true,
                repeat: 1
            });
        }
    });

    // 7. Scroll velocity monitor
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        scrollSpeed = Math.abs(currentScrollY - lastScrollY) * 0.08;
        lastScrollY = currentScrollY;
    });

    // 8. Dynamic window resize listener
    window.addEventListener('resize', onWindowResize, false);

    // 9. Master Frame Render Loop
    let time = 0;
    animate();

    function animate() {
        requestAnimationFrame(animate);

        scrollSpeed *= 0.92;
        const timeFactor = 0.015 * (1.0 + scrollSpeed);
        time += timeFactor;

        // Mode-Specific Update Math
        if (currentMode === "3D" && blobMesh) {
            update3DBlob(time);
        } else if (currentMode === "4D") {
            update4DTesseract(time);
        }

        // Shared Camera and Position Easing
        currentBlobX += (targetBlobX - currentBlobX) * 0.08;
        currentBlobY += (targetBlobY - currentBlobY) * 0.08;
        currentBlobZ += (targetBlobZ - currentBlobZ) * 0.08;

        if (currentMode === "3D" && blobMesh) {
            blobMesh.position.set(currentBlobX, currentBlobY, currentBlobZ);
        }

        camera.position.x += (mouseX - camera.position.x) * 0.04;
        const targetY = targetCameraY + (-mouseY - camera.position.y) * 0.04;
        camera.position.y += (targetY - camera.position.y) * 0.04;

        camera.lookAt(new THREE.Vector3(0, 0, 0));

        renderer.render(scene, camera);
    }
}

/* =========================================================================
   3. WEBGL MODE MANAGER - INITIALIZATION, DESTRUCTION, RESIZING
   ========================================================================= */
function determineAndInitMode() {
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
        init4DTesseractMode();
    } else {
        init3DBlobMode();
    }
}

// A. Initialize 3D Glass Blob Mesh (Desktop)
function init3DBlobMode() {
    currentMode = "3D";
    
    // Set desktop offsets
    targetBlobX = 180;
    targetBlobY = 0;
    targetBlobZ = 0;

    const geometry = new THREE.SphereGeometry(140, 64, 64);
    originalBlobPositions = geometry.attributes.position.clone().array;
    blobPositions = geometry.attributes.position.array;

    // Luxury Glass Material
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xFDA4AF, // Peach base glow
        roughness: 0.1,
        metalness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.85,
        thickness: 2.0,
        ior: 1.6,
        specularIntensity: 1.5,
        transparent: true,
        opacity: 0.95
    });

    blobMesh = new THREE.Mesh(geometry, material);
    blobMesh.position.set(currentBlobX, currentBlobY, currentBlobZ);
    scene.add(blobMesh);
}

// B. Initialize 4D Tesseract lines and vertex points (Mobile)
function init4DTesseractMode() {
    currentMode = "4D";

    // Set mobile offsets (floating centered Y-coordinates)
    targetBlobX = 0;
    targetBlobY = 160;
    targetBlobZ = 0;

    original4D = [];
    projected3D = [];
    edges = [];
    explosionDirections = [];
    vertexMeshes = [];

    // Precompute edge index pairing
    for (let i = 0; i < 16; i++) {
        original4D.push(vertices4D[i]);
        projected3D.push(new THREE.Vector3());

        explosionDirections.push(new THREE.Vector3(
            -1 + Math.random() * 2,
            -1 + Math.random() * 2,
            -1 + Math.random() * 2
        ).normalize().multiplyScalar(200)); // drift velocity limit

        for (let j = i + 1; j < 16; j++) {
            let diffCount = 0;
            for (let k = 0; k < 4; k++) {
                if (vertices4D[i][k] !== vertices4D[j][k]) diffCount++;
            }
            if (diffCount === 1) {
                edges.push([i, j]);
            }
        }
    }

    // Vertex points spheres
    const sphereGeometry = new THREE.SphereGeometry(6, 12, 12);
    const vertexMaterial = new THREE.MeshStandardMaterial({
        color: 0xF59E0B, // Emissive Gold
        metalness: 0.8,
        roughness: 0.1,
        emissive: 0xF59E0B,
        emissiveIntensity: 0.5
    });

    for (let i = 0; i < 16; i++) {
        const mesh = new THREE.Mesh(sphereGeometry, vertexMaterial);
        scene.add(mesh);
        vertexMeshes.push(mesh);
    }

    // Line segments
    const linePositions = new Float32Array(edges.length * 2 * 3);
    const lineColors = new Float32Array(edges.length * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawAttribute));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawAttribute));

    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.85
    });

    tesseractLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(tesseractLines);
}

// C. Reclaim memory and dispose WebGL meshes
function disposeSceneObjects() {
    if (blobMesh) {
        scene.remove(blobMesh);
        if (blobMesh.geometry) blobMesh.geometry.dispose();
        if (blobMesh.material) blobMesh.material.dispose();
        blobMesh = null;
    }

    if (vertexMeshes.length > 0) {
        vertexMeshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        vertexMeshes = [];
    }

    if (tesseractLines) {
        scene.remove(tesseractLines);
        if (tesseractLines.geometry) tesseractLines.geometry.dispose();
        if (tesseractLines.material) tesseractLines.material.dispose();
        tesseractLines = null;
    }
}

// D. Window resize observer
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Swap models if crossing the 1024px boundary
    const isMobile = window.innerWidth < 1024;
    const shouldBeMode = isMobile ? "4D" : "3D";

    if (currentMode !== shouldBeMode) {
        disposeSceneObjects();
        if (shouldBeMode === "4D") {
            init4DTesseractMode();
        } else {
            init3DBlobMode();
        }
    } else {
        // Adjust coordinate targets in current mode
        if (isMobile) {
            targetBlobX = 0;
            targetBlobY = 160;
        } else {
            targetBlobX = 180;
            targetBlobY = 0;
        }
    }
}

/* =========================================================================
   4. ANIMATION UPDATE LOOPS (3D DEFORMATION & 4D PROJECTION MATH)
   ========================================================================= */

// A. 3D Blob organic noise math
function update3DBlob(timeState) {
    const vertexCount = blobPositions.length / 3;
    const frequency = 0.008 + (scrollSpeed * 0.005);
    const amplitude = 12 + (scrollSpeed * 8);

    for (let i = 0; i < vertexCount; i++) {
        const x = originalBlobPositions[i * 3];
        const y = originalBlobPositions[i * 3 + 1];
        const z = originalBlobPositions[i * 3 + 2];

        const len = Math.sqrt(x*x + y*y + z*z);
        const nx = x / len;
        const ny = y / len;
        const nz = z / len;

        const wave = Math.sin(x * frequency + timeState * 1.5) * 
                     Math.cos(y * frequency + timeState * 1.2) * 
                     Math.sin(z * frequency + timeState * 1.7);

        const displacement = wave * amplitude;

        blobPositions[i * 3] = x + nx * displacement;
        blobPositions[i * 3 + 1] = y + ny * displacement;
        blobPositions[i * 3 + 2] = z + nz * displacement;
    }

    blobMesh.geometry.attributes.position.needsUpdate = true;
    blobMesh.geometry.computeVertexNormals();

    blobMesh.rotation.y += 0.004;
    blobMesh.rotation.x += 0.002;
}

// B. 4D Tesseract rotation and projection calculation
function update4DTesseract(timeState) {
    if (explosionLerp > 0.001) {
        explosionLerp *= 0.94; // slow return
    } else {
        explosionLerp = 0.0;
    }

    // 4D Rotation speeds
    const theta = timeState * 0.7;
    const phi = timeState * 0.45;

    // Apply rotation matrices to 16 coordinates in 4-space
    for (let i = 0; i < 16; i++) {
        let v = original4D[i];
        
        v = rotateXY(v, theta);
        v = rotateZW(v, theta * 0.5);
        v = rotateXW(v, phi);
        v = rotateYW(v, phi * 0.7);

        // Project coordinate into 3D using W division
        const projected = project4D(v, projectionDistance);

        // Apply explosion vectors if active
        if (explosionLerp > 0) {
            const drift = explosionDirections[i];
            projected.x += drift.x * explosionLerp;
            projected.y += drift.y * explosionLerp;
            projected.z += drift.z * explosionLerp;
        }

        projected3D[i].copy(projected);
    }

    // Update spheres (vertex points) positions
    for (let i = 0; i < 16; i++) {
        vertexMeshes[i].position.set(
            projected3D[i].x + currentBlobX,
            projected3D[i].y + currentBlobY,
            projected3D[i].z + currentBlobZ
        );
    }

    // Update line segments buffers
    const linePosAttr = tesseractLines.geometry.attributes.position.array;
    const lineColAttr = tesseractLines.geometry.attributes.color.array;

    let posIndex = 0;
    let colIndex = 0;

    for (let k = 0; k < edges.length; k++) {
        const idx1 = edges[k][0];
        const idx2 = edges[k][1];

        const p1 = projected3D[idx1];
        const p2 = projected3D[idx2];

        linePosAttr[posIndex++] = p1.x + currentBlobX;
        linePosAttr[posIndex++] = p1.y + currentBlobY;
        linePosAttr[posIndex++] = p1.z + currentBlobZ;

        linePosAttr[posIndex++] = p2.x + currentBlobX;
        linePosAttr[posIndex++] = p2.y + currentBlobY;
        linePosAttr[posIndex++] = p2.z + currentBlobZ;

        // Bicolor blend: gold in foreground (positive Z), fading to purple in background
        const zAvg = (p1.z + p2.z) / 2;
        const normalizedZ = (zAvg + 130) / 260; // clamp to [0,1]
        const blend = Math.max(0.0, Math.min(1.0, normalizedZ));

        // Gold: (0.96, 0.62, 0.04)
        // Violet: (0.54, 0.36, 0.96)
        const rVal = 0.96 * blend + 0.54 * (1.0 - blend);
        const gVal = 0.62 * blend + 0.36 * (1.0 - blend);
        const bVal = 0.04 * blend + 0.96 * (1.0 - blend);

        lineColAttr[colIndex++] = rVal;
        lineColAttr[colIndex++] = gVal;
        lineColAttr[colIndex++] = bVal;

        lineColAttr[colIndex++] = rVal;
        lineColAttr[colIndex++] = gVal;
        lineColAttr[colIndex++] = bVal;
    }

    tesseractLines.geometry.attributes.position.needsUpdate = true;
    tesseractLines.geometry.attributes.color.needsUpdate = true;
}

/* =========================================================================
   5. GSAP SCROLLTRIGGER
   ========================================================================= */
function initGSAPScroll() {
    gsap.registerPlugin(ScrollTrigger);

    if (window.innerWidth < 1024) {
        targetBlobX = 0;
        targetBlobY = 160;
    }

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: 'main',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5
        }
    });

    tl
        .to(camera.position, {
            z: 700,
            duration: 2,
            ease: "none"
        }, 0)
        .to(window, {
            // Animate projection W distance variables in 4D mode dynamically
            onUpdate: () => {
                if (currentMode !== "4D") return;
                const progress = tl.progress();
                if (progress <= 0.2) {
                    projectionDistance = 2.0 - (progress / 0.2) * 0.55;
                } else if (progress <= 0.4) {
                    projectionDistance = 1.45 + ((progress - 0.2) / 0.2) * 0.4;
                } else if (progress <= 0.6) {
                    projectionDistance = 1.85 - ((progress - 0.4) / 0.2) * 0.55;
                } else if (progress <= 0.8) {
                    projectionDistance = 1.3 + ((progress - 0.6) / 0.2) * 0.45;
                } else {
                    projectionDistance = 1.75 + ((progress - 0.8) / 0.2) * 0.45;
                }
            },
            duration: 10,
            ease: "none"
        }, 0);

    // Section triggers for offsets
    ScrollTrigger.create({
        trigger: "#hero",
        start: "top center",
        onEnter: () => {
            targetCameraY = 0;
            if (window.innerWidth >= 1024) {
                targetBlobX = 180;
                targetBlobY = 0;
                targetBlobZ = 0;
            } else {
                targetBlobX = 0;
                targetBlobY = 160;
            }
        },
        onEnterBack: () => {
            targetCameraY = 0;
            if (window.innerWidth >= 1024) {
                targetBlobX = 180;
                targetBlobY = 0;
                targetBlobZ = 0;
            } else {
                targetBlobX = 0;
                targetBlobY = 160;
            }
        }
    });

    ScrollTrigger.create({
        trigger: "#about",
        start: "top center",
        onEnter: () => {
            targetCameraY = -80;
            if (window.innerWidth >= 1024) {
                targetBlobX = -200;
                targetBlobY = -80;
                targetBlobZ = 120;
            } else {
                targetBlobX = 0;
                targetBlobY = -220;
            }
        },
        onEnterBack: () => {
            targetCameraY = -80;
            if (window.innerWidth >= 1024) {
                targetBlobX = -200;
                targetBlobY = -80;
                targetBlobZ = 120;
            } else {
                targetBlobX = 0;
                targetBlobY = -220;
            }
        }
    });

    ScrollTrigger.create({
        trigger: "#skills",
        start: "top center",
        onEnter: () => {
            targetCameraY = 100;
            if (window.innerWidth >= 1024) {
                targetBlobX = 220;
                targetBlobY = 60;
                targetBlobZ = 60;
            } else {
                targetBlobX = 0;
                targetBlobY = 220;
            }
        },
        onEnterBack: () => {
            targetCameraY = 100;
            if (window.innerWidth >= 1024) {
                targetBlobX = 220;
                targetBlobY = 60;
                targetBlobZ = 60;
            } else {
                targetBlobX = 0;
                targetBlobY = 220;
            }
        }
    });

    ScrollTrigger.create({
        trigger: "#projects",
        start: "top center",
        onEnter: () => {
            targetCameraY = -120;
            if (window.innerWidth >= 1024) {
                targetBlobX = -250;
                targetBlobY = 0;
                targetBlobZ = -60;
            } else {
                targetBlobX = 0;
                targetBlobY = -250;
            }
        },
        onEnterBack: () => {
            targetCameraY = -120;
            if (window.innerWidth >= 1024) {
                targetBlobX = -250;
                targetBlobY = 0;
                targetBlobZ = -60;
            } else {
                targetBlobX = 0;
                targetBlobY = -250;
            }
        }
    });

    ScrollTrigger.create({
        trigger: "#education",
        start: "top center",
        onEnter: () => {
            targetCameraY = 200;
            if (window.innerWidth >= 1024) {
                targetBlobX = 0;
                targetBlobY = -220;
                targetBlobZ = 40;
            } else {
                targetBlobX = 0;
                targetBlobY = -280;
            }
            document.querySelectorAll('.timeline-item').forEach(el => el.classList.add('active'));
        },
        onEnterBack: () => {
            targetCameraY = 200;
            if (window.innerWidth >= 1024) {
                targetBlobX = 0;
                targetBlobY = -220;
                targetBlobZ = 40;
            } else {
                targetBlobX = 0;
                targetBlobY = -280;
            }
        }
    });

    ScrollTrigger.create({
        trigger: "#contact",
        start: "top center",
        onEnter: () => {
            targetCameraY = 0;
            targetBlobX = 0;
            targetBlobY = 160;
            targetBlobZ = 120;
        },
        onEnterBack: () => {
            targetCameraY = 0;
            targetBlobX = 0;
            targetBlobY = 160;
            targetBlobZ = 120;
        }
    });

    // Scroll reveal triggers
    const fadeElements = document.querySelectorAll(
        '.hero-content, .hero-widget, .section-header, .about-photo-wrapper, ' +
        '.about-details, .skills-grid, .project-card, .mini-card, .early-card, ' +
        '.timeline, .contact-badge, .contact-title, .contact-box, .contact-buttons'
    );
    
    fadeElements.forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            onEnter: () => el.classList.add('visible'),
            once: true
        });
    });

    // Back to top visibility
    const btt = document.getElementById('back-to-top');
    if (btt) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                btt.classList.add('active');
            } else {
                btt.classList.remove('active');
            }
        });
        
        btt.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/* =========================================================================
   6. TYPED.JS Subtitles
   ========================================================================= */
function initTypedJS() {
    const target = document.getElementById('typed-text');
    if (!target) return;

    new Typed('#typed-text', {
        strings: [
            'Data Scientist',
            'Analytical Pipeline Developer',
            'Exploratory Analyst',
            'Power BI Specialist',
            'Python Engineer'
        ],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 2000,
        loop: true,
        cursorChar: '_'
    });
}

/* =========================================================================
   7. MOBILE VIEW NAVIGATION MENU
   ========================================================================= */
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu-container');
    const links = document.querySelectorAll('.mobile-link');

    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        menu.classList.toggle('active');
        btn.querySelector('i').classList.toggle('fa-bars');
        btn.querySelector('i').classList.toggle('fa-xmark');
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            btn.querySelector('i').classList.add('fa-bars');
            btn.querySelector('i').classList.remove('fa-xmark');
        });
    });
}

/* =========================================================================
   8. 3D GLOW CARD TILT EFFECT (PARALLAX HOVER)
   ========================================================================= */
function initCard3DTilt() {
    const cards = document.querySelectorAll('.glass-card-3d, .project-card, .mini-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (centerY - y) / 15;
            const rotateY = (x - centerX) / 15;
            
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
}
