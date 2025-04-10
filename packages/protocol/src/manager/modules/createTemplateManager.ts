import type {
  TemplateRecord,
  TemplateStore,
} from "../../core/common/stores/templateStore.js";
import type { Template } from "../../core/messages/effect.js";
import { computeTemplateId } from "../../core/utils.js";

export function createTemplateManager({
  templateStore,
}: {
  templateStore: TemplateStore;
}) {
  const registerTemplate = async ({
    providerPeerIdStr,
    template,
  }: {
    providerPeerIdStr: string;
    template: Template;
  }) => {
    const entityId = computeTemplateId(providerPeerIdStr, template.data);

    if (template.templateId !== entityId) {
      throw new Error("Template ID does not match the computed ID");
    }

    await templateStore.create({
      template,
      createdByPeer: providerPeerIdStr,
    });

    return template;
  };

  return {
    registerTemplate,
  };
}
