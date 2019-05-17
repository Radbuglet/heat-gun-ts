export interface IPowerUpType {
    name : string
    color : string,
    time : number
}

export enum PowerUpTypes {
    instant_health,
    quad_damage,
    bullet_phase,
    invisibility
}

export const power_up_types : Map<PowerUpTypes, IPowerUpType> = new Map();
power_up_types.set(PowerUpTypes.instant_health, {
    name: "Instant Health",
    color: "#eb1414",
    time: 1
});

power_up_types.set(PowerUpTypes.quad_damage, {
    name: "Double Damage",
    color: "#3e1c69",
    time: 40
});

power_up_types.set(PowerUpTypes.bullet_phase, {
    name: "Bullet Phase",
    color: "#000",
    time: 40
});

power_up_types.set(PowerUpTypes.invisibility, {
    name: "Invisibility",
    color: "#8afbff",
    time: 40
});