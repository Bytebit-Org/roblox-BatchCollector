[@rbxts/batch-collector](../README.md) / IBatchCollector

# Interface: IBatchCollector<T\>

An interface that defines a Batch Collector.
Batch Collectors should work by allowing items to be put into batches.
Batches can then be queued for posting at an appropriate point in the future.

## Type parameters

| Name |
| :------ |
| `T` |

## Implemented by

- [`BatchCollector`](../classes/BatchCollector.md)

## Table of contents

### Methods

- [destroy](IBatchCollector.md#destroy)
- [forcePostCurrentBatch](IBatchCollector.md#forcepostcurrentbatch)
- [forcePostRemainingBatches](IBatchCollector.md#forcepostremainingbatches)
- [isCurrentBatchEmpty](IBatchCollector.md#iscurrentbatchempty)
- [isPostingQueueEmpty](IBatchCollector.md#ispostingqueueempty)
- [pushItems](IBatchCollector.md#pushitems)

## Methods

### destroy

▸ **destroy**(): `void`

Destroys the instance.
Any batches in the queue will be dropped and not posted.
The current batch will be dropped and not posted.
Any further calls to methods on the instance will throw errors.

#### Returns

`void`

#### Defined in

[interfaces/IBatchCollector.d.ts:13](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/interfaces/IBatchCollector.d.ts#L13)

___

### forcePostCurrentBatch

▸ **forcePostCurrentBatch**(): `void`

Forces the current batch to be posted right away, ahead of any others presently in the queue

#### Returns

`void`

#### Defined in

[interfaces/IBatchCollector.d.ts:18](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/interfaces/IBatchCollector.d.ts#L18)

___

### forcePostRemainingBatches

▸ **forcePostRemainingBatches**(): `void`

Forces all remaining batches, including the current one, to be posted right away in queue order

#### Returns

`void`

#### Defined in

[interfaces/IBatchCollector.d.ts:23](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/interfaces/IBatchCollector.d.ts#L23)

___

### isCurrentBatchEmpty

▸ **isCurrentBatchEmpty**(): `boolean`

Checks whether the current batch being put together is empty

#### Returns

`boolean`

True if the current batch is empty, false otherwise

#### Defined in

[interfaces/IBatchCollector.d.ts:29](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/interfaces/IBatchCollector.d.ts#L29)

___

### isPostingQueueEmpty

▸ **isPostingQueueEmpty**(): `boolean`

Checks whether any prepared batches are in the queue waiting to be posted

#### Returns

`boolean`

True if there are no batches in the queue, false otherwise

#### Defined in

[interfaces/IBatchCollector.d.ts:35](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/interfaces/IBatchCollector.d.ts#L35)

___

### pushItems

▸ **pushItems**(`items`): `void`

Pushes the given items onto the current batch.
If, during this process, the current batch fills up, it will be queued for posting.
Any remaining items will overflow into the new batch.
This queueing and creating of a new overflow batch can happen infinitely many times in one call of this method.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `items` | readonly `T`[] | The items to push for later posting. |

#### Returns

`void`

#### Defined in

[interfaces/IBatchCollector.d.ts:44](https://github.com/Bytebit-Org/roblox-BatchCollector/blob/f54d625/src/interfaces/IBatchCollector.d.ts#L44)
