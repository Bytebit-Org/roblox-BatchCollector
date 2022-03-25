[@rbxts/batch-collector](../README.md) / BatchCollector

# Class: BatchCollector<T\>

An implementation of a Batch Collector.
This implementation allows for a rate limiting configuration to be passed in as a constructor argument.
The rate limiting configuration will define how many items can fit into a single batch and how frequently to post.
Unless batches are forcibly posted through the forcePostX methods,
batches will be posted as they come up in the queue on each RunService.Heartbeat.

## Type parameters

| Name |
| :------ |
| `T` |

## Implements

- [`IBatchCollector`](../interfaces/IBatchCollector.md)<`T`\>

## Table of contents

### Methods

- [destroy](BatchCollector.md#destroy)
- [forcePostCurrentBatch](BatchCollector.md#forcepostcurrentbatch)
- [forcePostRemainingBatches](BatchCollector.md#forcepostremainingbatches)
- [isCurrentBatchEmpty](BatchCollector.md#iscurrentbatchempty)
- [isPostingQueueEmpty](BatchCollector.md#ispostingqueueempty)
- [pushItems](BatchCollector.md#pushitems)
- [create](BatchCollector.md#create)

## Methods

### destroy

▸ **destroy**(): `void`

Destroys the instance.
Any batches in the queue will be dropped and not posted.
The current batch will be dropped and not posted.
Any further calls to methods on the instance will throw errors.

#### Returns

`void`

#### Implementation of

[IBatchCollector](../interfaces/IBatchCollector.md).[destroy](../interfaces/IBatchCollector.md#destroy)

#### Defined in

[classes/BatchCollector.ts:67](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/classes/BatchCollector.ts#L67)

___

### forcePostCurrentBatch

▸ **forcePostCurrentBatch**(): `void`

Forces the current batch to be posted right away, ahead of any others presently in the queue

#### Returns

`void`

#### Implementation of

[IBatchCollector](../interfaces/IBatchCollector.md).[forcePostCurrentBatch](../interfaces/IBatchCollector.md#forcepostcurrentbatch)

#### Defined in

[classes/BatchCollector.ts:77](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/classes/BatchCollector.ts#L77)

___

### forcePostRemainingBatches

▸ **forcePostRemainingBatches**(): `void`

Forces all remaining batches, including the current one, to be posted right away in queue order

#### Returns

`void`

#### Implementation of

[IBatchCollector](../interfaces/IBatchCollector.md).[forcePostRemainingBatches](../interfaces/IBatchCollector.md#forcepostremainingbatches)

#### Defined in

[classes/BatchCollector.ts:95](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/classes/BatchCollector.ts#L95)

___

### isCurrentBatchEmpty

▸ **isCurrentBatchEmpty**(): `boolean`

Checks whether the current batch being put together is empty

#### Returns

`boolean`

True if the current batch is empty, false otherwise

#### Implementation of

[IBatchCollector](../interfaces/IBatchCollector.md).[isCurrentBatchEmpty](../interfaces/IBatchCollector.md#iscurrentbatchempty)

#### Defined in

[classes/BatchCollector.ts:106](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/classes/BatchCollector.ts#L106)

___

### isPostingQueueEmpty

▸ **isPostingQueueEmpty**(): `boolean`

Checks whether any prepared batches are in the queue waiting to be posted

#### Returns

`boolean`

True if there are no batches in the queue, false otherwise

#### Implementation of

[IBatchCollector](../interfaces/IBatchCollector.md).[isPostingQueueEmpty](../interfaces/IBatchCollector.md#ispostingqueueempty)

#### Defined in

[classes/BatchCollector.ts:112](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/classes/BatchCollector.ts#L112)

___

### pushItems

▸ **pushItems**(`batchItems`): `void`

Pushes the given items onto the current batch.
If, during this process, the current batch fills up, it will be queued for posting.
Any remaining items will overflow into the new batch.
This queueing and creating of a new overflow batch can happen infinitely many times in one call of this method.

#### Parameters

| Name | Type |
| :------ | :------ |
| `batchItems` | readonly `T`[] |

#### Returns

`void`

#### Implementation of

[IBatchCollector](../interfaces/IBatchCollector.md).[pushItems](../interfaces/IBatchCollector.md#pushitems)

#### Defined in

[classes/BatchCollector.ts:118](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/classes/BatchCollector.ts#L118)

___

### create

▸ `Static` **create**<`T`\>(`this`, `onBatchReady`, `rateLimitingConfiguration`): [`IBatchCollector`](../interfaces/IBatchCollector.md)<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `this` | `void` | `undefined` |
| `onBatchReady` | (`batch`: `DoublyLinkedList`<`T`\>) => `void` | `undefined` |
| `rateLimitingConfiguration` | `Object` | `undefined` |
| `rateLimitingConfiguration.maxNumberOfItems` | `number` | `t.number` |
| `rateLimitingConfiguration.maxTimeBetweenPostsInSeconds` | `number` | `t.number` |
| `rateLimitingConfiguration.minTimeBetweenPostsInSeconds` | `undefined` \| `number` | `undefined` |

#### Returns

[`IBatchCollector`](../interfaces/IBatchCollector.md)<`T`\>

#### Defined in

[classes/BatchCollector.ts:50](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/classes/BatchCollector.ts#L50)
