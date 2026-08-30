# HOOPJOT — GUIDE ROLE MATRIX EN

## Normative editorial composition matrix for Guide

**Editorial status:** E0.11 — equivalent to frozen Spanish edition  
**Language:** English  
**Depends on:** `GUIDE_CORE_EN.md`  
**Canonical Spanish source:** `GUIDE_ROLE_MATRIX_ES.md` — E0.9 frozen Spanish edition

---

# 1. PURPOSE

This document defines which parts of the 30 Guide points may receive position-specific content.

It does not contain the text of the role packs.

It does not contain the text of the hybrid bridges.

Its purpose is to establish the editorial boundaries that govern the role packs and hybrid bridges in the English edition.

Guide composition is deterministic and uses exclusively prewritten content:

```text
CORE
+
PRIMARY POSITION ROLE PACK
+
OPTIONAL HYBRID POSITION BRIDGE
```

The Core contains the philosophy and common content.

The primary position determines the main perspective.

A secondary position can only introduce minor nuances through a hybrid bridge.

There is no LLM text generation at runtime and no Guide content generated specifically for an individual user.

---

# 2. PRIMARY POSITIONS

The five editorial positions are:

- PG — Point Guard
- SG — Shooting Guard
- SF — Small Forward
- PF — Power Forward
- C — Center

`primaryPosition` selects exactly one role pack.

The primary role pack always dominates Guide's positional perspective.

---

# 3. SECONDARY POSITION AND HYBRID BRIDGES

`secondaryPosition`, when present and different from `primaryPosition`, selects exactly one hybrid bridge.

The ten possible bridges are:

- PG_SG
- PG_SF
- PG_PF
- PG_C
- SG_SF
- SG_PF
- SG_C
- SF_PF
- SF_C
- PF_C

The same bridge is used in both orders.

Example:

```text
primary=PG, secondary=SG
CORE + PG + PG_SG

primary=SG, secondary=PG
CORE + SG + PG_SG
```

A hybrid bridge expresses nuances specific to the intersection of two positions.

It is neutral with respect to their order.

Its wording therefore cannot present either position as primary or secondary.

The dominant perspective always comes from the role pack selected by `primaryPosition`.

A bridge never redefines the player's game identity. It only adds brief nuances where the combination of roles creates a useful difference.

---

# 4. PERSONALIZATION PRINCIPLE

Guide is personalized by **playing role**, not by interpolating personal data.

Only these fields may select editorial content:

- `primaryPosition`
- `secondaryPosition`

No other profile value may:

- modify the text;
- select a variant;
- add a recommendation;
- remove content;
- generate a conclusion;
- be interpolated into the 30 points.

This includes:

- alias;
- birthYear;
- heightCm;
- dominantHand;
- experienceYears;
- competitiveLevel;
- weeklyPractices;
- weeklyGames;
- physicalContext.

The alias may appear in interface presentation elements, but it is not part of Guide's canonical content.

Laterality may be covered as general basketball knowledge, but `dominantHand` does not select any editorial variant.

Any additional data proposed for use in a future version requires a new explicit editorial decision defining:

1. what content it modifies;
2. what prewritten variants exist;
3. what inferences are allowed;
4. what editorial value justifies the new composition dimension.

---

# 5. TYPES OF PRIMARY INTERVENTION

A primary role pack may intervene in two ways.

## 5.1 INSERT

Adds position-specific content without removing Core text.

An insert may:

- specify responsibilities;
- establish priorities;
- provide examples;
- add reads or situations specific to the role.

An insert must add new information.

It cannot merely repeat the Core using position-associated vocabulary.

---

## 5.2 DELIMITED OVERRIDE

Replaces only an explicitly identified generic block within a point.

When an override exists:

- the replaced Core block does not appear in the compiled Guide;
- primary content occupies exactly that zone;
- all Core content outside the override boundaries remains intact.

An override never replaces:

- the point title;
- its editorial principle;
- its common structure, when the matrix requires that structure to remain;
- its common closing, unless explicitly authorized.

The purpose is to avoid placing a generic progression immediately before an equivalent position-specific progression.

The fact that a point permits an override does not require every position to use it.

If the Core is sufficiently appropriate for a position, it remains unchanged.

---

# 6. RELEVANCE PRINCIPLE

Primary intervention zones are **permissions, not quotas**.

PG, SG, SF, PF and C:

- do not need to intervene in the same points;
- do not need the same amount of text;
- do not need identical internal structure;
- do not need to reach a minimum number of inserts or overrides.

Content is added or replaced only when the position materially changes:

- the priority;
- the responsibility;
- the read;
- the technical context;
- the development order.

Positional content must not be introduced merely to manufacture artificial differences among the five role packs.

---

# 7. HYBRID BRIDGE RULES

A hybrid bridge always represents a minor nuance.

A bridge:

- never replaces Core;
- never executes overrides;
- never replaces primary role-pack content;
- never contradicts its priorities;
- never splits the identity 50/50 between the two positions;
- never creates a second complete progression;
- only adds brief observations or emphasis.

If a position combination produces no relevant difference in a point, the bridge does not intervene.

Authorized zones are permissions, not obligations.

The ten bridges do not need equal length or the same number of interventions either.

The normative sequence within a point is:

```text
INITIAL CORE
→ PRIMARY INTERVENTION, IF ANY
→ HYBRID BRIDGE, IF ANY
→ CORE CLOSING
```

If a point permits a bridge but the primary role pack does not need to intervene there, the bridge may add its nuance directly in the authorized zone.

---

# 8. ORDER AND CHAPTERS

The 30 points retain their exact canonical order.

They are grouped as follows:

## CHAPTER 1 · BUILD RELIABILITY
P01–P05

## CHAPTER 2 · BUILD YOUR GAME
P06–P10

## CHAPTER 3 · LEARN EVERY DAY
P11–P15

## CHAPTER 4 · SUSTAIN THE PROCESS
P16–P20

## CHAPTER 5 · BE PART OF A TEAM
P21–P24

## CHAPTER 6 · GROW WITH PERSPECTIVE
P25–P30

Chapters support reading and navigation.

They do not:

- merge points;
- alter numbering;
- change order;
- create new editorial units equivalent to points.

---

# 9. NORMATIVE MATRIX FOR THE 30 POINTS

| Point | Core | Primary insert | Primary override | Hybrid bridge | Editorial rule |
| --- | --- | --- | --- | --- | --- |
| **P01 · Your starting point** | Preserved in full | **ALLOWED** | NO | NO | The role may specify which early responsibilities typically build trust. Do not use factual profile data. |
| **P02 · Be available** | Preserved in full | NO | NO | NO | Common content. Do not assume injury. No medical data may personalize it. |
| **P03 · Be reliable** | Preserved in full | **ALLOWED** | NO | **ALLOWED** | May specify what reliability means in each role. The bridge only adds a nuance from the intersection. |
| **P04 · Do not try to learn everything at once** | Introduction, structure and closing are preserved | NO | **ALLOWED** | **ALLOWED** | The specific level content may be replaced by a role-specific progression. Control → effectiveness → variety remains a common principle. |
| **P05 · Keep your basketball simple** | Preserved in full | NO | NO | NO | Universal principle of reading and decision-making. |
| **P06 · Learn to play with your body** | Preserved in full | **ALLOWED** | NO | **ALLOWED** | The role may specify frequent uses of the body in that role. Laterality remains Core content as well. Do not use `heightCm` or `dominantHand`. |
| **P07 · Rebounding is a decision** | Preserved in full | **ALLOWED** | NO | **ALLOWED** | Emphasis and responsibility may vary; rebounding must never be removed as a fundamental. |
| **P08 · Run** | Preserved in full | **ALLOWED** | NO | **ALLOWED** | May specify the first offensive and defensive responsibility in transition. |
| **P09 · Understand screens** | The principle, common technical block on using screens and closing are preserved | NO | **ALLOWED** | **ALLOWED** | The Core block `USE THE SCREEN TIGHTLY`, including the `shoulder to shoulder` principle and the responsibility of the player using the screen, is invariant. Only the positional-responsibility paragraph may be replaced. |
| **P10 · Train the boring fundamentals** | Principle and closing are preserved | NO | **ALLOWED** | **ALLOWED** | The generic selection and prioritization may be replaced by role-priority fundamentals. Laterality may be addressed without using profile data. |
| **P11 · Learn basketball off the court** | Principle and review method are preserved | NO | **ALLOWED** | **ALLOWED** | Generic observation questions may be replaced by questions especially useful for the role. |
| **P12 · Keep a basketball notebook** | Preserved in full | NO | NO | NO | Common, optional tool. Do not turn it into a mandatory form. |
| **P13 · When you are corrected** | Preserved in full | NO | NO | NO | Universal learning principle. |
| **P14 · Next Play** | Preserved in full | NO | NO | NO | `NEXT PLAY` remains a shared identity phrase. |
| **P15 · Practice starts before practice** | Preserved in full | NO | NO | NO | Common content. Any individualized medical or physical work depends on professionals. |
| **P16 · Sleep is training** | Preserved in full | NO | NO | NO | General content. No individualized prescriptions. |
| **P17 · Eat to train** | Preserved in full | NO | NO | NO | General habits. Do not set calories, target weight or individual prescriptions. |
| **P18 · Take care of your body when everything is going well** | Preserved in full | NO | NO | NO | General prevention. Do not modify treatment, rehabilitation or return-to-sport plans. |
| **P19 · Do not add training out of guilt** | Preserved in full | NO | NO | NO | Do not prescribe specific loads or individual volume. |
| **P20 · Your body is not your enemy** | Preserved in full | NO | NO | NO | Injury appears only conditionally. Physical and psychological confidence may be discussed in general terms. Persistent problems are referred to appropriate professionals. |
| **P21 · Make it easy to play with you** | Preserved in full | **ALLOWED** | NO | **ALLOWED** | The role may specify actions that make the team better from that role. |
| **P22 · Talk** | Preserved in full | **ALLOWED** | NO | **ALLOWED** | May specify what information each role commonly sees and communicates. |
| **P23 · Know the systems** | Preserved in full | NO | NO | NO | Do not turn Guide into a specific team's playbook. |
| **P24 · What happens off the court counts too** | Preserved in full | NO | NO | NO | Generalizes the original academic context to studies, work and other responsibilities. |
| **P25 · Your weekly system** | Preserved in full | NO | NO | NO | The 12 ratings and 3 questions are optional. They do not imply a form, tracking or product obligation. |
| **P26 · Your development plan** | Principle, phases and closing are preserved | NO | **ALLOWED** | **ALLOWED** | The specific content of the three phases may be replaced by a role-specific progression. Reliability → impact → expansion remains the common structure. |
| **P27 · The stats that do not show up** | Principle and closing are preserved | NO | **ALLOWED** | **ALLOWED** | Examples and questions may be replaced by invisible indicators especially relevant to the position. |
| **P28 · When you do not play** | Preserved in full | NO | NO | NO | The first simple action naturally depends on the role, but no additional positional content is required. |
| **P29 · Do not compare yourself with others every day** | Preserved in full | NO | NO | NO | Longitudinal comparison with yourself. Do not use personal profile data. |
| **P30 · Your biggest advantage** | Preserved in full | NO | NO | NO | Universal closing on ability to improve. Do not infer ceiling or potential from physical or competitive data. |

---

# 10. EXACT PRIMARY INTERVENTION ZONES

| Point | Type | Exact zone |
| --- | --- | --- |
| **P01** | Insert | After `Your role on the court will influence the first responsibilities you need to master` and before `The principle is the same for everyone`. |
| **P03** | Insert | After the general explanation of how reliability changes according to role and before `First become useful`. |
| **P04** | Override | Replaces only the specific content inside levels 1, 2 and 3. The introduction, the three levels and the closing `First, control. Then, effectiveness. Finally, variety.` are preserved. |
| **P06** | Insert | After the common body and laterality content and before `Your physical qualities are a tool`. |
| **P07** | Insert | After explaining that rebounding responsibilities vary and before `What you should never do...`. |
| **P08** | Insert | After the `WE HAVE WON THE BALL` and `WE HAVE LOST THE BALL` blocks and before the closing about `getting to the right place early`. |
| **P09** | Override | Replaces only the paragraph beginning `Depending on your role, you will need to learn...`. The introduction, principle list, complete Core block `USE THE SCREEN TIGHTLY` and closing about continuing to play are preserved. No role pack or hybrid bridge may replace, trim or contradict the `shoulder to shoulder` principle. |
| **P10** | Override | Replaces the block from `Fundamentals include:` through `You need to know which ones currently support your game.` The introduction and philosophy of deliberate repetition and automatic habits are preserved. |
| **P11** | Override | Replaces the question list after `Watch players who perform roles similar to yours.` The introduction, `Do not copy only the moves`, the principle of understanding why they appear and the self-video review method are preserved. |
| **P21** | Insert | After the common examples of team behavior and before `Basketball contains a lot of work...`. |
| **P22** | Insert | After `Learn what information you can provide from your place on the court` and before `Talking well does not mean talking all the time`. |
| **P26** | Override | Replaces the specific development content inside each of the three phases. Phase names, general objectives and progression principle are preserved. |
| **P27** | Override | Replaces the examples of invisible actions and the post-game question list. The introduction about points being an incomplete measure and the closing `You can play well while scoring little... Learn the difference.` are preserved. |

---

# 11. SUMMARY OF AUTHORIZED PRIMARY ZONES

## PRIMARY INSERT ALLOWED

- P01
- P03
- P06
- P07
- P08
- P21
- P22

Total authorized zones: **7**

These are not seven mandatory interventions per role pack.

Each position uses only the zones that create a material difference.

## PRIMARY OVERRIDE ALLOWED

- P04
- P09
- P10
- P11
- P26
- P27

Total authorized zones: **6**

Overrides are always partial and delimited.

They never replace an entire point.

These are not six mandatory overrides per role pack.

## TOTAL PRIMARY INTERVENTION ZONES

13 points:

- P01
- P03
- P04
- P06
- P07
- P08
- P09
- P10
- P11
- P21
- P22
- P26
- P27

The other 17 points are Core only.

---

# 12. AUTHORIZED HYBRID BRIDGE ZONES

A bridge may only add content in:

- P03
- P04
- P06
- P07
- P08
- P09
- P10
- P11
- P21
- P22
- P26
- P27

Total: **12 possible zones**.

P01 is excluded because the starting point must be dominated exclusively by the primary position.

Within each point, the bridge is placed:

- after the primary insert, if any;
- after the primary override, if any;
- directly in the authorized positional zone if the primary does not intervene;
- always before the Core closing.

A bridge may intervene in one, several or none of these zones.

There is no minimum quota.

---

# 13. CORE-ONLY POINTS

The following points may not receive primary or hybrid content:

- P02
- P05
- P12
- P13
- P14
- P15
- P16
- P17
- P18
- P19
- P20
- P23
- P24
- P25
- P28
- P29
- P30

These 17 points are invariant common content across positions.

---

# 14. REBOUNDING, SHOOTING AND OTHER FUNDAMENTALS

Position differentiation expresses priorities.

It does not define absolute limits.

Rules such as these are not allowed:

- point guards do not rebound;
- centers do not shoot;
- shooting guards only score;
- interior players do not handle the ball;
- perimeter players do not set screens.

A position may modify:

- frequency;
- responsibility;
- context;
- priority;
- development order.

It must not arbitrarily remove a fundamental of modern basketball.

---

# 15. PHYSICAL STEREOTYPES

Role packs describe functions.

They do not describe bodies.

Do not assume:

- a center is tall;
- a point guard is short;
- a perimeter player is fast;
- an interior player is strong;
- a particular position implies a dominant hand;
- a physical characteristic determines a position.

Role packs may explain how to use particular advantages when they exist, but may not infer that they exist.

---

# 16. LATERALITY

Laterality is considered relevant basketball knowledge.

Guide may explain:

- how to use a dominant hand;
- why the non-dominant hand should be developed;
- how certain angles change;
- how to observe an opponent's laterality;
- how to adjust offensive and defensive decisions.

This content may appear:

- as a general principle in Core;
- as a technical application in a role pack;
- as a nuance in a bridge when relevant.

It is never selected according to the profile's `dominantHand` value in Guide V1.

---

# 17. INVARIANT TECHNICAL PRINCIPLE FOR SCREENS

The P09 Core content on using a screen tightly is common to all positions and combinations.

It must remain intact:

- the player using the screen must pass sufficiently close to the screener;
- the operational criterion is **shoulder to shoulder**;
- leaving space makes it easier for the defender to slip through the screen;
- closing that space is the responsibility of the player using the screen;
- the screener must maintain a legal position and must not move to correct the path of the player benefiting from the screen;
- the principle applies to both on-ball and off-ball screens.

No role pack or hybrid bridge may replace, trim, contradict or reassign this responsibility.

---

# 18. MEDICAL AND HEALTH BOUNDARY

No role pack or hybrid bridge may:

- assume an injury;
- infer an injury;
- use `physicalContext`;
- diagnose;
- prescribe rehabilitation;
- prescribe individualized load progressions;
- instruct someone to train through pain;
- decide when someone may return to competition;
- replace medical, physiotherapy or return-to-sport recommendations.

References to health, recovery and prevention must remain general.

Individual decisions belong to qualified professionals who know the case.

---

# 19. PRODUCT BOUNDARY

Guide is editorial content.

It is not a task system.

The content does not automatically imply:

- forms;
- checkboxes;
- reading percentages;
- chapter progress;
- streaks;
- badges;
- XP;
- tests;
- weekly compliance;
- mandatory reflection forms.

The reflection tools in P12 and P25 remain optional.

---

# 20. THE 12 RULES

The 12 Rules belong exclusively to the Core.

They may not receive:

- an override;
- a primary insert;
- a hybrid bridge;
- profile interpolation.

Approved text:

1. Take care of your body.
2. Arrive fully prepared.
3. Listen to your coaching staff.
4. Learn the systems.
5. Defend.
6. Box out.
7. Run the floor.
8. Make the simple things easy.
9. After a mistake: next play.
10. Make your team better.
11. Improve something every week.
12. Be consistent when nobody is watching.

---

# 21. CLOSING

Guide's final idea belongs exclusively to the Core.

It is not personalized by position.

It receives no hybrid bridge.

It does not use profile information.

Its purpose is to close the manual on a shared idea:

**the opportunity has value because it allows you to keep improving.**

---

# 22. RESTRICTIONS GOVERNING ROLE PACKS AND HYBRID BRIDGES

## E0.6 · ROLE PACKS

The five role packs may intervene only in the 13 points authorized by this matrix.

They may not modify other points.

Every intervention must be prewritten text.

Any future modification that needs to intervene outside those zones requires explicitly reopening this matrix and breaking the E0.9 freeze before introducing it.

## E0.7 · HYBRID BRIDGES

The ten bridges may add content only in the 12 authorized zones.

They may not:

- execute overrides;
- modify Core;
- replace the primary role pack;
- create a second complete progression;
- intervene outside the permitted zones.

If a combination does not need a nuance in a given point, none is written.

---

# 23. FINAL COMPOSITION PRINCIPLE

The resulting Guide should feel like one coherent manual.

Not three documents pasted together.

The Core provides the philosophy.

The primary position provides the perspective.

The position combination adds only useful nuances.

Personalization should be noticeable because the content understands the player's responsibilities better.

Not because it repeats data the player already knows.
