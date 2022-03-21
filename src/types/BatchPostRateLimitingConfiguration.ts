import { t } from "@rbxts/t";

export const isBatchPostRateLimitingConfiguration = t.interface({
	maxNumberOfItems: t.number,
	maxTimeBetweenPostsInSeconds: t.number,
	minTimeBetweenPostsInSeconds: t.optional(t.number),
});

export type BatchPostRateLimitingConfiguration = t.static<typeof isBatchPostRateLimitingConfiguration>;
