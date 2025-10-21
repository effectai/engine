import type { EffectApplication, Template } from "../types";

const template1: Template = {
  templateId: "hello-world-template",
  type: "html",
  createdAt: 20230601,
  description: "A simple hello world template",
  capabilities: ["effectai/human-worker"],
  delegation: "round-robin",
  data: `<html><body>
	<h1>Hello, World!</h1>
	<p>This is a simple hello world template.</p>
	<input type="text" id="name" placeholder="Enter your name"/>
	</body>
	</html>`,
};

const template2: Template = {
  templateId: "run-docker-hello-world",
  type: "docker",
  createdAt: 20230601,
  capabilities: ["effectai/docker-runner"],
  description: "A simple execution template",
  data: "docker run hello-world",
};

export const HelloWorldApp: EffectApplication = {
  name: "effectai-hello-world",
  peerId: "QmExamplePeerId1234567890",
  url: "http://example.com/hello-world",
  description: "A simple hello world application",
  icon: "http://example.com/icon.png",
  tags: ["example", "hello"],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  steps: [template1, template2],
};
