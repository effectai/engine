export type Capability = {
  icon: string;
  id: string;
  href?: string;
  name: string;
  category: string;
  description: string;
  cost: number; // Cost to acquire the capability
  estimatedEarnings: number; // Estimated earnings from using the capability
  tags: string[];
  antiCapability: string;
};

export const availableCapabilities: Capability[] = [
  {
    icon: "i-lucide-mic",
    id: "effectai/microphone-access:0.0.1",
    href: "capabilities/microphone",
    name: "Microphone Access",
    category: "Hardware",
    description: "Access to microphone for audio processing tasks",
    cost: 50,
    estimatedEarnings: 800,
    tags: ["Audio", "Processing", "Hardware"],
    antiCapability: "effectai/microphone-access:0.0.1-disabled",
  },
  {
    icon: "i-lucide-book-open",
    id: "effectai/english-language:0.0.1",
    href: "capabilities/language-english",
    name: "English Language",
    category: "Language",
    description: "Proficient in English language tasks",
    cost: 30,
    estimatedEarnings: 500,
    tags: ["Language", "English", "Communication"],
    antiCapability: "effectai/english-language:0.0.1-disabled",
  },
  {
    icon: "i-lucide-wifi",
    id: "effectai/internet-speed:0.0.1",
    href: "capabilities/internet",
    name: "Internet Speed Test",
    category: "Network",
    description: "High-speed internet connection for data-intensive tasks",
    cost: 100,
    estimatedEarnings: 1500,
    tags: ["Network", "Internet", "Speed"],
    antiCapability: "effectai/internet-speed:0.0.1-disabled",
  },
  {
    icon: "i-lucide-ghost",
    id: "effectai/halloween-spirit:0.0.1",
    href: "capabilities/halloween",
    name: "Halloween Spirit",
    category: "Seasonal",
    description: "Because even AI deserves a little fright",
    cost: 0,
    estimatedEarnings: 0,
    tags: ["Seasonal", "Spooky"],
    antiCapability: "effectai/halloween-spirit:0.0.1-disabled",
},
];
