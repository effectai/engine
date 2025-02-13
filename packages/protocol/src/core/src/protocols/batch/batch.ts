/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import {
	type Codec,
	decodeMessage,
	type DecodeOptions,
	encodeMessage,
	MaxLengthError,
	MaxSizeError,
	message,
} from "protons-runtime";
import type { Uint8ArrayList } from "uint8arraylist";

export interface Batch {
	repetitions: number;
	validationRate: number;
	template: string;
	taskData: Task[];
}

export namespace Batch {
	let _codec: Codec<Batch>;

	export const codec = (): Codec<Batch> => {
		if (_codec == null) {
			_codec = message<Batch>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.repetitions != null && obj.repetitions !== 0) {
						w.uint32(8);
						w.int32(obj.repetitions);
					}

					if (obj.validationRate != null && obj.validationRate !== 0) {
						w.uint32(21);
						w.float(obj.validationRate);
					}

					if (obj.template != null && obj.template !== "") {
						w.uint32(26);
						w.string(obj.template);
					}

					if (obj.taskData != null) {
						for (const value of obj.taskData) {
							w.uint32(34);
							Task.codec().encode(value, w);
						}
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length, opts = {}) => {
					const obj: any = {
						repetitions: 0,
						validationRate: 0,
						template: "",
						taskData: [],
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1: {
								obj.repetitions = reader.int32();
								break;
							}
							case 2: {
								obj.validationRate = reader.float();
								break;
							}
							case 3: {
								obj.template = reader.string();
								break;
							}
							case 4: {
								if (
									opts.limits?.taskData != null &&
									obj.taskData.length === opts.limits.taskData
								) {
									throw new MaxLengthError(
										'Decode error - map field "taskData" had too many elements',
									);
								}

								obj.taskData.push(
									Task.codec().decode(reader, reader.uint32(), {
										limits: opts.limits?.taskData$,
									}),
								);
								break;
							}
							default: {
								reader.skipType(tag & 7);
								break;
							}
						}
					}

					return obj;
				},
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<Batch>): Uint8Array => {
		return encodeMessage(obj, Batch.codec());
	};

	export const decode = (
		buf: Uint8Array | Uint8ArrayList,
		opts?: DecodeOptions<Batch>,
	): Batch => {
		return decodeMessage(buf, Batch.codec(), opts);
	};
}

export interface Task {
	id: string;
	template: string;
	data: Map<string, string>;
	result: string;
}

export namespace Task {
	export interface Task$dataEntry {
		key: string;
		value: string;
	}

	export namespace Task$dataEntry {
		let _codec: Codec<Task$dataEntry>;

		export const codec = (): Codec<Task$dataEntry> => {
			if (_codec == null) {
				_codec = message<Task$dataEntry>(
					(obj, w, opts = {}) => {
						if (opts.lengthDelimited !== false) {
							w.fork();
						}

						if (obj.key != null && obj.key !== "") {
							w.uint32(10);
							w.string(obj.key);
						}

						if (obj.value != null && obj.value !== "") {
							w.uint32(18);
							w.string(obj.value);
						}

						if (opts.lengthDelimited !== false) {
							w.ldelim();
						}
					},
					(reader, length, opts = {}) => {
						const obj: any = {
							key: "",
							value: "",
						};

						const end = length == null ? reader.len : reader.pos + length;

						while (reader.pos < end) {
							const tag = reader.uint32();

							switch (tag >>> 3) {
								case 1: {
									obj.key = reader.string();
									break;
								}
								case 2: {
									obj.value = reader.string();
									break;
								}
								default: {
									reader.skipType(tag & 7);
									break;
								}
							}
						}

						return obj;
					},
				);
			}

			return _codec;
		};

		export const encode = (obj: Partial<Task$dataEntry>): Uint8Array => {
			return encodeMessage(obj, Task$dataEntry.codec());
		};

		export const decode = (
			buf: Uint8Array | Uint8ArrayList,
			opts?: DecodeOptions<Task$dataEntry>,
		): Task$dataEntry => {
			return decodeMessage(buf, Task$dataEntry.codec(), opts);
		};
	}

	let _codec: Codec<Task>;

	export const codec = (): Codec<Task> => {
		if (_codec == null) {
			_codec = message<Task>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.id != null && obj.id !== "") {
						w.uint32(10);
						w.string(obj.id);
					}

					if (obj.template != null && obj.template !== "") {
						w.uint32(18);
						w.string(obj.template);
					}

					if (obj.data != null && obj.data.size !== 0) {
						for (const [key, value] of obj.data.entries()) {
							w.uint32(26);
							Task.Task$dataEntry.codec().encode({ key, value }, w);
						}
					}

					if (obj.result != null && obj.result !== "") {
						w.uint32(34);
						w.string(obj.result);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length, opts = {}) => {
					const obj: any = {
						id: "",
						template: "",
						data: new Map<string, string>(),
						result: "",
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1: {
								obj.id = reader.string();
								break;
							}
							case 2: {
								obj.template = reader.string();
								break;
							}
							case 3: {
								if (
									opts.limits?.data != null &&
									obj.data.size === opts.limits.data
								) {
									throw new MaxSizeError(
										'Decode error - map field "data" had too many elements',
									);
								}

								const entry = Task.Task$dataEntry.codec().decode(
									reader,
									reader.uint32(),
								);
								obj.data.set(entry.key, entry.value);
								break;
							}
							case 4: {
								obj.result = reader.string();
								break;
							}
							default: {
								reader.skipType(tag & 7);
								break;
							}
						}
					}

					return obj;
				},
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<Task>): Uint8Array => {
		return encodeMessage(obj, Task.codec());
	};

	export const decode = (
		buf: Uint8Array | Uint8ArrayList,
		opts?: DecodeOptions<Task>,
	): Task => {
		return decodeMessage(buf, Task.codec(), opts);
	};
}
