export interface path {
    points: { x: number; y: number }[];
    color: string;
    size: number;
}

export interface drawParams {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    past: path[];
}

export interface historyParams {
    deepFuture: { future: path[] };
    past: path[];
    drawParams: drawParams;
}

export const undo = ({ deepFuture, past, drawParams }: historyParams) => {
    // remove the last path from the paths array
    if (past.length === 0) return console.log("Nothing to undo");
    deepFuture.future.push(past[past.length - 1]);
    past.splice(-1, 1);
    // draw all the paths in the paths array
    drawPaths(drawParams);
};

export const redo = ({ deepFuture, past, drawParams }: historyParams) => {
    // remove the last path from the paths array
    const future = deepFuture.future;
    console.log(future, "redo future");
    console.log(past, "redo past");
    if (future.length === 0) return console.log("Nothing to redo");
    past.push(future[future.length - 1]);
    future.splice(-1, 1);
    // draw all the paths in the paths array
    drawPaths(drawParams);
};

export const drawPaths = ({ ctx, canvas, past }: drawParams) => {
    const oldColor = ctx.strokeStyle;
    const oldSize = ctx.lineWidth;
    // delete everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw all the paths in the paths array
    past.forEach((path) => {
        if (!path || !path.points) {
            console.log(
                "path is undefined | Likely user tries to undo/redo a non-existent path"
            );
            return;
        }

        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size;
        console.log(path);
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
    });
    ctx.strokeStyle = oldColor;
    ctx.lineWidth = oldSize;
};
