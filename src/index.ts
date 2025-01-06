import { REPLServer } from "node:repl";
import { stdin as input, stdout } from "process";
import { Readable, Writable, PassThrough } from "stream";

class ProxiedInputStream extends PassThrough {
  private active: boolean = false;

  constructor(private sourceStream: Readable) {
    super();
    this.sourceStream = sourceStream;

    // Proxy data only when active
    this.sourceStream.on("data", (chunk) => {
      if (this.active) {
        this.push(chunk);
      }
    });

    this.sourceStream.on("end", () => {
      if (this.active) {
        this.push(null);
      }
    });
  }

  setActive(value: boolean) {
    this.active = value;
  }

  // Override stream control methods
  pause() {
    if (this.active) {
      this.sourceStream.pause();
    }
    return this;
  }

  resume() {
    if (this.active) {
      this.sourceStream.resume();
    }
    return this;
  }
}

class ProxiedOutputStream extends PassThrough {
  private active: boolean = false;

  constructor(private targetStream: Writable) {
    super();
    this.on("data", (chunk) => {
      if (this.active) {
        this.targetStream.write(chunk);
      }
    });
  }

  setActive(value: boolean) {
    this.active = value;
  }
}

interface ManagedREPL {
  name: string;
  server: REPLServer;
  inputProxy: ProxiedInputStream;
  outputProxy: ProxiedOutputStream;
}

export class REPLManager {
  private repls: ManagedREPL[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.setupKeyHandler();
  }

  add(name: string, server: REPLServer): void {
    // Create proxies for streams
    const inputProxy = new ProxiedInputStream(input);
    const outputProxy = new ProxiedOutputStream(stdout);

    // @ts-ignore - we know what we're doing
    server.input = inputProxy;
    // @ts-ignore
    server.output = outputProxy;

    this.repls.push({
      name,
      server,
      inputProxy,
      outputProxy,
    });

    // Activate the first added REPL
    if (this.repls.length === 1) {
      inputProxy.setActive(true);
      outputProxy.setActive(true);
    }
  }

  private switchToNext(): void {
    if (this.repls.length <= 1) return;

    // Deactivate current proxies
    const current = this.repls[this.currentIndex];
    current.inputProxy.setActive(false);
    current.outputProxy.setActive(false);

    // Switch to the next REPL
    this.currentIndex = (this.currentIndex + 1) % this.repls.length;

    // Activate new proxies
    const next = this.repls[this.currentIndex];
    next.inputProxy.setActive(true);
    next.outputProxy.setActive(true);
    next.server.prompt(true);
  }

  private setupKeyHandler(): void {
    input.on("keypress", (_, key) => {
      if (key && key.name === "tab") {
        this.switchToNext();
        return;
      }
    });
  }
}
