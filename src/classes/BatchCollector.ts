import { ITimer, TimerState } from "@rbxts/timer";
import { Bin } from "@rbxts/bin";
import { assertNotDestroyed, warnAlreadyDestroyed } from "@rbxts/destroyed-instance-logging";
import { RunService } from "@rbxts/services";
import { BatchPostRateLimitingConfiguration } from "types/BatchPostRateLimitingConfiguration";
import { IBatchCollector } from "interfaces/IBatchCollector";
import { BinFactory } from "factories/BinFactory";
import { DoublyLinkedListFactory } from "factories/DoublyLinkedListFactory";
import { TimerFactory } from "factories/TimerFactory";
import { QueueFactory } from "factories/QueueFactory";
import { DoublyLinkedList } from "@rbxts/linked-lists";
import { Queue } from "@rbxts/stacks-and-queues";

/**
 * An implementation of a Batch Collector.
 * This implementation allows for a rate limiting configuration to be passed in as a constructor argument.
 * The rate limiting configuration will define how many items can fit into a single batch and how frequently to post.
 * Unless batches are forcibly posted through the forcePostX methods,
 * batches will be posted as they come up in the queue on each RunService.Heartbeat.
 */
export class BatchCollector<T> implements IBatchCollector<T> {
	private batchesToPostQueue: Queue<DoublyLinkedList<T>>;
	private readonly bin: Bin;
	private currentBatch: DoublyLinkedList<T>;
	private isDestroyed = false;
	private lastPostUnixTimestampMillis = 0;
	private readonly partialBatchPostTimer: ITimer;

	private constructor(
		binFactory: BinFactory,
		private readonly dateTimeConstructor: DateTimeConstructor,
		private readonly doublyLinkedListFactory: DoublyLinkedListFactory,
		private readonly onBatchReady: (batch: DoublyLinkedList<T>) => void,
		private readonly rateLimitingConfiguration: BatchPostRateLimitingConfiguration,
		private readonly runService: RunService,
		timerFactory: TimerFactory,
		queueFactory: QueueFactory,
	) {
		this.batchesToPostQueue = queueFactory.createInstance();
		this.bin = binFactory.createInstance();
		this.currentBatch = doublyLinkedListFactory.createInstance();
		this.partialBatchPostTimer = this.bin.add(
			timerFactory.createInstance(this.rateLimitingConfiguration.maxTimeBetweenPostsInSeconds),
		);

		this.listenForPartialBatchPostTimerToComplete();
		this.listenForRunTimeHeartbeat();
	}

	public static create<T>(
		this: void,
		onBatchReady: (batch: DoublyLinkedList<T>) => void,
		rateLimitingConfiguration: BatchPostRateLimitingConfiguration,
	): IBatchCollector<T> {
		return new BatchCollector<T>(
			new BinFactory(),
			DateTime,
			new DoublyLinkedListFactory(),
			onBatchReady,
			rateLimitingConfiguration,
			RunService,
			new TimerFactory(),
			new QueueFactory(),
		);
	}

	public destroy() {
		if (this.isDestroyed) {
			warnAlreadyDestroyed(this);
			return;
		}

		this.bin.destroy();
		this.isDestroyed = true;
	}

	public forcePostCurrentBatch() {
		assertNotDestroyed(this.isDestroyed, this);

		if (this.currentBatch.isEmpty()) {
			warn(`Attempt to queue empty batch. Stack trace: ${debug.traceback()}`);
			return;
		}

		const batchToPost = this.currentBatch;
		this.currentBatch = this.doublyLinkedListFactory.createInstance();

		if (this.partialBatchPostTimer.getState() !== TimerState.NotRunning) {
			this.partialBatchPostTimer.stop();
		}

		this.postBatchInBackground(batchToPost);
	}

	public forcePostRemainingBatches() {
		if (!this.currentBatch.isEmpty()) {
			this.queueCurrentBatch();
		}

		let batchToPost: DoublyLinkedList<T> | undefined;
		while ((batchToPost = this.batchesToPostQueue.pop()) !== undefined) {
			this.postBatchInBackground(batchToPost);
		}
	}

	public isCurrentBatchEmpty() {
		assertNotDestroyed(this.isDestroyed, this);

		return this.currentBatch.isEmpty();
	}

	public isPostingQueueEmpty() {
		assertNotDestroyed(this.isDestroyed, this);

		return this.batchesToPostQueue.isEmpty();
	}

	public pushItems(batchItems: ReadonlyArray<T>) {
		assertNotDestroyed(this.isDestroyed, this);

		for (const item of batchItems) {
			this.pushSingleBatchItem(item);
		}
	}

	private listenForRunTimeHeartbeat() {
		this.bin.add(
			this.runService.Heartbeat.Connect(() => {
				if (this.batchesToPostQueue.isEmpty()) {
					return;
				}

				if (this.rateLimitingConfiguration.minTimeBetweenPostsInSeconds !== undefined) {
					const currentUnixTimestampMillis = this.dateTimeConstructor.now().UnixTimestampMillis;
					const secondsSinceLastPost = (currentUnixTimestampMillis - this.lastPostUnixTimestampMillis) / 1000;
					if (secondsSinceLastPost < this.rateLimitingConfiguration.minTimeBetweenPostsInSeconds) {
						return;
					}
				}

				const batchToPost = this.batchesToPostQueue.pop();
				if (batchToPost === undefined) {
					// really shouldn't happen at all
					return;
				}

				this.postBatchInBackground(batchToPost);
			}),
		);
	}

	private listenForPartialBatchPostTimerToComplete() {
		this.bin.add(
			this.partialBatchPostTimer.completed.Connect(() => {
				this.queueCurrentBatch();
			}),
		);
	}

	private postBatchInBackground(batchToPost: DoublyLinkedList<T>) {
		if (batchToPost.isEmpty()) {
			warn(`Attempt to send empty batch. Stack trace: ${debug.traceback()}`);
			return;
		}

		this.lastPostUnixTimestampMillis = this.dateTimeConstructor.now().UnixTimestampMillis;

		coroutine.wrap(this.onBatchReady)(batchToPost);
	}

	private pushSingleBatchItem(item: T) {
		this.currentBatch.pushToTail(item);

		if (this.currentBatch.size() === this.rateLimitingConfiguration.maxNumberOfItems) {
			this.queueCurrentBatch();
		} else {
			if (this.partialBatchPostTimer.getState() !== TimerState.Running) {
				this.partialBatchPostTimer.start();
			}
		}
	}

	private queueCurrentBatch() {
		if (this.currentBatch.isEmpty()) {
			warn(`Attempt to queue empty batch. Stack trace: ${debug.traceback()}`);
			return;
		}

		const batchToPost = this.currentBatch;
		this.currentBatch = this.doublyLinkedListFactory.createInstance();

		if (this.partialBatchPostTimer.getState() !== TimerState.NotRunning) {
			this.partialBatchPostTimer.stop();
		}

		this.batchesToPostQueue.push(batchToPost);
	}
}
