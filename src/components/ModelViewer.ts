import * as THREE from 'three';
import {TransformControls} from 'three/examples/jsm/controls/TransformControls.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {defineComponent, markRaw} from 'vue';

const DEG_2_RAD = 1 / 180 * Math.PI;
const RAD_2_DEG = 1 / Math.PI * 180;
const ZOOM_MAX = 20;
const FPS = 30;

export default defineComponent({
    props: {
        width: {
            type: Number,
            default: 420
        },
        height: {
            type: Number,
            default: 420
        },
        preferSize: {
            type: Number,
            default: 6.5
        },
        zoom: {
            type: Number,
            default: 0
        },
        rotateX: {
            type: Number,
            default: 0
        },
        rotateY: {
            type: Number,
            default: 0
        },
        rotateZ: {
            type: Number,
            default: 0
        },
        clearColor: {
            type: Number,
            default: 0xf1f3f4
        },
        modelUrl: String,
        gizmo: {
            type: Boolean,
            default: true,
        },
    },
    emits: ['update:rotateX', 'update:rotateY', 'update:rotateZ', 'update:zoom'],
    data() {
        return {
            loading: false,
            dragging: false,
            dragStartX: 0,
            dragStartY: 0,
            renderer: null as THREE.WebGLRenderer | null,
            scene: null as THREE.Scene | null,
            camera: null as THREE.Camera | null,
            loader: null as OBJLoader | null,
            model: null as THREE.Group | null,
            control: null as TransformControls | null,
            helper: null as THREE.Object3D | null,
            intervalId: 0,
        };
    },
    watch: {
        modelUrl() {
            this.loadModel();
        },
        rotateX() {
            this.applyRotation();
        },
        rotateY() {
            this.applyRotation();
        },
        rotateZ() {
            this.applyRotation();
        },
        zoom(val) {
            if (this.camera) {
                this.camera.position.z = ZOOM_MAX - val;
            }
        },
        gizmo(val) {
            if (this.control) {
                this.control.enabled = val;
            }
            if (this.helper) {
                this.helper.visible = val;
            }
        }
    },
    mounted(): void {
        (window as any).modelViewer = this;
        const renderer = this.renderer = markRaw(new THREE.WebGLRenderer({
            canvas: this.$refs.canvas as HTMLCanvasElement
        }));
        renderer.setClearColor(this.clearColor);

        const scene = this.scene = markRaw(new THREE.Scene());

        const camera = this.camera = markRaw(new THREE.PerspectiveCamera(45, this.width / this.height));
        camera.position.set(0, 0, ZOOM_MAX - this.zoom);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(camera);

        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 5, 5);
        scene.add(light);

        const control = this.control = markRaw(new TransformControls(camera, this.$refs.canvas as HTMLElement));
        control.setSpace('local');
        control.setMode('rotate');
        control.setSize(2);
        control.enabled = this.gizmo;
        control.addEventListener('dragging-changed', () => {
            const model = this.model;
            if (model) {
                this.$emit('update:rotateX', Math.round(model.rotation.x * RAD_2_DEG));
                this.$emit('update:rotateY', Math.round(model.rotation.y * RAD_2_DEG));
                this.$emit('update:rotateZ', Math.round(model.rotation.z * RAD_2_DEG));
            }
        });
        // three r160+: TransformControls is no longer an Object3D; add its helper.
        const helper = this.helper = markRaw(control.getHelper());
        helper.visible = this.gizmo;
        scene.add(helper);

        this.intervalId = window.setInterval(this.render, 1000 / FPS);
        window.addEventListener('mouseup', this.dragStop);
        window.addEventListener('touchend', this.dragStop);

        this.loader = markRaw(new OBJLoader());
        if (this.modelUrl) {
            this.loadModel();
        }
    },
    beforeUnmount(): void {
        clearInterval(this.intervalId);
        window.removeEventListener('mouseup', this.dragStop);
        window.removeEventListener('touchend', this.dragStop);
    },
    methods: {
        applyRotation() {
            if (this.control?.dragging) {
                return;
            }
            if (this.model) {
                this.model.rotation.setFromVector3(
                    new THREE.Vector3(
                        this.rotateX * DEG_2_RAD,
                        this.rotateY * DEG_2_RAD,
                        this.rotateZ * DEG_2_RAD
                    ));
            }
        },
        loadOBJ(url: string): Promise<THREE.Group> {
            return new Promise((resolve, reject) => {
                if (!this.loader) {
                    throw new Error('Not initialized');
                }
                this.loader.load(
                    url,
                    resolve,
                    undefined,
                    reject
                );
            });
        },
        async loadModel() {
            const url = this.modelUrl;
            if (!url) {
                return;
            }
            try {
                this.loading = true;
                const group = markRaw(await this.loadOBJ(url));

                // remove existed
                if (this.model) {
                    this.control!.detach();
                    this.scene!.remove(this.model);
                    this.model = null;
                }

                // double side material
                group.traverse((obj) => {
                    if (obj instanceof THREE.Mesh) {
                        const material = (obj as THREE.Mesh).material;
                        if (material instanceof THREE.Material) {
                            material.side = THREE.DoubleSide;
                        } else {
                            material.forEach(material => {
                                material.side = THREE.DoubleSide;
                            });
                        }
                    }
                });

                const mesh = group.children[0];

                // resize
                const size = new THREE.Vector3();
                new THREE.Box3().setFromObject(group).getSize(size);
                const scale = this.preferSize / Math.max(size.x, size.y, size.z);
                mesh.scale.set(scale, scale, scale);

                // center
                const center = new THREE.Vector3();
                new THREE.Box3().setFromObject(group).getCenter(center);
                mesh.position.set(-center.x, -center.y, -center.z);

                group.rotation.set(this.rotateX * DEG_2_RAD, this.rotateY * DEG_2_RAD, this.rotateZ * DEG_2_RAD);

                this.model = group;
                this.scene!.add(group);

                this.control!.attach(group);
            } finally {
                this.loading = false;
            }
        },
        render() {
            this.renderer!.render(this.scene!, this.camera!);
        },
        dragStart(e: any) {
            if (this.gizmo) {
                return;
            }
            this.dragging = true;
            this.dragStartX = e.clientX || e.touches && e.touches[0].clientX;
            this.dragStartY = e.clientY || e.touches && e.touches[0].clientY;
        },
        dragStop() {
            this.dragging = false;
        },
        dragMove(e: any) {
            if (!this.dragging) {
                return;
            }
            const x0 = this.dragStartX,
                y0 = this.dragStartY,
                x1 = e.clientX || e.touches && e.touches[0].clientX,
                y1 = e.clientY || e.touches && e.touches[0].clientY,
                dx = x1 - x0,
                dy = y1 - y0;
            let rotateX = this.rotateX,
                rotateY = this.rotateY;
            this.dragStartX = x1;
            this.dragStartY = y1;
            rotateX += dy;
            if (rotateX < -180) {
                rotateX += 360;
            } else if (rotateX > 180) {
                rotateX -= 360;
            }
            rotateY += dx;
            if (rotateY < -180) {
                rotateY += 360;
            } else if (rotateY > 180) {
                rotateY -= 360;
            }
            this.$emit('update:rotateX', rotateX | 0);
            this.$emit('update:rotateY', rotateY | 0);
        },
        mouseWheel(e: WheelEvent) {
            const delta = Math.max(-1, Math.min(1, -e.deltaY));
            this.$emit('update:zoom', Math.min(ZOOM_MAX, Math.max(0, this.zoom + delta)));
        }
    }
});
