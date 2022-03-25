import { Queue } from "@rbxts/stacks-and-queues";

export class QueueFactory {
	public createInstance<T extends defined>() {
		return new Queue<T>();
	}
}
