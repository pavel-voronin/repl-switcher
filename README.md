# repl-switcher

## Overview

The repl-switcher library provides a way to manage multiple REPL (Read-Eval-Print Loop) instances within a single application. It allows you to switch between different REPLs using a `Tab` key

## `REPLManager`

A class that manages multiple REPL instances and allows switching between them.

### Methods

- `add(name: string, server: REPLServer)`: Adds a new Node.js REPLServer instance to the manager.

  - `name`: The name of the REPL instance., goes to prompt
  - `server`: The REPLServer instance.

## Usage

```typescript
import { REPLManager } from "./repl";
import * as repl from "node:repl";

// Create a manager
const manager = new REPLManager();

// Create a regular JavaScript REPL as usual
const jsRepl = repl.start({
  prompt: "js > ",
  terminal: true,
  useColors: true,
});

// Create a second REPL for LLM
const llmRepl = repl.start({
  prompt: "llm > ",
  terminal: true,
  useColors: true,
  eval: (cmd, context, filename, callback) => {
    const input = cmd.trim();
    if (!input or input === "(\n)") {
      callback(null, undefined);
      return;
    }

    // Simulate asynchronous processing
    Promise.resolve(`Processed by LLM: ${input}`)
      .then((result) => callback(null, result))
      .catch((err) => callback(err, undefined));
  },
});

// Add REPLs to the manager
manager.add("llm", llmRepl); // the first activates
manager.add("js", jsRepl);
```

## License

This library is licensed under the MIT License.
