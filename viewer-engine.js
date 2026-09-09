// Minimal Three.js equirectangular panorama viewer.
// Exposes window.PanoramaEngine.mount(container, imageUrl, opts)

(function () {
  function mount(container, imageUrl, opts = {}) {
    const THREE = window.THREE;
    if (!THREE) throw new Error('Three.js not loaded');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1100);
    camera.target = new THREE.Vector3(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    const texture = loader.load(imageUrl, () => {
      if (opts.onLoad) opts.onLoad();
    }, undefined, (err) => {
      if (opts.onError) opts.onError(err);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const state = {
      lon: 0,
      lat: 0,
      isDown: false,
      downX: 0,
      downY: 0,
      downLon: 0,
      downLat: 0,
      fov: 75,
      autoRotate: false,
      autoSpeed: 0.05,
      gyro: false,
    };

    // Pointer controls
    const el = renderer.domElement;
    function onDown(e) {
      state.isDown = true;
      el.style.cursor = 'grabbing';
      const p = pt(e);
      state.downX = p.x;
      state.downY = p.y;
      state.downLon = state.lon;
      state.downLat = state.lat;
      if (e.pointerId != null) el.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!state.isDown) return;
      const p = pt(e);
      state.lon = state.downLon - (p.x - state.downX) * 0.1;
      state.lat = state.downLat + (p.y - state.downY) * 0.1;
    }
    function onUp(e) {
      state.isDown = false;
      el.style.cursor = 'grab';
    }
    function pt(e) { return { x: e.clientX, y: e.clientY }; }
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    // Wheel zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      state.fov = clamp(state.fov + e.deltaY * 0.05, 30, 100);
      camera.fov = state.fov;
      camera.updateProjectionMatrix();
    }, { passive: false });

    // Gyroscope
    let gyroHandler = null;
    function enableGyro() {
      if (state.gyro) return Promise.resolve(true);
      const start = () => {
        state.gyro = true;
        gyroHandler = (e) => {
          if (e.alpha == null) return;
          state.lon = -e.alpha;
          state.lat = clamp((e.beta || 0) - 90, -85, 85);
        };
        window.addEventListener('deviceorientation', gyroHandler);
      };
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        return DeviceOrientationEvent.requestPermission().then((res) => {
          if (res === 'granted') { start(); return true; }
          return false;
        }).catch(() => false);
      }
      start();
      return Promise.resolve(true);
    }
    function disableGyro() {
      if (!state.gyro) return;
      state.gyro = false;
      if (gyroHandler) window.removeEventListener('deviceorientation', gyroHandler);
      gyroHandler = null;
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      if (state.autoRotate && !state.isDown) state.lon += state.autoSpeed;
      state.lat = clamp(state.lat, -85, 85);
      const phi = THREE.MathUtils.degToRad(90 - state.lat);
      const theta = THREE.MathUtils.degToRad(state.lon);
      camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
      camera.target.y = 500 * Math.cos(phi);
      camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(camera.target);
      renderer.render(scene, camera);
      if (opts.onFrame) opts.onFrame({ lon: state.lon, lat: state.lat, fov: state.fov });
    }
    animate();

    return {
      state,
      setAutoRotate(v) { state.autoRotate = !!v; },
      enableGyro,
      disableGyro,
      setFov(v) { state.fov = clamp(v, 30, 100); camera.fov = state.fov; camera.updateProjectionMatrix(); },
      resetView() { state.lon = 0; state.lat = 0; state.fov = 75; camera.fov = 75; camera.updateProjectionMatrix(); },
      destroy() {
        cancelAnimationFrame(raf);
        ro.disconnect();
        disableGyro();
        renderer.dispose();
        texture.dispose();
        geometry.dispose();
        material.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      },
    };
  }

  window.PanoramaEngine = { mount };
})();
