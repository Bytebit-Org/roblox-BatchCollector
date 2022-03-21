import { DoublyLinkedList } from "@rbxts/basic-utilities";

export class DoublyLinkedListFactory {
	public createInstance<T>(values?: ReadonlyArray<T>) {
		return new DoublyLinkedList<T>(values);
	}
}
