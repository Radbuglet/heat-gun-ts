import { World, IBeam } from "../helpers-common/World";
import { ServerPlayer } from "./ServerPlayer";
import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { Player } from "../helpers-common/Player";
import { PacketNames } from "../config/ProtocolDefs";

export class ServerWorld extends World<ServerPlayer> {
    /*
        Replication logic
    */

    broadcast_message(message : ITextComponent[]) {
        this.players.forEach(player => player.send_message(message));
    }

    replicate_new_beam(orgin_player : Player<any>, beam : IBeam) {
        this.broadcast_packet(PacketNames.replicate_new_beam, orgin_player.uuid, beam.path.map(vec => vec.serialize()), beam.color, beam.size);
    }

    replicate_player_added() {
        this.broadcast_player_list();
    }

    replicate_player_removed() {
        this.broadcast_player_list();
    }

    replicate_everything(forceful : boolean) {
        this.players.forEach(player => player.replicate_own_state(forceful));
    }

    broadcast_player_list() {
        const player_list = {};
        
        this.players.forEach(player => {
            player_list[player.uuid] = player.name;
        });

        this.players.forEach(player => {
            player.user.send_packet(PacketNames.replicate_player_list, player.uuid, player_list);
        });
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
}