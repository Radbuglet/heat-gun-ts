import Vector from "../../helpers-common/helpers/Vector";
import { Rect } from "../../helpers-common/helpers/Rect";
import { GameWorld } from "./GameWorld";

export function render_tablist(app : GameWorld, ping : number) {
    app.draw(ctx => { // UI
        app.draw(() => {
            const tablist_rect = new Rect(
                new Vector(0, 0),
                new Vector(app.getWidth(), app.getHeight())
            ).get_percent_margin_rect(0.1);
    
            app.draw(() => {
                app.draw(() => {
                    ctx.fillStyle = "#000";
                    ctx.globalAlpha = 0.75;
                    ctx.fillRect(tablist_rect.get_x(), tablist_rect.get_y(), tablist_rect.get_width(), tablist_rect.get_height());
                });
    
                /*
                this.draw(() => {
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = "#000";
                    ctx.strokeRect(tablist_rect.get_tl_x(), tablist_rect.get_tl_y(), tablist_rect.get_width(), tablist_rect.get_height());
                });
                */
            });
    
            app.draw(() => {
                const tablist_interior = tablist_rect.get_percent_margin_rect(0.1);
                const leaderboard = new Array(...app.world.players.values()).sort((a, b) => b.energy - a.energy);
                let your_place = leaderboard.indexOf(app.local_player) + 1;
                let drawing_y_level = tablist_interior.get_y();
    
                app.draw(() => {
                    ctx.font = "30px monospace";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#fff";
    
                    app.draw(() => {
                        let drawing_x_level = tablist_interior.get_x();
                        app.draw(() => {
                            app.draw(() => {
                                ctx.font = "40px monospace";
                                ctx.shadowBlur = 10;
                                ctx.shadowColor = "red";
                                ctx.fillStyle = "red";
                                ctx.fillText(your_place.toString(), drawing_x_level, drawing_y_level);
                                drawing_x_level += ctx.measureText(your_place.toString()).width;
                            });
                            
                            app.draw(() => {
                                ctx.font = "30px monospace";
                                ctx.fillText("th place", drawing_x_level, drawing_y_level);
                                drawing_x_level += ctx.measureText("th place").width;
                            });
                        });
    
                        app.draw(() => {
                            drawing_x_level += 50;
                            ctx.font = "50px monospace";
                            ctx.fillText("/", drawing_x_level, drawing_y_level);
                            drawing_x_level += ctx.measureText("/").width;
                            drawing_x_level += 50;
                        });
    
                        app.draw(() => {
                            app.draw(() => {
                                ctx.font = "30px monospace";
                                ctx.fillStyle = "red";
                                ctx.fillText(app.world.players.size.toString(), drawing_x_level, drawing_y_level);
                                drawing_x_level += ctx.measureText(app.world.players.size.toString()).width;
                            });
                            
                            app.draw(() => {
                                ctx.font = "25px monospace";
                                ctx.fillText(" online", drawing_x_level, drawing_y_level);
                                drawing_x_level += ctx.measureText(" online").width;
                            });
                        });
                    });
    
                    app.draw(() => {
                        let drawing_x_level = tablist_interior.point_top_right().getX();
                        ctx.textAlign = "right";
                        app.draw(() => {
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = "red";
                            ctx.fillStyle = "red";
    
                            ctx.fillText(ping + "ms", drawing_x_level, drawing_y_level);
                            drawing_x_level -= ctx.measureText("10ms").width;
                            drawing_x_level -= 30;
                        });
    
                        app.draw(() => {
                            ctx.shadowBlur = 5;
                            ctx.shadowColor = "#fff";
    
                            ctx.fillText(app.get_fps() + "fps", drawing_x_level, drawing_y_level);
                            drawing_x_level -= ctx.measureText(app.get_fps() + "fps").width;
                            drawing_x_level -= 30;
                        });
                    });
    
    
                    drawing_y_level += 50;
                });
    
                app.draw(() => {
                    leaderboard.forEach((player, i) => {
                        const player_rect_height = 25;
                        app.draw(() => {
                            ctx.fillStyle = "#000";
                            ctx.strokeStyle = "red";
                            ctx.globalAlpha = (i % 2 === 0 ? 0.5 : 0.3);
    
                            ctx.fillRect(tablist_interior.get_x(), drawing_y_level, tablist_interior.get_width(), player_rect_height);
                            if (player.uuid === app.local_player.uuid) {
                                ctx.globalAlpha = 1;
                                ctx.shadowColor = "red";
                                ctx.shadowBlur = 5;
                                ctx.strokeRect(tablist_interior.get_x(), drawing_y_level, tablist_interior.get_width(), player_rect_height);
                            }
                        });
    
                        app.draw(() => {
                            let draw_text_x = tablist_interior.get_x() + 10;
                            ctx.font = "15px monospace";
                            ctx.textBaseline = "middle";
                            ctx.textAlign = "left";
    
                            app.draw(() => {
                                ctx.fillStyle = "red";
                                ctx.shadowColor = "red";
                                ctx.shadowBlur = 4;
    
                                ctx.fillText((i + 1).toString(), draw_text_x, drawing_y_level + player_rect_height / 2);
                                draw_text_x += ctx.measureText((i + 1).toString()).width + 10;
                            });
    
                            app.draw(() => {
                                ctx.fillStyle = "#fff";
                                ctx.fillText(player.name, draw_text_x, drawing_y_level + player_rect_height / 2);
                            });
                        });
    
                        app.draw(() => {
                            ctx.fillStyle = "red";
                            ctx.font = "15px monospace";
                            ctx.textBaseline = "middle";
                            ctx.textAlign = "right";
                            ctx.fillText(`${player.energy} - ${player.total_energy}`, tablist_interior.point_top_right().getX() - 10, drawing_y_level + player_rect_height / 2);
                        });
    
                        drawing_y_level += player_rect_height;
                    });
                });
                
            });
        });
    });
}