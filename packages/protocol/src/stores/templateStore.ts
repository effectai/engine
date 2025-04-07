import { type Datastore, Key } from "interface-datastore";
import type { Task, Template } from "./proto/effect.js";
import { createHash } from "node:crypto";
import { Store } from "../core/types.js";

export type TemplateEvents = UpdateTemplateEvent | CreateTemplateEvent;

export type CreateTemplateEvent = {
	id: string; // hash of template_data
	timestamp: number;
	type: "create";
	template: Template;
};

export type UpdateTemplateEvent = {
	id: string; // hash of template_data
	timestamp: number;
	type: "update";
};

export interface TemplateRecord {
	id: string;
	state: Template;
	events: TemplateEvents[];
}

export class TemplateStore implements Store<TemplateRecord> {
	private datastore: Datastore;

	constructor(datastore: Datastore) {
		this.datastore = datastore;
	}

	async has(entityId: string): Promise<boolean> {
		return this.datastore.has(new Key(`/templates/${entityId}`));
	}

	async get(entityId: string): Promise<TemplateRecord> {
		try {
			const data = await this.datastore.get(new Key(`/templates/${entityId}`));
			return JSON.parse(data.toString());
		} catch (e) {
			console.error("Entity not found");
			throw e;
		}
	}

	async put(entityId: string, entity: TemplateRecord): Promise<Key> {
		return await this.datastore.put(
			new Key(`/templates/${entityId}`),
			Buffer.from(JSON.stringify(entity)),
		);
	}
}
