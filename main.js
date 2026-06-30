// 3D Fluid Editorial Portfolio Engine - Sunset Gradient Theme - Nivedh J

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initThreeJS();
    initGSAPScroll();
    initTypedJS();
    initMobileMenu();
    initCard3DTilt();
});

/* =========================================================================
   1. CUSTOM INTERACTIVE CURSOR WITH LERP
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

    // Lerp animation for trailing ring
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

    // Hover scale states on buttons and cards
    const hoverables = document.querySelectorAll('a, button, .project-card, .mini-card, .early-card, .concept-tag');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (dot && ring) {
                dot.style.width = '12px';
                dot.style.height = '12px';
                ring.style.width = '52px';
                ring.style.height = '52px';
                ring.style.borderColor = '#FDA4AF'; // Peach hover color
                ring.style.background = 'rgba(253, 164, 175, 0.08)';
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
   2. THREE.JS 3D WEBGL GRAPHICS - MORPHING LIQUID GLASS BLOB
   ========================================================================= */
let scene, camera, renderer, blobMesh;
let originalPositions, positions;
let mouseX = 0, mouseY = 0;
let targetCameraY = 0;
let targetBlobX = 180; // initial right offset Y coordinate
let targetBlobY = 0;
let targetBlobZ = 0;

let currentBlobX = 180;
let currentBlobY = 0;
let currentBlobZ = 0;

let scrollSpeed = 0;
let lastScrollY = 0;

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // A. Scene & Fog Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0B071E, 0.0009);

    // B. Camera Setup
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 850;
    camera.position.y = 0;

    // C. WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0B071E, 1);
    container.appendChild(renderer.domElement);

    // D. Lighting Setup (Crucial for high-end refractive look)
    const ambientLight = new THREE.AmbientLight(0x0B071E, 1.5);
    scene.add(ambientLight);

    // Golden key light
    const keyLight = new THREE.DirectionalLight(0xFBBF24, 2.5);
    keyLight.position.set(400, 300, 300);
    scene.add(keyLight);

    // Neon pink fill light
    const fillLight = new THREE.DirectionalLight(0xEC4899, 2.0);
    fillLight.position.set(-400, -300, 300);
    scene.add(fillLight);

    // Deep purple back light for contour highlights
    const backLight = new THREE.DirectionalLight(0x8B5CF6, 2.5);
    backLight.position.set(0, 400, -300);
    scene.add(backLight);

    // E. 3D Liquid Blob Mesh
    // High subdivision sphere enables organic liquid deformation waves
    const geometry = new THREE.SphereGeometry(140, 64, 64);
    
    // Backup original coordinates for relative noise displacement math
    originalPositions = geometry.attributes.position.clone().array;
    positions = geometry.attributes.position.array;

    // Physical Glass Material (Refractive properties)
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xFDA4AF, // Peach base
        roughness: 0.1,
        metalness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.85, // Glass translucency
        thickness: 2.0,
        ior: 1.6, // Index of refraction
        specularIntensity: 1.5,
        transparent: true,
        opacity: 0.95
    });

    blobMesh = new THREE.Mesh(geometry, material);
    blobMesh.position.set(currentBlobX, currentBlobY, currentBlobZ);
    scene.add(blobMesh);

    // F. Track Mouse Position for Parallax Camera Offset
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.12;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.12;
    });

    // Ripple effect on click (distort blob temporarily)
    document.addEventListener('click', () => {
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
    });

    // G. Resizing
    window.addEventListener('resize', onWindowResize, false);

    // H. Monitor scroll velocity
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        scrollSpeed = Math.abs(currentScrollY - lastScrollY) * 0.08;
        lastScrollY = currentScrollY;
    });

    // I. Start Rendering Loop
    let timeState = 0;
    animate();

    function animate() {
        requestAnimationFrame(animate);
        
        // 1. Increment animation time (faster when scrolling)
        const speedMultiplier = 1.0 + scrollSpeed;
        timeState += 0.015 * speedMultiplier;
        
        // Decay scroll speed factor slowly back to 0
        scrollSpeed *= 0.92;

        // 2. Animate and deform the sphere geometry (trigonometric CPU shader)
        const vertexCount = positions.length / 3;
        
        const frequency = 0.008 + (scrollSpeed * 0.005);
        const amplitude = 12 + (scrollSpeed * 8);

        for (let i = 0; i < vertexCount; i++) {
            const x = originalPositions[i * 3];
            const y = originalPositions[i * 3 + 1];
            const z = originalPositions[i * 3 + 2];

            // Normalize coordinate vector to get normal
            const len = Math.sqrt(x*x + y*y + z*z);
            const nx = x / len;
            const ny = y / len;
            const nz = z / len;

            // Generate organic wave offsets using 3D trigonometric noise
            const wave = Math.sin(x * frequency + timeState * 1.5) * 
                         Math.cos(y * frequency + timeState * 1.2) * 
                         Math.sin(z * frequency + timeState * 1.7);

            const displacement = wave * amplitude;

            // Displace coordinates along normal
            positions[i * 3] = x + nx * displacement;
            positions[i * 3 + 1] = y + ny * displacement;
            positions[i * 3 + 2] = z + nz * displacement;
        }

        // Notify WebGL that coordinates changed
        blobMesh.geometry.attributes.position.needsUpdate = true;
        blobMesh.geometry.computeVertexNormals();

        // 3. Slow core rotations
        blobMesh.rotation.y += 0.005;
        blobMesh.rotation.x += 0.002;

        // 4. Smoothly lerp Blob Positions based Y/X target overrides
        currentBlobX += (targetBlobX - currentBlobX) * 0.08;
        currentBlobY += (targetBlobY - currentBlobY) * 0.08;
        currentBlobZ += (targetBlobZ - currentBlobZ) * 0.08;
        blobMesh.position.set(currentBlobX, currentBlobY, currentBlobZ);

        // 5. Parallax camera follow mouse position (smooth lerp)
        camera.position.x += (mouseX - camera.position.x) * 0.04;
        const targetY = targetCameraY + (-mouseY - camera.position.y) * 0.04;
        camera.position.y += (targetY - camera.position.y) * 0.04;
        
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        renderer.render(scene, camera);
    }
}

// Resizing Handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Adjust layout offsets on small viewports
    if (window.innerWidth < 1024) {
        targetBlobX = 0;
        targetBlobY = 160;
    } else {
        targetBlobX = 180;
        targetBlobY = 0;
    }
}

/* =========================================================================
   3. GSAP SCROLLTRIGGER - 3D FLUID SCROLL CAMERA & BLOB ROUTING
   ========================================================================= */
function initGSAPScroll() {
    gsap.registerPlugin(ScrollTrigger);

    // Initial position adjustment for screen size
    if (window.innerWidth < 1024) {
        targetBlobX = 0;
        targetBlobY = 160;
    }

    // Scroll path timeline triggers
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: 'main',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5
        }
    });

    // Animate camera depth and base scale properties
    tl
        // Hero to About: Zoom camera and pull blob to the left
        .to(camera.position, {
            z: 700,
            duration: 2,
            ease: "none"
        }, 0)

        // About to Skills: Move blob to the right side
        .to(camera.position, {
            z: 800,
            duration: 2,
            ease: "none"
        }, 2)

        // Skills to Projects: Push blob back into center and stretch scale
        .to(camera.position, {
            z: 900,
            duration: 2,
            ease: "none"
        }, 4)

        // Projects to Education: Zoom in
        .to(camera.position, {
            z: 750,
            duration: 2,
            ease: "none"
        }, 6)

        // Education to Contact: Center and float upwards
        .to(camera.position, {
            z: 800,
            duration: 2,
            ease: "none"
        }, 8);

    // Trigger listeners to update target offsets Y & X based on scroll sections
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
            targetCameraY = -100;
            if (window.innerWidth >= 1024) {
                targetBlobX = -200;
                targetBlobY = -80;
                targetBlobZ = 100;
            } else {
                targetBlobX = 0;
                targetBlobY = -220;
            }
        },
        onEnterBack: () => {
            targetCameraY = -100;
            if (window.innerWidth >= 1024) {
                targetBlobX = -200;
                targetBlobY = -80;
                targetBlobZ = 100;
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
                targetBlobY = 80;
                targetBlobZ = 50;
            } else {
                targetBlobX = 0;
                targetBlobY = 240;
            }
        },
        onEnterBack: () => {
            targetCameraY = 100;
            if (window.innerWidth >= 1024) {
                targetBlobX = 220;
                targetBlobY = 80;
                targetBlobZ = 50;
            } else {
                targetBlobX = 0;
                targetBlobY = 240;
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
                targetBlobZ = -50;
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
                targetBlobZ = -50;
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
                targetBlobY = -200;
                targetBlobZ = 50;
            } else {
                targetBlobX = 0;
                targetBlobY = -280;
            }
            // Activate timeline connectors
            document.querySelectorAll('.timeline-item').forEach(el => el.classList.add('active'));
        },
        onEnterBack: () => {
            targetCameraY = 200;
            if (window.innerWidth >= 1024) {
                targetBlobX = 0;
                targetBlobY = -200;
                targetBlobZ = 50;
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
            targetBlobY = 180;
            targetBlobZ = 120;
        },
        onEnterBack: () => {
            targetCameraY = 0;
            targetBlobX = 0;
            targetBlobY = 180;
            targetBlobZ = 120;
        }
    });

    // Content entry fade triggers
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

    // Back to top behavior
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
   4. TYPED.JS EFFECT
   ========================================================================= */
function initTypedJS() {
    const target = document.getElementById('typed-text');
    if (!target) return;

    new Typed('#typed-text', {
        strings: [
            'Data Scientist',
            'Automated Pipeline Builder',
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
   5. MOBILE VIEW NAVIGATION MENU
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
   6. 3D GLOW CARD TILT EFFECT (PARALLAX HOVER)
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
