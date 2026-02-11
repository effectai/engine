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
  attempts?: number; // Maximum number of test attempts allowed (defaults to 3 if not specified)
  hidden?: boolean; // If true, hide from marketplace (but still awardable)
  prerequisite?: string; // Capability ID that must be earned before this one appears
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
    hidden: false,
    attempts: 99,
  },
  {
    icon: "i-lucide-book-open",
    id: "effectai/english-language:0.0.2",
    href: "capabilities/language-english",
    name: "English Language",
    category: "Language",
    description: "Proficient in English language tasks",
    cost: 30,
    estimatedEarnings: 500,
    tags: ["Language", "English", "Communication"],
    antiCapability: "effectai/english-language:0.0.2-disabled",
    hidden: false,
    attempts: 3,
    
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
    hidden: false,
    attempts: 99,
    
  },
  {
    icon: "i-lucide-music",
    id: "effectai/music-transcription:0.0.1",
    href: "capabilities/music-transcription",
    name: "Music Transcription",
    category: "Audio",
    description: "Ability to accurately verify music lyrics and timestamps",
    cost: 40,
    estimatedEarnings: 700,
    tags: ["Audio", "Transcription", "Music", "Lyrics"],
    antiCapability: "effectai/music-transcription:0.0.1-disabled",
    attempts: 3,
    hidden: false,
  },
  {
    icon: "i-lucide-check-circle",
    id: "effectai/music-transcription-validation:0.0.1",
    name: "Music Transcription Validation",
    category: "Audio",
    description: "Qualified to validate and review music transcription submissions",
    cost: 0,
    estimatedEarnings: 1000,
    tags: ["Audio", "Validation", "Music", "Quality"],
    antiCapability: "effectai/music-transcription-validation:0.0.1-disabled",
    attempts: 3,
    hidden: true, // Earned through Music Transcription test at 80%+
  },
  {
    icon: "i-lucide-check-square",
    id: "effectai/common-voice-validator:0.0.1",
    href: "capabilities/common-voice-validator",
    name: "Common Voice Validator",
    category: "Language",
    description: "Ability to validate sentences for the Common Voice dataset",
    cost: 35,
    estimatedEarnings: 600,
    tags: ["Language", "Validation", "Common Voice", "Quality"],
    antiCapability: "effectai/common-voice-validator:0.0.1-disabled",
    hidden: false,
    attempts: 3,
    prerequisite: "effectai/common-voice-contributor:0.0.1", // Must earn Contributor first
  },
  {
    icon: "i-lucide-pen-line",
    id: "effectai/common-voice-contributor:0.0.1",
    href: "capabilities/common-voice-contributor",
    name: "Common Voice Contributor",
    category: "Language",
    description: "Qualified to contribute high-quality sentences to Common Voice",
    cost: 30,
    estimatedEarnings: 550,
    tags: ["Language", "Contribution", "Common Voice", "Writing"],
    antiCapability: "effectai/common-voice-contributor:0.0.1-disabled",
    hidden: false,
    attempts: 3,
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
    hidden: true, // Hidden capability for Halloween fun
    attempts: 99, // Halloween spirit deserves many attempts!
},
];
