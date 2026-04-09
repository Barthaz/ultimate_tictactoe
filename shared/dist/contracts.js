"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.PROTOCOL_VERSION = void 0;
exports.PROTOCOL_VERSION = "1.0.0";
exports.SOCKET_EVENTS = {
    SERVER_INFO: "server:info",
    SESSION_CREATE: "session:create",
    SESSION_JOIN: "session:join",
    SESSION_STATE: "session:state",
    SESSION_JOINED: "session:joined",
    MOVE_PLAY: "move:play",
    GAME_ERROR: "game:error",
};
