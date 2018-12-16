import { Rect } from "../helpers-common/helpers/Rect";
import Vector from "../helpers-common/helpers/Vector";

export enum Layers {
  obj = "obj",
  dec = "dec"
}

export enum OneWayDirections {
  negative_x = 0,
  positive_x = 1,
  negative_y = 2,
  positive_y = 3
}

export interface ITile {
  x: number
  y: number
  w: number
  h: number

  rect? : Rect

  color: string
  layer: Layers

  bullet_phased?: boolean
  bouncy?: boolean
  reflective?: boolean
  toggleable?: boolean
  force_original_color? : boolean
  one_way?: OneWayDirections

  visgroup?: string

  absolute_tile_index?: number
}

export class MapLoader {
  private map : ITile[] = null;
  constructor() {

  }

  load_from_loaded_file(text : string) {
    this.map = JSON.parse(text) as unknown as ITile[];
  }

  load_from_url(url : string, cb : () => void) {
    fetch(url).then(response => {
      if (response.status !== 200) throw "Invalid response code!";

      response.json().then(map_data => {
        this.map = map_data as unknown as ITile[];
        cb();
      });
    }).catch(error => {
      throw error;
    });
  }

  get_raw_map_object() : ITile[] {
    return this.map;
  }
  
  clone_map_object() : ITile[] {
    if (this.map === null) throw "Map not loaded!";
    
    const cloned_tiles : ITile[] = [];

    this.map.forEach((tile, i) => {
        const cloned_tile = cloned_tiles[cloned_tiles.push({...tile}) - 1];
        cloned_tile.absolute_tile_index = i;
        cloned_tile.rect = new Rect(
          new Vector(cloned_tile.x, cloned_tile.y),
          new Vector(cloned_tile.w, cloned_tile.h),
        );
    });
    
    return cloned_tiles;
  }
}