/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/// <reference types="@rbxts/testez/globals" />

import { DoublyLinkedList } from "@rbxts/linked-lists";
import { HttpService, LogService, RunService } from "@rbxts/services";
import { BinFactory } from "factories/BinFactory";
import { DoublyLinkedListFactory } from "factories/DoublyLinkedListFactory";
import { TimerFactory } from "factories/TimerFactory";
import { QueueFactory } from "factories/QueueFactory";
import { BatchPostRateLimitingConfiguration } from "types/BatchPostRateLimitingConfiguration";
import { BatchCollector } from "./BatchCollector";
import { a } from "@rbxts/fitumi";
import { Signal } from "@rbxts/signals-tooling";

const TIME_DELTA_EPSILON = 1 / 120;

const defaultOnBatchReady = (batch: DoublyLinkedList<string>) => {};
const defaultRateLimitingConfiguration = {
	maxNumberOfItems: 100,
	maxTimeBetweenPostsInSeconds: 10,
	minTimeBetweenPostsInSeconds: 1,
};

class _UnitTestInstantiableBatchCollector<T extends defined> extends BatchCollector<T> {
	public constructor(
		onBatchReady: (batch: DoublyLinkedList<T>) => void,
		rateLimitingConfiguration: BatchPostRateLimitingConfiguration,
		optionalArgs?: {
			binFactory?: BinFactory;
			dateTimeConstructor?: DateTimeConstructor;
			doublyLinkedListFactory?: DoublyLinkedListFactory;
			runService?: RunService;
			timerFactory?: TimerFactory;
			queueFactory?: QueueFactory;
		},
	) {
		super(
			optionalArgs?.binFactory ?? new BinFactory(),
			optionalArgs?.dateTimeConstructor ?? DateTime,
			optionalArgs?.doublyLinkedListFactory ?? new DoublyLinkedListFactory(),
			onBatchReady,
			rateLimitingConfiguration,
			optionalArgs?.runService ?? RunService,
			optionalArgs?.timerFactory ?? new TimerFactory(),
			optionalArgs?.queueFactory ?? new QueueFactory(),
		);
	}
}

const generateGuids = (numberOfElements: number) => {
	const guidsArray = new Array<string>(numberOfElements);

	for (let i = 0; i < numberOfElements; i++) {
		guidsArray[i] = HttpService.GenerateGUID();
	}

	return guidsArray;
};

export = () => {
	describe("destroy", () => {
		// other methods will test that they throw on a destroyed instance, so this should be fine
		it("should be idempotent and put a warning into the output upon the second call", () => {
			const batchCollector = BatchCollector.create(defaultOnBatchReady, defaultRateLimitingConfiguration);
			batchCollector.destroy();

			let wasExpectedWarningOutputted = false;
			const messageOutConnection = LogService.MessageOut.Connect((message, messageType) => {
				if (messageType !== Enum.MessageType.MessageWarning) {
					return;
				}

				if (message.find(tostring(getmetatable(batchCollector))) === undefined) {
					return;
				}

				wasExpectedWarningOutputted = true;
			});

			batchCollector.destroy();

			task.wait();

			messageOutConnection.Disconnect();

			expect(wasExpectedWarningOutputted).to.equal(true);
		});
	});

	describe("forcePostCurrentBatch", () => {
		it("should throw if the instance is destroyed", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			batchCollector.destroy();

			expect(() => batchCollector.forcePostCurrentBatch()).to.throw();
		});

		// need some tests to ensure current batch is put through the onBatchReady callback with expected items
		it("should post the incomplete, forcefully pushed batch ahead of batches in queue while also ignoring minimum time between posting", () => {
			const runService = a.fake<RunService>();
			const heartbeatSignal = new Signal<(deltaTime: number) => void>();

			const nowDateTime = DateTime.now();
			const dateTimeConstructor = a.fake<DateTimeConstructor>();
			dateTimeConstructor.now = () => nowDateTime;

			runService.Heartbeat = heartbeatSignal as unknown as RBXScriptSignal;

			const incompleteBatchSize = math.floor(defaultRateLimitingConfiguration.maxNumberOfItems * 0.5);
			const arrayInput = generateGuids(
				defaultRateLimitingConfiguration.maxNumberOfItems * 2 + incompleteBatchSize,
			);

			let numberOfTimesCallbackWasCalled = 0;

			const batchCollector = new _UnitTestInstantiableBatchCollector(
				(batch: DoublyLinkedList<string>) => {
					if (numberOfTimesCallbackWasCalled === 0) {
						// should be a complete batch being posted from the queue
						expect(batch.size()).to.equal(defaultRateLimitingConfiguration.maxNumberOfItems);

						const expectedValues = new Array<string>(defaultRateLimitingConfiguration.maxNumberOfItems);
						for (let i = 0; i < defaultRateLimitingConfiguration.maxNumberOfItems; i++) {
							expectedValues[i] = arrayInput[i];
						}

						const expectedValuesNotYetSeen = new Set(expectedValues);
						for (const [listIndex, value] of batch.getForwardIterator()) {
							expect(expectedValuesNotYetSeen.has(value)).to.equal(true);
							expect(value).to.equal(arrayInput[listIndex - 1]);
							expectedValuesNotYetSeen.delete(value);
						}

						expect(expectedValuesNotYetSeen.isEmpty()).to.equal(true);
					} else {
						expect(batch.size()).to.equal(incompleteBatchSize);

						const arrayInputIndexBase = defaultRateLimitingConfiguration.maxNumberOfItems * 2;

						const expectedValues = new Array<string>(incompleteBatchSize);
						for (let i = 0; i < incompleteBatchSize; i++) {
							expectedValues[i] = arrayInput[i + arrayInputIndexBase];
						}

						const expectedValuesNotYetSeen = new Set(expectedValues);
						for (const [listIndex, value] of batch.getForwardIterator()) {
							expect(expectedValuesNotYetSeen.has(value)).to.equal(true);
							expect(value).to.equal(arrayInput[listIndex - 1 + arrayInputIndexBase]);
							expectedValuesNotYetSeen.delete(value);
						}

						expect(expectedValuesNotYetSeen.isEmpty()).to.equal(true);
					}

					numberOfTimesCallbackWasCalled++;
				},
				defaultRateLimitingConfiguration,
				{
					dateTimeConstructor,
					runService,
				},
			);

			batchCollector.pushItems(arrayInput);

			expect(numberOfTimesCallbackWasCalled).to.equal(0);

			// have first complete batch go through
			heartbeatSignal.fire(1 / 60);
			task.wait();
			expect(numberOfTimesCallbackWasCalled).to.equal(1);

			// keep time the same and forcefully post the incomplete batch ahead of the second batch
			batchCollector.forcePostCurrentBatch();
			expect(numberOfTimesCallbackWasCalled).to.equal(2);
		});
	});

	describe("forcePostRemainingBatches", () => {
		it("should throw if the instance is destroyed", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			batchCollector.destroy();

			expect(() => batchCollector.forcePostRemainingBatches()).to.throw();
		});

		// need some tests to ensure current batch is put through the onBatchReady callback with expected items
		it("should post all the batches in the queue followed by the incomplete while also ignoring minimum time between posting", () => {
			const runService = a.fake<RunService>();
			const heartbeatSignal = new Signal<(deltaTime: number) => void>();

			const nowDateTime = DateTime.now();
			const dateTimeConstructor = a.fake<DateTimeConstructor>();
			dateTimeConstructor.now = () => nowDateTime;

			runService.Heartbeat = heartbeatSignal as unknown as RBXScriptSignal;

			const incompleteBatchSize = math.floor(defaultRateLimitingConfiguration.maxNumberOfItems * 0.5);
			const arrayInput = generateGuids(
				defaultRateLimitingConfiguration.maxNumberOfItems * 2 + incompleteBatchSize,
			);

			let numberOfTimesCallbackWasCalled = 0;

			const batchCollector = new _UnitTestInstantiableBatchCollector(
				(batch: DoublyLinkedList<string>) => {
					const arrayInputIndexBase =
						defaultRateLimitingConfiguration.maxNumberOfItems * numberOfTimesCallbackWasCalled;
					let numberOfExpectedValues = 0;

					if (numberOfTimesCallbackWasCalled < 2) {
						// should be a complete batch being posted from the queue
						expect(batch.size()).to.equal(defaultRateLimitingConfiguration.maxNumberOfItems);
						numberOfExpectedValues = defaultRateLimitingConfiguration.maxNumberOfItems;
					} else {
						// this is the incomplete batch that is being forcefully posted
						expect(batch.size()).to.equal(incompleteBatchSize);
						numberOfExpectedValues = incompleteBatchSize;
					}

					const expectedValues = new Array<string>(numberOfExpectedValues);
					for (let i = 0; i < numberOfExpectedValues; i++) {
						expectedValues[i] = arrayInput[i + arrayInputIndexBase];
					}

					const expectedValuesNotYetSeen = new Set(expectedValues);
					for (const [listIndex, value] of batch.getForwardIterator()) {
						expect(expectedValuesNotYetSeen.has(value)).to.equal(true);
						expect(value).to.equal(arrayInput[listIndex - 1 + arrayInputIndexBase]);
						expectedValuesNotYetSeen.delete(value);
					}

					expect(expectedValuesNotYetSeen.isEmpty()).to.equal(true);

					numberOfTimesCallbackWasCalled++;
				},
				defaultRateLimitingConfiguration,
				{
					dateTimeConstructor,
					runService,
				},
			);

			batchCollector.pushItems(arrayInput);

			expect(numberOfTimesCallbackWasCalled).to.equal(0);

			// have first complete batch go through
			heartbeatSignal.fire(1 / 60);
			task.wait();
			expect(numberOfTimesCallbackWasCalled).to.equal(1);

			// keep time the same and forcefully post the rest of the batches
			batchCollector.forcePostRemainingBatches();
			expect(numberOfTimesCallbackWasCalled).to.equal(3);
		});
	});

	describe("isCurrentBatchEmpty", () => {
		it("should throw if the instance is destroyed", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			batchCollector.destroy();

			expect(() => batchCollector.isCurrentBatchEmpty()).to.throw();
		});

		it("should return true for a newly created batch collector", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			expect(batchCollector.isCurrentBatchEmpty()).to.equal(true);
		});

		it("should return false after an item is added to a new batch collector, but true after the batch is forcefully posted", () => {
			for (let i = 1; i < defaultRateLimitingConfiguration.maxNumberOfItems - 1; i++) {
				const batchCollector = new _UnitTestInstantiableBatchCollector(
					defaultOnBatchReady,
					defaultRateLimitingConfiguration,
				);

				batchCollector.pushItems(generateGuids(i));

				expect(batchCollector.isCurrentBatchEmpty()).to.equal(false);

				batchCollector.forcePostCurrentBatch();

				expect(batchCollector.isCurrentBatchEmpty()).to.equal(true);
			}
		});

		it("should return true after an item is added that completes the current batch", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			batchCollector.pushItems(generateGuids(defaultRateLimitingConfiguration.maxNumberOfItems));

			expect(batchCollector.isCurrentBatchEmpty()).to.equal(true);
		});
	});

	describe("isPostingQueueEmpty", () => {
		it("should throw if the instance is destroyed", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			batchCollector.destroy();

			expect(() => batchCollector.isPostingQueueEmpty()).to.throw();
		});

		it("should return true for a newly created batch collector", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			expect(batchCollector.isPostingQueueEmpty()).to.equal(true);
		});

		it("should return true even if items are added to current batch without completing the batch", () => {
			for (let i = 1; i < defaultRateLimitingConfiguration.maxNumberOfItems - 1; i++) {
				const batchCollector = new _UnitTestInstantiableBatchCollector(
					defaultOnBatchReady,
					defaultRateLimitingConfiguration,
				);

				batchCollector.pushItems(generateGuids(i));

				expect(batchCollector.isPostingQueueEmpty()).to.equal(true);
			}
		});

		it("should return false after an item is added that completes the current batch and puts it into the queue", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
				{
					runService: a.fake<RunService>(),
				},
			);

			batchCollector.pushItems(generateGuids(defaultRateLimitingConfiguration.maxNumberOfItems));

			expect(batchCollector.isPostingQueueEmpty()).to.equal(false);
		});
	});

	describe("pushItems", () => {
		it("should throw if the instance is destroyed", () => {
			const batchCollector = new _UnitTestInstantiableBatchCollector(
				defaultOnBatchReady,
				defaultRateLimitingConfiguration,
			);

			batchCollector.destroy();

			expect(() => batchCollector.pushItems(generateGuids(1))).to.throw();
		});

		it("should put items into the queue for a completed batch and that batch should be posted on next Heartbeat, next batches should wait at least until minimum time between batches has passed", () => {
			const runService = a.fake<RunService>();
			const heartbeatSignal = new Signal<(deltaTime: number) => void>();

			let nowDateTime = DateTime.now();
			const dateTimeConstructor = a.fake<DateTimeConstructor>();
			dateTimeConstructor.now = () => nowDateTime;

			runService.Heartbeat = heartbeatSignal as unknown as RBXScriptSignal;

			const arrayInput = generateGuids(defaultRateLimitingConfiguration.maxNumberOfItems * 5);

			let numberOfTimesCallbackWasCalled = 0;

			const batchCollector = new _UnitTestInstantiableBatchCollector(
				(batch: DoublyLinkedList<string>) => {
					expect(batch.size()).to.equal(defaultRateLimitingConfiguration.maxNumberOfItems);

					const arrayInputIndexBase =
						numberOfTimesCallbackWasCalled * defaultRateLimitingConfiguration.maxNumberOfItems;

					const expectedValues = new Array<string>(defaultRateLimitingConfiguration.maxNumberOfItems);
					for (let i = 0; i < defaultRateLimitingConfiguration.maxNumberOfItems; i++) {
						expectedValues[i] = arrayInput[i + arrayInputIndexBase];
					}

					const expectedValuesNotYetSeen = new Set(expectedValues);
					for (const [listIndex, value] of batch.getForwardIterator()) {
						expect(expectedValuesNotYetSeen.has(value)).to.equal(true);
						expect(value).to.equal(arrayInput[listIndex - 1 + arrayInputIndexBase]);
						expectedValuesNotYetSeen.delete(value);
					}

					expect(expectedValuesNotYetSeen.isEmpty()).to.equal(true);

					numberOfTimesCallbackWasCalled++;
				},
				defaultRateLimitingConfiguration,
				{
					dateTimeConstructor,
					runService,
				},
			);

			batchCollector.pushItems(arrayInput);

			expect(numberOfTimesCallbackWasCalled).to.equal(0);

			// test first batch goes through but second batch does not yet
			heartbeatSignal.fire(1 / 60);
			task.wait();
			expect(numberOfTimesCallbackWasCalled).to.equal(1);

			nowDateTime = DateTime.fromUnixTimestampMillis(nowDateTime.UnixTimestampMillis + (1 / 60) * 1000);
			heartbeatSignal.fire(1 / 60);
			task.wait();
			expect(numberOfTimesCallbackWasCalled).to.equal(1); // second one shouldn't fire yet because min time hasn't been met

			for (let i = 2; i <= 5; i++) {
				nowDateTime = DateTime.fromUnixTimestampMillis(
					nowDateTime.UnixTimestampMillis +
						defaultRateLimitingConfiguration.minTimeBetweenPostsInSeconds * 1000 +
						TIME_DELTA_EPSILON,
				);
				heartbeatSignal.fire(1 / 60); // intentionally keeping this 1/60 instead of the actual faked delta of time
				task.wait();
				expect(numberOfTimesCallbackWasCalled).to.equal(i);
			}
		});
	});
};
