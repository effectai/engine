import { describe, vi, beforeEach, expect, it } from "vitest";
import { createMockDatastore } from "../../../tests/utils.js";
import {
  createTemplateStore,
  TemplateStore,
} from "../../core/common/stores/templateStore.js";
import { createTemplateManager } from "./createTemplateManager.js";
import { computeTemplateId } from "../../core/utils.js";
import { Template } from "../../core/messages/effect.js";

const now = Math.floor(Date.now() / 1000);

describe("createTemplateManager", () => {
  let datastore = createMockDatastore();
  let templateStore: TemplateStore;
  let templateManager: ReturnType<typeof createTemplateManager>;

  const mockProviderPeerIdStr =
    "12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5";

  beforeEach(async () => {
    templateStore = createTemplateStore({ datastore });
    templateManager = createTemplateManager({ templateStore });
  });

  describe("registerTemplate", () => {
    it("should register a template", async () => {
      const templateData = "<div>Hello World</div>";
      const templateId = computeTemplateId(mockProviderPeerIdStr, templateData);

      const template: Template = {
        title: "Test Template",
        templateId,
        data: templateData,
        createdAt: now,
      };

      const result = await templateManager.registerTemplate({
        providerPeerIdStr: mockProviderPeerIdStr,
        template,
      });

      expect(result).toEqual(template);

      const storedTemplate = await templateStore.get({ entityId: templateId });
      expect(storedTemplate).toBeDefined();
    });
  });
});
