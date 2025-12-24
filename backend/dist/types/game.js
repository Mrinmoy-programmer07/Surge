"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueStatus = exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING_FOR_READY"] = "waiting_for_ready";
    GameStatus["IN_PROGRESS"] = "in_progress";
    GameStatus["PAUSED"] = "paused";
    GameStatus["FINISHED"] = "finished";
    GameStatus["CANCELLED"] = "cancelled";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["WAITING"] = "WAITING";
    QueueStatus["MATCHED"] = "MATCHED";
    QueueStatus["CANCELLED"] = "CANCELLED";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
