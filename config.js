// Game configuration
export const config = {
  // Card types
  cardTypes: [
    "Character", 
    "Weapon", 
    "Infected", 
    "Item", 
    "Action", 
    "Ammo"
  ],
  
  // Character skills progression
  characterSkillLevels: [
    { decorations: 0, description: "No skills unlocked" },
    { decorations: 2, description: "First skill unlocked" },
    { decorations: 5, description: "Second skill unlocked" },
    { decorations: 8, description: "Enhanced skills unlocked" }
  ],
  
  // Weapon types
  weaponTypes: [
    "Handgun",
    "Shotgun",
    "Magnum",
    "Machine Gun",
    "Rifle",
    "Knife",
    "Grenade",
    "Special"
  ],
  
  // Game modes
  gameModes: [
    "Story Mode",
    "Mercenary Mode",
    "Versus Mode",
    "Partner Mode",
    "Infection Mode"
  ],
  
  // Card set expansions
  expansions: [
    "Premier Edition",
    "Alliance",
    "Outbreak",
    "Nightmare",
    "Mercenaries",
    "Custom"
  ]
};

