import { ITile } from "./MapLoader";
import { Rect } from "./helpers/Rect";
import Vector from "./helpers/Vector";
import { TPZONE_TOP, TPZONE_BOTTOM } from "../config/Config";

export interface ISlice {
    container_rect : Rect
    tiles : ITile[]
}

export class MapChunker {
    private slices : ISlice[] = [];

    constructor(tiles : ITile[], start_x : number, end_x : number, slice_count : number) {
        const current_slice_rect = Rect.from_positions(new Vector(start_x, TPZONE_TOP), new Vector(end_x, TPZONE_BOTTOM)).clone_and_perform(rect => {
            rect.size.mutdiv(new Vector(slice_count, 1));
        });

        for (let x = 0; x < slice_count; x++) {
            const filtered_tiles = tiles.filter(tile => current_slice_rect.testcollision(tile.rect));

            this.slices.push({
                container_rect: current_slice_rect.clone(),
                tiles: filtered_tiles
            });

            current_slice_rect.top_left.mutadd(new Vector(current_slice_rect.get_width(), 0));
        }
    }

    get_tiles_in_rect(rect : Rect) : ITile[] {
        const tiles = [];
        const tile_indices_pushed = new Map();
        this.slices.filter(slice => slice.container_rect.testcollision(rect)).forEach(slice => {
            slice.tiles.forEach(tile => {
                if (tile.rect.testcollision(rect) && !tile_indices_pushed.has(tile.absolute_tile_index)) {
                    tiles.push(tile);
                    tile_indices_pushed.set(tile.absolute_tile_index, true);
                }
            });
        });

        return tiles;
    }
}