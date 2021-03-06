const canvasSketch = require("canvas-sketch");
const Color = require("canvas-sketch-util/color");

const slow =
  new URLSearchParams(document.location.search.substring(1)).get("dizzy") ===
  "false";

const settings = {
  animate: true,
};

const COLOR_CHANGE_SPEED = slow ? 15 : 4; // seconds
const ELLIPSE_DURATION = slow ? 40 : 6; // seconds
const ELLIPSE_MIN_STROKE_WIDTH = 1;
const ELLIPSE_MAX_STROKE_WIDTH = 100;
const ELLIPSE_COUNT = 40;
const MIN_ELLIPSE_RATIO = slow ? 1 / 1.3 : 1 / 2;
const MAX_ELLIPSE_RATIO = slow ? 1.3 : 2;
const ELLIPSE_RATIO_CHANGE_PERIOD = 12; // seconds
const ROTATION_PERIOD = slow ? 15 : 5;
const ROTATION_STAGGERING = slow ? 1.2 : 2;
const GROWTH_BOOST_FACTOR = 0.2;
const X_CENTER_MOVE_SPEED = 8; // seconds
const Y_CENTER_MOVE_SPEED = slow ? 10 : 1.4; // seconds
const X_CENTER_MOVE_RANGE = 0.4; // [0, 1]
const Y_CENTER_MOVE_RANGE = 0.2; // [0, 1]
const BOOST_DELAY = 3; // seconds
const BOOST_TIME = 6; // seconds
const RIPPLE_FACTOR = slow ? 0.5 : 1.2;

const drawCircle = (
  context,
  width,
  height,
  progress,
  time,
  x,
  y,
  ellipseRatio
) => {
  const radius = Math.sqrt(width * width + height * height) * progress;
  const radiusBoost = 1 + GROWTH_BOOST_FACTOR * (1 - progress);

  const radiusX = radius * radiusBoost;
  const radiusY = radius * radiusBoost * ellipseRatio;
  const rotation =
    ((2 * Math.PI * time) / ROTATION_PERIOD +
      progress * ROTATION_STAGGERING * 2 * Math.PI) %
    (2 * Math.PI);

  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, rotation, 0, 2 * Math.PI);

  context.fillStyle = Color.style({
    hsl: [
      (100 + progress * 200 + (time * 360) / COLOR_CHANGE_SPEED) % 360,
      100,
      (Math.sin((time * 2) / COLOR_CHANGE_SPEED) / 2 + 0.5) * 100,
    ],
  });
  context.fill();

  context.strokeStyle = Color.style({
    hsl: [
      (20 + progress * 200 + (time * 360) / COLOR_CHANGE_SPEED) % 360,
      0 + 50 + progress * 50,
      50,
    ],
  });
  context.lineWidth =
    (ELLIPSE_MAX_STROKE_WIDTH - ELLIPSE_MIN_STROKE_WIDTH) * progress +
    ELLIPSE_MIN_STROKE_WIDTH;
  context.stroke();
};

const sketch = () => {
  return ({ context, width, height, time }) => {
    const x =
      (width / 2) *
      (1 +
        X_CENTER_MOVE_RANGE *
          Math.sin((time / X_CENTER_MOVE_SPEED) * 2 * Math.PI));

    const y =
      (height / 2) *
      (1 +
        Y_CENTER_MOVE_RANGE *
          Math.sin((time / Y_CENTER_MOVE_SPEED) * 2 * Math.PI));

    const ellipseRatio =
      (Math.sin((time * Math.PI * 2) / ELLIPSE_RATIO_CHANGE_PERIOD) / 2 + 0.5) *
        MIN_ELLIPSE_RATIO +
      (0.5 - Math.sin((time * Math.PI * 2) / ELLIPSE_RATIO_CHANGE_PERIOD) / 2) *
        MAX_ELLIPSE_RATIO;

    Array.from({ length: ELLIPSE_COUNT }, (_, i) => {
      const linearProgress =
        ((time + (i * ELLIPSE_DURATION) / ELLIPSE_COUNT) % ELLIPSE_DURATION) /
        ELLIPSE_DURATION;

      // [0, 1]. values around 0.5 have biggest effect
      const progressBoost = Math.sin(linearProgress * Math.PI);

      // [0, 1]
      const boostProgress =
        time % (BOOST_DELAY + BOOST_TIME) <= BOOST_DELAY
          ? 0
          : ((time % (BOOST_DELAY + BOOST_TIME)) - BOOST_DELAY) / BOOST_TIME;

      // 0 when values are completely different, 1 when they are the same
      const correlation = -Math.cos(
        Math.abs(progressBoost - boostProgress) * Math.PI
      );

      const boostFactor =
        (Math.sin(boostProgress * Math.PI * 2) / 2) *
        correlation *
        RIPPLE_FACTOR;
      return linearProgress * (1 + boostFactor);
    })
      .sort((a, b) => b - a)
      .forEach((progress) => {
        drawCircle(context, width, height, progress, time, x, y, ellipseRatio);
      });
  };
};

canvasSketch(sketch, settings);
