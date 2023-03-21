import "./style.css";
import * as history from "./history";

// DEFAULTS
const DEFAULT_COLOR = "#000000";
const DEFAULT_SIZE = 3;
const DEFAULT_STABLIZER_FACTOR = 10;

// Setup values
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

canvas.width = (window.innerWidth * 3) / 5;
canvas.height = (window.innerHeight * 3) / 5;

const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
let mouse = {
    previous: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
};
let color = DEFAULT_COLOR;
const colorPicker = document.getElementById("color-picker") as HTMLInputElement;
colorPicker.addEventListener("change", () => {
    color = colorPicker.value;
    ctx.strokeStyle = color;
});
const sizePicker = document.getElementById("size-picker") as HTMLInputElement;
sizePicker.value = `${DEFAULT_SIZE}`;
ctx.lineWidth = parseInt(sizePicker.value);
colorPicker.value = DEFAULT_COLOR;
ctx.strokeStyle = colorPicker.value;
const stabilizer = strokeStabilizer(DEFAULT_STABLIZER_FACTOR);
let isDrawing = false;
let points: history.path = { points: [], color: color, size: 0 };
let past: history.path[] = [];
let future: history.path[] = [];

sizePicker.addEventListener("change", () => {
    ctx.lineWidth = parseInt(sizePicker.value);
});

//#endregion

document.addEventListener("mousedown", (e) => {
    isDrawing = true;
    points = { points: [], color: color, size: parseInt(sizePicker.value) };
    const tempMouse = oMousePos(canvas, e);
    mouse.previous = mouse.current;
    mouse.current = { x: tempMouse.x, y: tempMouse.y };
    points.points.push({ x: mouse.current.x, y: mouse.current.y });
    future = [];
    previousPoints = [];
});

document.addEventListener("mouseup", () => {
    isDrawing = false;
    past.push(points);
});

// unstablized version
// canvas.addEventListener("mousemove", (e) => {
//     if (!isDrawing) return;
//     const tempMouse = oMousePos(canvas, e);
//     mouse.previous = mouse.current;
//     mouse.current = { x: tempMouse.x, y: tempMouse.y };
//     points.points.push({ x: mouse.current.x, y: mouse.current.y });
//     ctx.beginPath();
//     ctx.moveTo(mouse.previous.x, mouse.previous.y);
//     ctx.lineTo(mouse.current.x, mouse.current.y);
//     ctx.stroke();
// });

//#region stabilizer

let previousPoints: { x: number; y: number }[] = [];
function strokeStabilizer(factor: number) {
    let lastPoint: any;

    function calculateSmoothPoint() {
        const pointCount = previousPoints.length;
        const lastThreePoints = previousPoints.slice(
            pointCount - factor,
            pointCount
        );

        const pointSum = lastThreePoints.reduce(
            (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
            { x: 0, y: 0 }
        );

        const smoothPoint = {
            x: pointSum.x / factor,
            y: pointSum.y / factor,
        };

        return smoothPoint;
    }

    return function (x: number, y: number) {
        previousPoints.push({ x: x, y: y });

        while (previousPoints.length < factor - 1) {
            previousPoints.unshift({ x: x, y: y });
        }

        if (previousPoints.length < factor) {
            lastPoint = { x: x, y: y };
            return lastPoint;
        }

        const smoothPoint = calculateSmoothPoint();

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(smoothPoint.x, smoothPoint.y);
        ctx.stroke();

        lastPoint = smoothPoint;
        // previousPoints = [previousPoints[1], previousPoints[2], smoothPoint];
        previousPoints.slice(1, previousPoints.length);
        previousPoints.push(smoothPoint);

        return lastPoint;
    };
}

canvas.addEventListener(
    "mousemove",
    (e) => {
        if (!isDrawing) return;
        const tempMouse = oMousePos(canvas, e);
        const smoothPoint = stabilizer(tempMouse.x, tempMouse.y);
        points.points.push({ x: smoothPoint.x, y: smoothPoint.y });
    },
    { passive: true, capture: true }
);

//#endregion

function oMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    var ClientRect = canvas.getBoundingClientRect();
    return {
        x: Math.round(evt.clientX - ClientRect.left),
        y: Math.round(evt.clientY - ClientRect.top),
    };
}

document.addEventListener("keydown", (e) => {
    if (e.key === "z" && e.ctrlKey) {
        history.undo({
            deepFuture: { future },
            past,
            drawParams: { ctx, canvas, past },
        });
    }
    if (e.key === "y" && e.ctrlKey) {
        history.redo({
            deepFuture: { future },
            past,
            drawParams: { ctx, canvas, past },
        });
    }
});
