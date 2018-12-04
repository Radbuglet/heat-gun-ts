import { CanvasApplicationInterface } from "../../helpers-client/CanvasApplication";

// I might have copied the effect from cave story's main menu...

export class CloudHorizon {
    private cloud_layers: CloudLayer[];

    constructor(app: CanvasApplicationInterface) {
        this.cloud_layers = [
            new CloudLayer(app, 0, 12, "#aaf"),
            new CloudLayer(app, 50, 10, "#eaf"),
            new CloudLayer(app, 100, 6, "#fff"),
            new CloudLayer(app, 200, 2, "#eee")
        ];
        this.cloud_layers.reverse();
    }

    draw() {
        this.cloud_layers.forEach(layer => {
            layer.draw();
        });
    }
}

class CloudLayer {
    private scroll_x: number = 0;
    private seg_spacing: number = 50;
    private cloud_seg_heights: number[] = new Array(100).fill(0).map(_ => Math.random() * 100);
    constructor(private app: CanvasApplicationInterface, private min_ypos: number, private scroll_speed: number, private color: string) {}

    get_seg_xpos(seg_index) {
        return this.scroll_x + this.seg_spacing * seg_index;
    }

    draw() {
        this.app.draw(ctx => {
            const height = this.app.getHeight();

            ctx.fillStyle = this.color;

            ctx.beginPath();
            ctx.moveTo(this.get_seg_xpos(0), height);

            this.cloud_seg_heights.forEach((seg_height, seg_index) => {
                ctx.lineTo(this.get_seg_xpos(seg_index), height - this.min_ypos - seg_height);
            });

            ctx.lineTo(this.get_seg_xpos(this.cloud_seg_heights.length - 1), height);
            ctx.lineTo(this.get_seg_xpos(0), height);

            ctx.fill();

            this.scroll_x -= this.scroll_speed;

            if (this.get_seg_xpos(0) < -100) {
                this.cloud_seg_heights.shift();
                this.cloud_seg_heights.push(Math.random() * 100);
                this.scroll_x += this.seg_spacing;
            }
        });
    }
}