const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");
// const { rgba } = require("canvas-sketch-util/color");
const random = require("canvas-sketch-util/random");
const rangeFloor = require("canvas-sketch-util/random").rangeFloor;
const palettes = require("nice-color-palettes");

random.setSeed(random.getRandomSeed());
const settings = {
  suffix: random.getSeed(),
  dimensions: [2048, 2048],
  // pixelsPerInch: 300,
  // units: "cm",
};

console.log(random.getSeed());

const sketch = () => {
  const colorCount = random.rangeFloor(2, 6);
  // const randomPaletteIndex = rangeFloor(0, palettes.length);
  // console.log(randomPaletteIndex);
  const palette = random.shuffle(random.pick(palettes)).slice(0, colorCount);
  const createGrid = () => {
    const points = [];
    const count = 60;
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        if (random.value() > 0.5) {
          const u = count <= 1 ? 0.5 : x / (count - 1);
          const v = count <= 1 ? 0.5 : y / (count - 1);
          const size = Math.abs(random.noise2D(u, v)) * 0.0001 * x * y;
          points.push({
            color: random.pick(palette),
            size: size,
            rotation: random.noise2D(u, v, 0.8),
            position: [u, v],
          });
        }
      }
    }
    return points;
  };

  // random.setSeed(512);
  const points = createGrid();
  const margin = 400;

  return ({ context, width, height }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    points.forEach(({ size, position, color, rotation }) => {
      const x = lerp(margin, width - margin, position[0]);
      const y = lerp(margin, height - margin, position[1]);
      // context.beginPath();
      // context.arc(
      //   random.gaussian(x),
      //   random.gaussian(y),
      //   size * width,
      //   0,
      //   Math.PI * 2,
      //   false
      // );
      context.save();
      context.fillStyle = color;
      context.font = `${size * 2 * width}px "Arial"`;
      context.translate(x, y);
      context.rotate(rotation);
      context.fillText("_", 0, 0);

      context.restore();
    });
  };
};

canvasSketch(sketch, settings);
