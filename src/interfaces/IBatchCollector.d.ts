/**
 * An interface that defines a Batch Collector.
 * Batch Collectors should work by allowing items to be put into batches.
 * Batches can then be queued for posting at an appropriate point in the future.
 */
 export interface IBatchCollector<T> {
	/**
	 * Destroys the instance.
	 * Any batches in the queue will be dropped and not posted.
	 * The current batch will be dropped and not posted.
	 * Any further calls to methods on the instance will throw errors.
	 */
	destroy(): void;

	/**
	 * Forces the current batch to be posted right away, ahead of any others presently in the queue
	 */
	forcePostCurrentBatch(): void;

	/**
	 * Forces all remaining batches, including the current one, to be posted right away in queue order
	 */
	forcePostRemainingBatches(): void;

	/**
	 * Checks whether the current batch being put together is empty
	 * @returns True if the current batch is empty, false otherwise
	 */
	isCurrentBatchEmpty(): boolean;

	/**
	 * Checks whether any prepared batches are in the queue waiting to be posted
	 * @returns True if there are no batches in the queue, false otherwise
	 */
	isPostingQueueEmpty(): boolean;

	/**
	 * Pushes the given items onto the current batch.
	 * If, during this process, the current batch fills up, it will be queued for posting.
	 * Any remaining items will overflow into the new batch.
	 * This queueing and creating of a new overflow batch can happen infinitely many times in one call of this method.
	 * @param items The items to push for later posting.
	 */
	pushItems(items: ReadonlyArray<T>): void;
}
