declare module 'ws' {
  import { EventEmitter } from 'events';
  import { Duplex } from 'stream';
  import { Server as HTTPServer } from 'http';
  import { Server as HTTPSServer } from 'https';
  import { IncomingMessage } from 'http';

  class WebSocket extends EventEmitter {
    static CONNECTING: 0;
    static OPEN: 1;
    static CLOSING: 2;
    static CLOSED: 3;

    binaryType: string;
    bufferedAmount: number;
    extensions: string;
    protocol: string;
    readyState: number;
    url: string;

    CONNECTING: 0;
    OPEN: 1;
    CLOSING: 2;
    CLOSED: 3;

    onopen: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
    onmessage: ((event: any) => void) | null;

    constructor(address: string | URL, options?: WebSocket.ClientOptions);
    constructor(address: string | URL, protocols?: string | string[], options?: WebSocket.ClientOptions);

    close(code?: number, reason?: string): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(data: any, options: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }, cb?: (err?: Error) => void): void;
    terminate(code?: number, reason?: string): void;
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    dispatchEvent(event: any): boolean;
  }

  namespace WebSocket {
    interface ClientOptions {
      agent?: any;
      auth?: string;
      headers?: { [key: string]: string };
      host?: string;
      localAddress?: string;
      maxPayload?: number;
      origin?: string;
      password?: string;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      protocol?: string | string[];
      protocolVersion?: number;
      rejectUnauthorized?: boolean;
      ca?: string | Buffer | Array<string | Buffer>;
      cert?: string | Buffer | Array<string | Buffer>;
      ciphers?: string;
      key?: string | Buffer | Array<string | Buffer>;
      passphrase?: string;
      pfx?: string | Buffer | Array<string | Buffer>;
      servername?: string | string[];
      secureProtocol?: string;
      skipUTF8Validation?: boolean;
    }

    interface PerMessageDeflateOptions {
      serverNoContextTakeover?: boolean;
      clientNoContextTakeover?: boolean;
      serverMaxWindowBits?: number;
      clientMaxWindowBits?: number;
      threshold?: number;
      concurrencyLimit?: number;
    }

    interface ServerOptions {
      host?: string;
      port?: number;
      backlog?: number;
      server?: HTTPServer | HTTPSServer;
      verifyClient?: (info: { origin: string; secure: boolean; req: IncomingMessage }) => boolean;
      handleProtocols?: (protocols: string[], request: IncomingMessage) => string | false;
      path?: string;
      noServer?: boolean;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      maxPayload?: number;
      skipUTF8Validation?: boolean;
    }

    class Server extends EventEmitter {
      options: ServerOptions;
      path: string;
      clients: Set<WebSocket>;

      constructor(options?: ServerOptions, callback?: () => void);
      constructor(port?: number, options?: ServerOptions, callback?: () => void);

      address(): { address: string; family: string; port: number } | undefined;
      close(cb?: (err?: Error) => void): void;
      handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, cb: (ws: WebSocket, request: IncomingMessage) => void): void;
      shouldHandle(request: IncomingMessage): boolean | Promise<boolean>;

      on(event: 'connection', cb: (ws: WebSocket, request: IncomingMessage) => void): this;
      on(event: 'error', cb: (error: Error) => void): this;
      on(event: 'listening', cb: () => void): this;
      on(event: string, cb: (...args: any[]) => void): this;
    }
  }

  export = WebSocket;
}
