export const academy = {
  name: "Shahzaib Royal Academy",
  shortName: "SRA",
  tagline: "Academic excellence, career direction, and brighter futures.",
  vision: "To empower students through academic excellence, career development, leadership skills, and global learning opportunities.",
  mission: [
    "Deliver quality education.",
    "Improve academic performance.",
    "Guide students toward successful careers.",
    "Support parents in educational decision-making.",
    "Promote entrepreneurship and innovation.",
    "Provide educational opportunities for deserving students.",
  ],
  timing: {
    days: "Monday – Saturday",
    from: "5:00 PM",
    to: "8:00 PM",
  },
  concessions: {
    orphan: { defaultPercent: 0 }, // TODO_REPLACE with the academy-approved percentage.
    widow_child: { defaultPercent: 0 }, // TODO_REPLACE with the academy-approved percentage.
    merit: { defaultPercent: 0 }, // TODO_REPLACE with the academy-approved percentage.
  },
  phone: "TODO_REPLACE_PHONE",
  whatsappNumber: "TODO_REPLACE_923001234567",
  email: "TODO_REPLACE_EMAIL",
  address: "TODO_REPLACE_ADDRESS",
  mapsEmbedUrl: "TODO_REPLACE_MAPS_EMBED_URL",
  mapsLink: "TODO_REPLACE_MAPS_LINK",
  socials: {
    facebook: "TODO_REPLACE_FACEBOOK_URL",
    instagram: "TODO_REPLACE_INSTAGRAM_URL",
    youtube: "TODO_REPLACE_YOUTUBE_URL",
  },
} as const;
