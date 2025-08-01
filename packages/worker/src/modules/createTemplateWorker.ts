import type { WorkerTaskRecord } from "../stores/workerTaskStore.js";
import type { WorkerEntity } from "../main.js";
import { type TemplateStore, peerIdFromString } from "@effectai/protocol-core";
import type { Template, TemplateRequest } from "@effectai/protobufs";

export function createTemplateWorker({
  entity,
  templateStore,
}: {
  entity: WorkerEntity;
  templateStore: TemplateStore;
}) {
  const getOrFetchTemplate = async ({
    taskRecord,
    templateId,
  }: {
    taskRecord: WorkerTaskRecord;
    templateId: string;
  }): Promise<Template> => {
    const cachedTemplate = await tryGetTemplateFromStore(templateId);
    if (cachedTemplate) return cachedTemplate;

    const managerPeer = getManagerPeerFromTask(taskRecord);
    if (!managerPeer) {
      throw new Error("Manager peer not found in task record");
    }

    return fetchTemplateFromPeer(templateId, managerPeer);
  };

  const tryGetTemplateFromStore = async (
    templateId: string,
  ): Promise<Template | null> => {
    try {
      const templateRecord = await templateStore.get({ entityId: templateId });
      return templateRecord?.state || null;
    } catch (error) {
      return null;
    }
  };

  const getManagerPeerFromTask = (
    taskRecord: WorkerTaskRecord,
  ): string | undefined => {
    return taskRecord.events.find((e) => e.type === "create")?.managerPeer;
  };

  const fetchTemplateFromPeer = async (
    templateId: string,
    managerPeer: string,
  ): Promise<Template> => {
    const peerId = peerIdFromString(managerPeer);
    const templateRequest: TemplateRequest = { templateId };

    try {
      const [template, _error] = await entity.sendMessage(peerId, {
        templateRequest,
      });

      if (!template) {
        throw new Error("No template returned from manager");
      }

      await cacheTemplate(template, managerPeer);
      return template;
    } catch (error) {
      throw new Error("Template fetch failed");
    }
  };

  const cacheTemplate = async (
    template: Template,
    sourcePeer: string,
  ): Promise<void> => {
    try {
      await templateStore.create({
        template,
        createdByPeer: sourcePeer,
      });
    } catch (error) {
      console.error("Failed to cache template:", error);
    }
  };

  return {
    getOrFetchTemplate,
    cacheTemplate,
  };
}
