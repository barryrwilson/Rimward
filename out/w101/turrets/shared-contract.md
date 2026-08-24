# Wave 101 NPC turrets — contract pointer

**Wave:** 101 vs already-hostile NPC (deputize).  
**Merge law (contract wins):** [`out/w98/turrets/shared-contract.md`](../../w98/turrets/shared-contract.md).  
**Owner Q1:** [`docs/OwnerDecisionsWave98.md`](../../../docs/OwnerDecisionsWave98.md) — do not reopen.  
**Owner Q2 ON:** [`docs/OwnerDecisionsWave101.md`](../../../docs/OwnerDecisionsWave101.md).  
**Brief:** [`docs/NpcTurretsDesign.md`](../../../docs/NpcTurretsDesign.md).  
**Predecessor impl:** [`out/w99/turrets/shared-contract.md`](../../w99/turrets/shared-contract.md).

This folder is scratch for Wave 101. It does **not** rewrite Wave 98 HUD / Digit / catalog law. If this pointer and the Wave 98 contract disagree on those, the Wave 98 contract wins. This wave **does** land vsNPC fire against that law.

Serial this wave: emit live-NPC `npcFire.target` in `tryNpcTurret`; combat turret branch spawns `bolt.vsPlayer = false`; WAVE101 boot pins + probe.
