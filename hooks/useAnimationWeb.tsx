import { useEffect, useRef } from "react";
import * as THREE from "three";

interface AnimationWebProps {
    textureUrl: string
}

export default function useAnimationWeb({ textureUrl }: AnimationWebProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            container.offsetWidth / container.offsetHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true, // Needed for capturing the rendered frame
        });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const loader = new THREE.TextureLoader();
        loader.load(
            textureUrl,
            (texture) => {
                createParticles(texture, scene);
            },
            undefined,
            (error) => {
                console.error("Texture loading failed:", error);
            }
        );

        function createParticles(texture: THREE.Texture, scene: THREE.Scene) {
            const geometry = new THREE.BufferGeometry();
            const particlesCount = 20000;
            const positions = new Float32Array(particlesCount * 3);

            for (let i = 0; i < particlesCount; i++) {
                positions[i * 3 + 0] = (Math.random() - 0.5) * 10; // X
                positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // Y
                positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // Z
            }

            geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            const material = new THREE.PointsMaterial({
                size: 0.05,
                map: texture,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);
            particlesRef.current = particles;
        }

        function animate() {
            requestAnimationFrame(animate);
            if (particlesRef.current) {
                particlesRef.current.rotation.y += 0.001; // Rotate particles
            }
            renderer.render(scene, camera);
        }
        animate();

        const handleResize = () => {
            if (!container) return;
            const width = container.offsetWidth;
            const height = container.offsetHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            renderer.dispose();
            if (particlesRef.current) {
                scene.remove(particlesRef.current);
            }
        };
    }, [textureUrl]);

    return { containerRef };
}
