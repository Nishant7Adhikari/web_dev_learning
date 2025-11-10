// js/pathRenderer.js

const pathRenderer = {
  // Core Three.js components
  scene: null, camera: null, renderer: null, controls: null, container: null,
  raycaster: new THREE.Raycaster(),
  
  // Scene objects
  currentPath: null, gridHelper: null, carModel: null,
  imageBillboards: [], // NEW: Changed from imageSprites
  onSpriteClick: null,

  // Animation state
  clock: new THREE.Clock(),
  isPreviewing: false,
  isAnimationPaused: false,
  isCameraLocked: true,
  animationProgress: 0,
  animationSpeed: 1,
  currentCurve: null,

  init(config, onSpriteClickCallback) {
    this.container = document.getElementById("map-container");
    if (!this.container) return;
    this.onSpriteClick = onSpriteClickCallback;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.renderer.backgroundColor);
    this.scene.fog = new THREE.Fog(config.renderer.backgroundColor, 100, 20000);

    this.camera = new THREE.PerspectiveCamera(config.renderer.camera.fov, 1, config.renderer.camera.nearPlane, config.renderer.camera.farPlane);
    this.camera.position.set(0, 50, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 200, 100);
    this.scene.add(directionalLight);
    
    this.animationSpeed = config.animation.defaultSpeed;
    this.loadCarModel();
    this.animate();

    window.addEventListener("resize", () => this.onResize());
    this.container.addEventListener('click', (e) => this.onCanvasClick(e), false);
  },

  onCanvasClick(event) {
      if (!this.imageBillboards.length) return; // Use new array
      const rect = this.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.imageBillboards); // Intersect with billboards

      if (intersects.length > 0) {
          const nodeId = intersects[0].object.userData.nodeId;
          if (this.onSpriteClick) { this.onSpriteClick(nodeId); }
      }
  },

  loadCarModel() {
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/car.glb', (gltf) => {
        this.carModel = gltf.scene;
        this.carModel.scale.set(1.5, 1.5, 1.5);
      }, undefined, (error) => {
        console.error('An error happened while loading the car model.', error);
      }
    );
  },
  
  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const { clientWidth, clientHeight } = this.container;
    if (clientWidth === 0 || clientHeight === 0) return;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  },

  gpsToWorld(point) {
    const earthRadius = 6371e3;
    const latRad = point.latitude * (Math.PI / 180);
    const lonRad = point.longitude * (Math.PI / 180);
    const x = lonRad * earthRadius;
    const z = -(latRad * earthRadius);
    const y = point.altitude || 0;
    return new THREE.Vector3(x, y, z);
  },

  clearScene() {
    if (this.currentPath) {
      this.scene.remove(this.currentPath);
      this.currentPath.geometry.dispose();
      this.currentPath.material.dispose();
      this.currentPath = null;
      this.currentCurve = null;
    }
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.dispose();
      this.gridHelper = null;
    }
    // NEW: Dispose of billboards correctly
    this.imageBillboards.forEach(billboard => {
      if (billboard.material.map) billboard.material.map.dispose();
      billboard.material.dispose();
      billboard.geometry.dispose();
      this.scene.remove(billboard);
    });
    this.imageBillboards = [];
  },

  renderPath(nodes, isLive = false) {
    this.clearScene();
    if (!nodes || nodes.length < 2) return;

    const worldPoints = nodes.map(p => this.gpsToWorld(p));
    const boundingBox = new THREE.Box3().setFromPoints(worldPoints);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const localPoints = worldPoints.map(p => p.clone().sub(center));

    this.currentCurve = new THREE.CatmullRomCurve3(localPoints, false, 'catmullrom', 0.5);
    const curvePoints = this.currentCurve.getPoints(Math.max(2, nodes.length * 10));

    // Solid Road Geometry
    const roadShape = new THREE.Shape();
    const halfWidth = config.renderer.path.width / 2;
    roadShape.moveTo(-halfWidth, 0);
    roadShape.lineTo(halfWidth, 0);

    const extrudeSettings = {
        steps: curvePoints.length * 2,
        bevelEnabled: false,
        extrudePath: this.currentCurve,
        depth: config.renderer.path.height
    };
    const geometry = new THREE.ExtrudeGeometry(roadShape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({ color: config.renderer.path.color, side: THREE.DoubleSide });
    this.currentPath = new THREE.Mesh(geometry, material);
    this.scene.add(this.currentPath);

    // --- NEW: Image Billboards using PlaneGeometry ---
    const textureLoader = new THREE.TextureLoader();
    const up = new THREE.Vector3(0, 1, 0);

    nodes.forEach((node, index) => {
        if (node.imageBlob) {
            const imageUrl = URL.createObjectURL(node.imageBlob);
            textureLoader.load(imageUrl, (texture) => {
                URL.revokeObjectURL(imageUrl); // Clean up memory

                const billboardHeight = config.renderer.path.width * 2; // Make billboards large
                const aspect = texture.image ? texture.image.width / texture.image.height : 1;
                const billboardWidth = billboardHeight * aspect;

                const billboardGeo = new THREE.PlaneGeometry(billboardWidth, billboardHeight);
                const billboardMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
                const billboard = new THREE.Mesh(billboardGeo, billboardMat);

                const pos = localPoints[index];
                const tangent = this.currentCurve.getTangentAt(index / (nodes.length - 1)).normalize();
                const binormal = new THREE.Vector3().crossVectors(up, tangent).normalize();

                // Position billboard to the side of the road
                const offsetDistance = config.renderer.path.width; // Push it out
                const offsetVector = binormal.multiplyScalar(offsetDistance);
                
                billboard.position.copy(pos).add(offsetVector);
                // Position billboard on top of the ground, next to road
                billboard.position.y += (billboardHeight / 2) + config.renderer.path.height;

                billboard.userData.nodeId = node.id;
                this.scene.add(billboard);
                this.imageBillboards.push(billboard);
            });
        }
    });

    // Grid
    const pathSizeVec = boundingBox.getSize(new THREE.Vector3());
    const largestDim = Math.max(pathSizeVec.x, pathSizeVec.z);
    const gridSize = Math.pow(10, Math.ceil(Math.log10(largestDim || 1))) * 2;
    this.gridHelper = new THREE.GridHelper(gridSize, 20);
    this.gridHelper.position.y = Math.min(...localPoints.map(p => p.y)) - 0.5;
    this.scene.add(this.gridHelper);

    if (!isLive) this.resetCamera();
},

  resetCamera() {
    this.controls.enabled = true;
    if (!this.currentPath) {
        this.camera.position.set(0, 50, 100);
        this.controls.target.set(0, 0, 0);
    } else {
        const boundingBox = new THREE.Box3().setFromObject(this.currentPath);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 1.5 / Math.tan(fov / 2));
        cameraZ = Math.max(cameraZ, 50);
        this.camera.position.set(center.x, center.y + maxDim, center.z + cameraZ);
        this.controls.target.copy(center);
    }
    this.controls.update();
  },

  startPreview() {
    if (this.isPreviewing || !this.currentCurve || !this.carModel) return false;
    this.isPreviewing = true;
    this.isAnimationPaused = false;
    this.animationProgress = 0;
    this.isCameraLocked = true;
    this.controls.enabled = true;
    this.scene.add(this.carModel);
    return true;
  },

  stopPreview() {
    if (!this.isPreviewing) return;
    this.isPreviewing = false;
    this.controls.enabled = true;
    if (this.carModel) { this.scene.remove(this.carModel); }
    this.resetCamera();
  },

  togglePauseAnimation() {
    if (!this.isPreviewing) return;
    this.isAnimationPaused = !this.isAnimationPaused;
    document.getElementById('anim-play-pause-btn').textContent = this.isAnimationPaused ? 'Play' : 'Pause';
  },
  
  toggleCameraLock() {
      if (!this.isPreviewing) return;
      this.isCameraLocked = !this.isCameraLocked;
      return this.isCameraLocked;
  },

  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  },

  updateAnimation(deltaTime) {
    if (!this.isPreviewing || this.isAnimationPaused || !this.carModel) return;
    const curveLength = this.currentCurve.getLength();
    if (curveLength === 0) return;
    
    this.animationProgress += (50 * this.animationSpeed * deltaTime) / curveLength;
    if (this.animationProgress >= 1) { this.animationProgress = 0; /* loop */ }
    
    const carPosition = this.currentCurve.getPointAt(this.animationProgress);
    this.carModel.position.copy(carPosition);
    this.carModel.position.y += config.renderer.path.height / 2; // Sit on top of road

    const tangent = this.currentCurve.getTangentAt(this.animationProgress).normalize();
    const lookAtPosition = new THREE.Vector3().copy(carPosition).add(tangent);
    
    this.carModel.up.set(0, 1, 0);
    this.carModel.lookAt(lookAtPosition);

    if (this.isCameraLocked) {
        const offset = new THREE.Vector3(0, 20, -30);
        offset.applyQuaternion(this.carModel.quaternion);
        this.camera.position.copy(carPosition).add(offset);
        this.camera.lookAt(carPosition);
    }
  },

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const deltaTime = this.clock.getDelta();
    
    if (!this.isPreviewing || (this.isPreviewing && !this.isCameraLocked)) {
      this.controls.update();
    }
    
    if (this.isPreviewing) { this.updateAnimation(deltaTime); }

    // NEW: Make billboards always face the camera
    this.imageBillboards.forEach(billboard => {
        billboard.quaternion.copy(this.camera.quaternion);
    });

    this.renderer.render(this.scene, this.camera);
  },
};