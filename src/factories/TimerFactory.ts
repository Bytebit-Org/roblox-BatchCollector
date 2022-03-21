import { Timer } from "@rbxts/timer";

export class TimerFactory {
	public createInstance(lengthInSeconds: number) {
		return new Timer(lengthInSeconds);
	}
}
