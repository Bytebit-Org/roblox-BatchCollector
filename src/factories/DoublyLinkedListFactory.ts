import { DoublyLinkedList } from "@rbxts/linked-lists";

export class DoublyLinkedListFactory {
	public createInstance<T extends defined>() {
		return new DoublyLinkedList<T>();
	}
}
