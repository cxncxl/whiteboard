const canvas = document.getElementById('app') as HTMLCanvasElement;

if (!canvas) {
    throw new Error('No canvas');
}

const { width, height } = canvas.getBoundingClientRect();

const dpi = window.devicePixelRatio ?? 1;
canvas.width = Math.round(width * dpi);
canvas.height = Math.round(height * dpi);

const canvasPos = canvas.getBoundingClientRect();

const ctx = canvas.getContext('2d');

if (!ctx) {
    throw new Error('No canvas context');
}

ctx.imageSmoothingEnabled = false;

const state = {
    mousedown: false,
};

canvas.addEventListener('mousedown', () => state.mousedown = true);
canvas.addEventListener('mouseup', () => state.mousedown = false);

const [w, h] = [canvas.width, canvas.height];
const image = ctx.createImageData(w, h);

function update() {
    ctx?.putImageData(image, 0, 0);
}

const red: Color = [255, 0, 0, 255];

canvas.addEventListener('mousemove', (ev: MouseEvent) => {
    if (state.mousedown === false) return;

    console.log('drag', ev.x, ev.y);
    setPixel(
        ...screenCoordsToImageCoords(ev.clientX, ev.clientY), 
        red,
    );
    update();
});

function getPixel(x: number, y: number): Color {
    const r = y * (w * 4) + x * 4;
    return [
        image.data[r],     // r
        image.data[r + 1], // g
        image.data[r + 2], // b
        image.data[r + 3], // a
    ];
}

function setPixel(x: number, y: number, col: Color) {
    const r = (y * w * 4) + (x * 4);
    image.data[r] = col[0];     // r
    image.data[r + 1] = col[1]; // g
    image.data[r + 2] = col[2]; // b
    image.data[r + 3] = col[3]; // a
}

function screenCoordsToImageCoords(x: number, y: number): [number, number] {
    return [
        (x * dpi) - canvasPos.x,
        (y * dpi) - canvasPos.y,
    ];
}

/** RGBA */
type Color = [number, number, number, number];
