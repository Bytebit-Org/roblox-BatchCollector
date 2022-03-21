import { Queue } from "@rbxts/basic-utilities";

export class QueueFactory {
	public createInstance<T>(values?: ReadonlyArray<T>) {
		return new Queue<T>(values);
	}
}
