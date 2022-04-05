# Batch Collector
<p align="center">
  <a href="https://github.com/Bytebit-Org/roblox-BatchCollector/actions">
      <img src="https://github.com/Bytebit-Org/roblox-BatchCollector/workflows/CI/badge.svg" alt="CI status" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-blue.svg" alt="PRs Welcome" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  </a>
  <a href="https://discord.gg/QEz3v8y">
    <img src="https://img.shields.io/badge/discord-join-7289DA.svg?logo=discord&longCache=true&style=flat" alt="Discord server" />
  </a>
</p>

Batch Collector is a module for collecting batches of items, be they logs or tasks, to be posted together in order.

## Installation
### roblox-ts
Simply install to your [roblox-ts](https://roblox-ts.com/) project as follows:
```
npm i @rbxts/batch-collector
```

### Wally
[Wally](https://github.com/UpliftGames/wally/) users can install this package by adding the following line to their `Wally.toml` under `[dependencies]`:
```
BatchCollector = "bytebit/batch-collector@1.0.2"
```

Then just run `wally install`.

### From model file
Model files are uploaded to every release as `.rbxmx` files. You can download the file from the [Releases page](https://github.com/Bytebit-Org/roblox-BatchCollector/releases) and load it into your project however you see fit.

### From model asset
New versions of the asset are uploaded with every release. The asset can be added to your Roblox Inventory and then inserted into your Place via Toolbox by getting it [here.](https://www.roblox.com/library/9165031169/Batch-Collector-Package)

## Documentation
Documentation can be found [here](https://github.com/Bytebit-Org/roblox-BatchCollector/tree/master/docs), is included in the TypeScript files directly, and was generated using [TypeDoc](https://typedoc.org/).

## Example
We'll write a class that uses a `BatchCollector` to collect in-game events that will then be sent to a backend server that tracks all events across all servers and allows them to be viewed by a developer in some sort of dashboard.

<details>
  <summary>roblox-ts example</summary>

  ```ts
  import { BatchCollector, BatchPostRateLimitingConfiguration, IBatchCollector } from "@rbxts/batch-collector";

  type GameEvent = {
    readonly eventTypeName: string
  };

  const batchPostRateLimitingConfiguration: BatchPostRateLimitingConfiguration = {
    maxNumberOfItems: 50; // don't want too many events at once
    maxTimeBetweenPostsInSeconds: 30; // don't want too much of a time discrepancy
    minTimeBetweenPostsInSeconds: 10; // want to make sure we don't send too many and hit the HttpService limits
  };

  export class GameEventsPoster {
    private readonly batchCollector: IBatchCollector<GameEvent>;

    public constructor() {
      this.batchCollector = BatchCollector.create(
        (gameEventsBatch) => this.postGameEvents(gameEventsBatch),
        batchPostRateLimitingConfiguration,
      );
    }

    public logGameEvent(gameEvent: GameEvent) {
      this.batchCollector.pushItem(gameEvent);
    }

    private postGameEvents(gameEvents: ReadonlyArray<GameEvent>) {
      // logic to post game events to backend server using HttpService
    }
  }
  ```
</details>

<details>
  <summary>Luau example</summary>

  ```lua
  local BatchCollector = require(path.to.modules["batch-collector"]).BatchCollector

  local batchPostRateLimitingConfiguration = {
    maxNumberOfItems = 50, -- don't want too many events at once
    maxTimeBetweenPostsInSeconds = 30, -- don't want too much of a time discrepancy
    minTimeBetweenPostsInSeconds = 10 -- want to make sure we don't send too many and hit the HttpService limits
  }

  local GameEventsPoster = {}
  GameEventsPoster.__index = GameEventsPoster

  function new()
    local self = {}
    setmetatable(self, GameEventsPoster)

    self.batchCollector = BatchCollector.create(
      function (gameEventsBatch)
        _postGameEvents(self, gameEventsBatch)
      end,
      batchPostRateLimitingConfiguration
    )

    return self
  end

  function GameEventsPoster:logGameEvent(gameEvent)
    self.batchCollector(pushItem(gameEvent))
  end

  function _postGameEvents(self, gameEventsBatch)
    -- logic to post game events to backend server using HttpService
  end

  return {
    new = new
  }
  ```
</details>
