# Cycle Quest monster sources

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

314 SRD 5.1 creatures are cross-matched by slug against the SRD entries in https://pocketdm.com.br/monsters (retrieved October 26, 2026). Numerical source data comes from https://github.com/5e-bits/5e-database/blob/main/src/2014/en/5e-SRD-Monsters.json. Community monsters, duplicate transformation forms, Pocket DM editorial descriptions, translations and token artwork are excluded.

`monsters.js` retains name, CR, source HP, highest basic attack bonus, strongest basic attack's average damage, creature type and a Cycle Quest tier. Source attack damage is not a full tabletop damage-per-round simulation. No spells, armor, resistances, dice rolls, or status effects enter gameplay.

## Adaptation

CR 0, 1/8, 1/4, 1/2 and 1 become tiers 1, 2, 3, 4 and 5. Higher CR becomes tier `3 * CR + 2`. Within each CR, source HP adjusts cycling HP by at most 18%; basic damage and attack bonus adjust health drain by at most 20%.

- Random encounters select near two tiers below the player. HP targets about 10–16 seconds at half FTP, with a 30-second cap and at most 1 HP lost/sec. Reward remains +60 XP or heal 25 HP.
- Summit encounters select five tiers higher, favoring dragons, giants, elementals and monstrosities. HP targets roughly 1.25 FTP for 60 seconds, adjusted by creature toughness. Reward remains 1,200 XP.
- Chapter bosses use the existing recommended character level for the chapter. HP targets 180 seconds at FTP before creature adjustment; time cap remains 300 seconds. Their health drain targets 80% of recommended HP over 240 seconds before attack adjustment. Reward remains 600 XP.
- All damage remains watts multiplied by existing character attack power. Chapter boss identity, HP and attack freeze when first reached and persist across retries, allowing grinding to help.
- Beyond the highest SRD tier, high-tier creatures return as Ascended enemies. Cycling stats continue to scale; battles keep their time caps.

Cycling HP, attack, tiers, role selection and endless variants are Cycle Quest adaptations, not tabletop D&D rules. The in-game Bestiary & credits dialog displays this attribution and example regular encounter stats.
