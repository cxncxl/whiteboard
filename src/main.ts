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

const Colors: Record<string, Color> = {
    red: [255, 0, 0, 255],
}

const state = {
    mousedown: false,
    activeColor: Colors.red,
    brsushRadius: 8,
    lastDrawnPixel: undefined as [number, number] | undefined,
};

canvas.addEventListener('mousedown', (ev: MouseEvent) => {
    state.mousedown = true;
});
canvas.addEventListener('mouseup', () => {
    state.mousedown = false;
    state.lastDrawnPixel = undefined;
});

const [w, h] = [canvas.width, canvas.height];
const image = ctx.createImageData(w, h);

async function update() {
    ctx?.putImageData(image, 0, 0);
}

canvas.addEventListener('mousemove', async (ev: MouseEvent) => {
    if (state.mousedown === false) return;

    if (!state.lastDrawnPixel) {
        drawCircle(
            ...screenCoordsToImageCoords(ev.clientX, ev.clientY), 
            state.brsushRadius,
        );
    } else {
        drawLine(
            ...state.lastDrawnPixel,
            ...screenCoordsToImageCoords(ev.clientX, ev.clientY), 
            state.brsushRadius,
        );
    }

    state.lastDrawnPixel = screenCoordsToImageCoords(
        ev.clientX, ev.clientY,
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

function drawLine(
    fromX: number, fromY: number,
    toX: number, toY: number,
    radius: number,
) {
    const _deltaX = Math.abs(toX - fromX);
    const _deltaY = Math.abs(toY - fromY);

    // by default X is the main axis
    // but if we're drawing a vertical line
    // deltaX becomes close to zero so loop wile fromX < toX doesn't work anymore
    // then main axis is one with the biggest (non-zero) delta
    /** from MAIN axis */
    let fromM = fromX;
    /** from SECONDARY axis */
    let fromS = fromY;
    /** to MAIN axis */
    let toM = toX;
    /** to SECONDARY axis */
    let toS = toY;
    let mainAxisX = true;

    // threshold should not be 1 for diagonal strokes to work properly
    // otherwise it will frequently change between horizontal and vertical
    // logic and thus draw crap
    // 1.1 - 1.5 works good
    if ((_deltaY / _deltaX) > AXIS_DETECT_THRESHOLD) {
        fromM = fromY;
        fromS = fromX;
        toM = toY;
        toS = toX;
        mainAxisX = false;
    }

    if (toM < fromM) {
        const [bufM, bufS] = [fromM, fromS];
        fromM = toM; fromS = toS;
        toM = bufM; toS = bufS;
    }

    const deltaM = toM - fromM;
    const deltaS = toS - fromS;

    const ds = deltaS / deltaM;
    const dm = 1;

    while (true) {
        if (
            Math.abs(fromM - toM) <= 1
        ) {
            break;
        }

        fromM += dm;
        fromS += Math.floor(ds * dm);

        drawCircle(
            // if deltaX > deltaY then X is the main axis, else it is secondary 
            mainAxisX ? fromM : fromS,
            mainAxisX ? fromS : fromM,
            radius,
        );
    }
}

function drawCircle(xc: number, yc: number, r: number) {
    const circle = (xc: number, yc: number, x: number, y: number) => {
        setPixel(xc+x, yc+y, state.activeColor);
        setPixel(xc-x, yc+y, state.activeColor);
        setPixel(xc+x, yc-y, state.activeColor);
        setPixel(xc-x, yc-y, state.activeColor);
        setPixel(xc+y, yc+x, state.activeColor);
        setPixel(xc-y, yc+x, state.activeColor);
        setPixel(xc+y, yc-x, state.activeColor);
        setPixel(xc-y, yc-x, state.activeColor);
    }

    while (r > 0) {
        let x = 0;
        let y = r;
        let d = 3 - 2 * r;

        circle(xc, yc, x, y);

        while (y >= x) {
            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }

            x++;
            circle(xc, yc, x, y);
        }

        r--;
    }
}

/** RGBA */
type Color = [number, number, number, number];

type Vector = {
    x: number
    y: number
}

const AXIS_DETECT_THRESHOLD = 1.1;
