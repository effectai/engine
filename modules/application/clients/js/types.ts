export type Template = {
  templateId: string;
  description?: string;
  capabilities?: string[];
  delegation?: "round-robin" | "random" | "single" | "all";
  data: string;
  createdAt: number;
  type: "html" | "docker" | "python" | "bash" | "text";
};

export type EffectApplication = {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  tags?: string[];

  //the peerId that created this application
  peerId: string;
  createdAt: number;
  updatedAt: number;
  steps: Template[];
};
