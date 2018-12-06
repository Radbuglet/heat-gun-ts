import { readFileSync, writeFileSync } from "fs";
import { throws } from "assert";
import { ILbDBRoot } from "../helpers-common/LeaderboardScheme";

export class Leaderboard {
    private static db_location : string;
    static data : ILbDBRoot = { categories: [] };

    static load_file(db_location : string) {
        this.db_location = db_location;

        try {
            this.data = JSON.parse(readFileSync(db_location, "utf-8"));
        } catch (e) {
            console.warn("Failed to load leaderboard. Defaulting to empty and saving...\nTraceback:\n", e);
            this.save_to_active_file();
        }
    }

    static save_to_active_file() {
        try {
            writeFileSync(this.db_location, JSON.stringify(this.data, null, 2));
        } catch (e) {
            console.warn("Failed to save leaderboard db!\nTraceback:\n", e);
        }
    }

    static log_record(username : string, score : number) {
        this.data.categories.forEach(category => {
            category.scores.push({
                username, score, expire_timestamp: Date.now() + (category.lasts_for_mins * 60 * 1000)
            });
        });

        this.clean_up();
        this.save_to_active_file();
    }

    static clean_up() {
        this.data.categories.forEach(category => {
            category.scores = category.scores.filter(score => Date.now() <= score.expire_timestamp).sort((a, b) => b.score - a.score);
            category.scores = category.scores.filter((score, i) => i <= 19);
        });
    }
}