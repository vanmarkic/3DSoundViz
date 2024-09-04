global.THREE = require("three");

const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const palettes = require("nice-color-palettes");
const p5 = require("p5");

const settings = {
  animate: true,
  dimensions: [1024, 1280],
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true },
  // p5: { p5 },
};

const sketch = async ({ context, width, height }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context,
  });

  // WebGL background color
  renderer.setClearColor("hsl(0, 0%, 95%)", 1);

  // Setup a camera, we will update its settings on resize
  const camera = new THREE.OrthographicCamera();

  // Setup your scene
  const scene = new THREE.Scene();

  // Get a palette for our scene
  const palette = random.pick(palettes);

  // Snap 0..1 point to a -1..1 grid
  const grid = (n, gridSize) => {
    const max = gridSize - 1;
    const snapped = Math.round(n * max) / max;
    return snapped * 2 - 1;
  };

  // Randomize mesh attributes
  const randomizeMesh = (mesh) => {
    const gridSize = random.rangeFloor(3, 11);
    // Choose a random grid point in a 3D volume between -1..1
    const point = new THREE.Vector3(
      grid(random.value(), gridSize),
      grid(random.value(), gridSize),
      grid(random.value(), gridSize)
    );

    // Stretch it vertically
    point.y *= 2;
    // Scale all the points closer together
    point.multiplyScalar(0.5);

    // Save position
    mesh.position.copy(point);
    mesh.originalPosition = mesh.position.clone();

    // Choose a color for the mesh material
    mesh.material.color.set(random.pick(palette));

    // Randomly scale each axis
    mesh.scale.set(random.gaussian(), random.gaussian(), random.gaussian());

    // Do more random scaling on each axis
    if (random.chance(0.5)) mesh.scale.x *= random.gaussian();
    if (random.chance(0.5)) mesh.scale.y *= random.gaussian();
    if (random.chance(0.5)) mesh.scale.z *= random.gaussian();

    // Further scale each object
    mesh.scale.multiplyScalar(random.gaussian() * 0.25);
  };

  // A group that will hold all of our cubes
  const container = new THREE.Group();

  // Re-use the same Geometry across all our cubes
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  // The # of cubes to create
  const chunks = 32;

  // Create each cube and return a THREE.Mesh
  const meshes = Array.from(new Array(chunks)).map((_, index) => {
    // Basic "unlit" material with no depth
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.5,
      roughness: 1,
      color: random.pick(palette),
    });

    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Randomize it
    randomizeMesh(mesh);

    return mesh;
  });

  // Add meshes to the group
  meshes.forEach((m) => container.add(m));

  // Then add the group to the scene
  scene.add(container);

  // Add a harsh light to the scene
  // Add a soft light to the scene
  const light = new THREE.HemisphereLight("white", "gray", 1);
  light.position.set(100, 100, 2000);
  scene.add(light);

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  console.log(stream);

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const realAudioInput = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);

  analyser.fftSize = chunks * 2;
  const bufferLength = analyser.frequencyBinCount;
  const timeDomainData = new Uint8Array(bufferLength);
  const frequencyData = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(timeDomainData);
  analyser.getByteFrequencyData(frequencyData);

  analyser.smoothingTimeConstant = 0.9;

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);

      // Setup an isometric perspective
      const aspect = viewportWidth / viewportHeight;
      const zoom = 1.85;
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;
      camera.near = -100;
      camera.far = 100;
      camera.position.set(zoom, zoom, zoom);
      camera.lookAt(new THREE.Vector3());

      // Update camera properties
      camera.updateProjectionMatrix();
    },

    // And render events here
    render({ time }) {
      // console.log(frequencyData);
      // Animate each mesh with noise
      analyser.getByteFrequencyData(frequencyData);

      meshes.forEach((mesh, index) => {
        const f = 0.1;
        // mesh.scale.set(
        //   frequencyData[index] / 64,
        //   frequencyData[index] / 64,
        //   frequencyData[index] / 64
        // );
        mesh.position.x =
          mesh.originalPosition.x +
          (frequencyData[index] / 128) *
            random.noise3D(
              (mesh.originalPosition.x * f * frequencyData[index]) / 128,
              (mesh.originalPosition.y * f * frequencyData[index]) / 128,
              (mesh.originalPosition.z * f * frequencyData[index]) / 128,
              time * 2
            );
      });

      // Draw scene with our camera
      renderer.render(scene, camera);
    },
    // Dispose of WebGL context (optional)
    unload() {
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
