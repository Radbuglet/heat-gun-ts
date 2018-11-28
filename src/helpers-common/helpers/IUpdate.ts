import { ExecMode } from "./RunPlatform";

export interface IUpdate {
    delta: number
    ticks: number
    total_ms : number
    total_ticks : number
    exec_mode: ExecMode
}