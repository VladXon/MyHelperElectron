import type { Server } from 'node:http';

let _server: Server | undefined;

export function setServer(srv: Server) {
  _server = srv;
}

export function getServer(): Server | undefined {
  return _server;
}
