import { World, IBeam } from "../helpers-common/World";
import { ServerPlayer } from "./ServerPlayer";
import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { PacketNames } from "../helpers-common/ProtocolDefs";
import { IUpdate } from "../helpers-common/helpers/IUpdate";
import Vector from "../helpers-common/helpers/Vector";
import { ServerWeapon } from "./ServerWeapon";
import { ServerPowerUpCrystal } from "./ServerPowerUpCrystal";

export class ServerWorld extends World<ServerWorld, ServerPlayer, ServerWeapon, ServerPowerUpCrystal> {
    /*
        Replication logic
    */

    broadcast_message(message : ITextComponent[]) {
        this.wrapped_queue_packets(() => {
            super.broadcast_message(message);
        });
    }

    replicate_everything(forceful : boolean) {
        this.wrapped_queue_packets(() => {
            this.players.forEach(player => player.replicate_own_state(forceful));
        });
        this.broadcast_crystal_data();
    }

    broadcast_player_list() {
        this.wrapped_queue_packets(() => {
            const player_list = {};
            
            this.players.forEach(player => {
                player_list[player.uuid] = player.name;
            });

            this.players.forEach(player => {
                player.user.send_packet(PacketNames.replicate_player_list, player.uuid, player_list);
            });
        });
    }

    broadcast_crystal_data() {
        const crystal_list = {};

        Array.from(this.powerup_crystals.values()).forEach(crystal => {
            crystal_list[crystal.uuid] = crystal.serialize();
        });

        this.players.forEach(player => {
            player.user.send_packet(PacketNames.replicate_crystal_list, crystal_list);
        });
    }

    add_player(player : ServerPlayer) {
        super.add_player(player);

        this.wrapped_queue_packets(() => {
            this.broadcast_player_list();
            this.replicate_everything(false);
        });
   }

    remove_player(player: ServerPlayer) {
        super.remove_player(player);
        
        this.wrapped_queue_packets(() => {
            this.broadcast_player_list();
            this.replicate_everything(false);
        });
    }

    add_crystal(crystal : ServerPowerUpCrystal) {
        super.add_crystal(crystal);
        this.broadcast_crystal_data();
    }

    remove_crystal(crystal) {
        super.remove_crystal(crystal);
        this.broadcast_crystal_data();
    }

    update(update_evt: IUpdate) {
        this.queue_all_players_packets();
        super.update(update_evt);
        this.unqueue_all_players_packets();
    }

    add_gun_beams(origin_player : ServerPlayer, path : Vector[], size : number, color : string) : IBeam {
        const new_beam = super.add_gun_beams(origin_player, path, size, color);
        
        this.broadcast_packet(PacketNames.replicate_new_beam,
            origin_player.uuid,
            new_beam.path.map(vec => vec.serialize()),
            new_beam.color,
            new_beam.size
        );

        return new_beam;
    }

    /*
        Helpers
    */
    wrapped_queue_packets(func) {
        this.queue_all_players_packets();
        func();
        this.unqueue_all_players_packets();
    }

    queue_all_players_packets() {
        this.players.forEach(player => player.user.queue_packets());
    }

    unqueue_all_players_packets() {
        this.players.forEach(player => player.user.unqueue_packets());
    }

    broadcast_packet(evtname : PacketNames, ...args) {
        this.players.forEach(player => player.user.send_packet(evtname, ...args));
    }

    /*
        Etc
    */
   crystal_factory() {
       return new ServerPowerUpCrystal(this);
   }
}