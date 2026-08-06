\- Reputation and fear visibly open and close different opportunities.



\### Presentation



\- The ship remains the visual center of play.

\- The HUD never obscures the ship, target, or projectile path.

\- Important states are legible without relying on color.

\- Audio meaningfully replaces HUD clutter.

\- Civilization feels warmer and more talkative than the rim.



\### Narrative and agency



\- The player can ignore every authored story and still enjoy a complete sandbox life.

\- Origins create situations without imposing personalities.

\- Severe choices are clear and consequential but not editorialized.

\- The mystery increases curiosity before it increases explanation.

\- Credits or endings do not terminate the sandbox.



\### Bio companion



\- The living ship feels alive before the player reads a status label.

\- Its mood and wounds affect how the player chooses to fly.

\- Growth visibly reflects the player's history.

\- Care feels like attachment and strategy, not scheduled chores.

\- Ordinary defeat creates recovery and tenderness, not surprise permanent loss.



\---



\## 26. Recommended Priority Order for Independent Harnesses



This is a product-validation order, not a coding prescription.



1\. \*\*Flight toy:\*\* steering, throttle, strafe, drag, chase camera, afterburner, drift.

2\. \*\*Readable duel:\*\* projectiles, target lead, shields, hull, disable state, one hostile.

3\. \*\*Fear encounter:\*\* resolve, telegraphs, surrender, cargo jettison, scoop, restraint economics.

4\. \*\*Small living system:\*\* traffic with identities/routes, one market, local incidents, persistence, aftermath.

5\. \*\*Sandbox in miniature:\*\* trade, mine, pirate, hunt, serve, dock, buy/sell, reputation/fear.

6\. \*\*Neighborhood:\*\* one authored system worth learning and revisiting.

7\. \*\*Broader world:\*\* more systems, factions, contacts, jobs, world-event variety.

8\. \*\*Rimward journey:\*\* distance bands, sparse travel, mystery clues, landmarks, designed silence.

9\. \*\*Living companion:\*\* only after its visual, emotional, and parity targets can be protected.

10\. \*\*Content and polish:\*\* faction epics, origin variety, final audio, visuals, accessibility, and onboarding.



If a lower layer is not fun, a higher layer should not be used to hide it.



\---



\## 27. Source-of-Truth Notes



This handoff synthesizes the repository's canonical game design, UX, narrative, epic definitions, current implementation status, and live tuning data. When more detail is needed, use these sources in this order:



1\. \[`gdd.md`](../\_bmad-output/planning-artifacts/gdds/gdd-3dSpaceSim-2026-07-14/gdd.md) for the product and game rules.

2\. \[`EXPERIENCE.md`](../\_bmad-output/planning-artifacts/ux-designs/ux-3dSpaceSim-2026-07-14/EXPERIENCE.md) and \[`DESIGN.md`](../\_bmad-output/planning-artifacts/ux-designs/ux-3dSpaceSim-2026-07-14/DESIGN.md) for player-facing interaction and presentation.

3\. \[`epics.md`](../\_bmad-output/planning-artifacts/gdds/gdd-3dSpaceSim-2026-07-14/epics.md) for content boundaries and the intended build sequence.

4\. \[`narrative-design.md`](../\_bmad-output/narrative-design.md) for controlled narrative canon and the buried truth.

5\. \[`GameData`](../unity/Assets/StreamingAssets/GameData/) for represented tuning baselines.

6\. \[`sprint-status.yaml`](../\_bmad-output/implementation-artifacts/sprint-status.yaml) and story artifacts for represented-versus-planned status.



Do not copy the buried truth into ordinary downstream implementation documents. Mystery-facing work should reference the controlled narrative source without restating the reveal.



\---



\## 28. Compact Glossary



| Term | Meaning |

|---|---|

| \*\*UU\*\* | Universal Units, the currency and a physical high-value energy-cell commodity |

| \*\*Screen\*\* | Outer, in-combat-recharging shield layer |

| \*\*Shell\*\* | Inner shield layer that requires a clean interval to recover |

| \*\*Resolve\*\* | An NPC's current willingness to continue resisting |

| \*\*Fear rating\*\* | The player's persistent intimidation reputation |

| \*\*Wolfeye\*\* | Scanner ladder that reveals resolve with increasing precision |

| \*\*Vector-hold\*\* | Drift mode that decouples facing from velocity |

| \*\*Q-ship\*\* | A trader or civilian-looking hull with concealed combat capability |

| \*\*Prize ship\*\* | A disabled hull claimed by the player |

| \*\*Hot hull\*\* | A captured ship that must be laundered before legal sale |

| \*\*Whisper Network\*\* | Maintained network of corrupt officials, fences, vouches, and services |

| \*\*Drama density\*\* | Pacing principle that maintains memorable incidents without flooding the player |

| \*\*Instantiation bubble\*\* | Local area where persistent world records become visible live ships |

| \*\*Witness Rule\*\* | Aftermath may only represent a real recorded incident |

| \*\*Band 0–3+\*\* | Spatial difficulty and narrative-depth bands moving rimward |

| \*\*Time Dilator\*\* | In-fiction travel-compression hardware |

| \*\*The Beautiful Ones\*\* | Faction and play path centered on living companion ships |

| \*\*Heresy graft\*\* | Powerful taboo bio modification with social and existential risk |

| \*\*Living rock\*\* | Valuable living mineral and premium bio-ship food |

| \*\*Named ace / Named Gun\*\* | Memorable rival pilot with signature tactics and public reputation |



\---



\## 29. Final Product Test



RIMWARD is working when a player can tell a story like this without having followed a scripted quest:



> I left dock planning to run restricted components across two systems. A blockade pushed the destination price up, but raiders found me on the lane. I paid one off, bluffed the other with hidden mounts, and followed its wake after it ran. The trail led to a wreck field from a convoy I never saw die. I found a survivor's cargo, sold it through a contact who now owes me a favor, and came home with less money than planned but a better story. At the station, someone used my ship's name.



The full bio-path version adds one last line:



> On the way home, she started singing differently, and I knew what the trip had made of her.



That combination—satisfying flight, systemic cause and effect, chosen identity, and attachment to the ship—is the game.

