# HOOPJOT — GUIDE ROLE MATRIX ES

## Matriz normativa de composición editorial de Guide

**Estado editorial:** E0.5 — redacción final para aprobación  
**Idioma:** Español  
**Depende de:** `GUIDE_CORE_ES.md`  
**Fuente canónica original:** `GUIDE_SOURCE_IRIA_ES.md`

---

# 1. PROPÓSITO

Este documento define qué partes de los 30 puntos de Guide pueden recibir contenido específico según la posición.

No contiene el texto de los role packs.

No contiene el texto de los hybrid bridges.

Su función es establecer los límites editoriales dentro de los cuales podrán redactarse posteriormente.

La composición de Guide es determinista y utiliza exclusivamente contenido preescrito:

```text
CORE
+
PRIMARY POSITION ROLE PACK
+
OPTIONAL HYBRID POSITION BRIDGE
```

El Core contiene la filosofía y el contenido común.

La posición primaria determina la perspectiva principal.

La combinación con una posición secundaria solo puede introducir matices menores mediante un hybrid bridge.

No existe generación de texto mediante LLM en runtime ni contenido de Guide generado específicamente para un usuario.

---

# 2. POSICIONES PRIMARIAS

Las cinco posiciones editoriales son:

- PG — Base
- SG — Escolta
- SF — Alero
- PF — Ala-pívot
- C — Pívot

`primaryPosition` selecciona un único role pack.

El role pack primario domina siempre la perspectiva posicional de Guide.

---

# 3. POSICIÓN SECUNDARIA Y HYBRID BRIDGES

`secondaryPosition`, cuando existe y es distinta de `primaryPosition`, selecciona un único hybrid bridge.

Los diez bridges posibles son:

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

El mismo bridge se utiliza en ambos órdenes.

Ejemplo:

```text
primary=PG, secondary=SG
CORE + PG + PG_SG

primary=SG, secondary=PG
CORE + SG + PG_SG
```

Un hybrid bridge expresa matices propios de la intersección entre dos posiciones.

Es neutro respecto al orden de ambas.

Por tanto, su redacción no puede presentar ninguna de las dos posiciones como primaria o secundaria.

La perspectiva dominante procede siempre del role pack seleccionado por `primaryPosition`.

Un bridge nunca redefine la identidad de juego. Solo añade matices breves allí donde la combinación de funciones aporta una diferencia útil.

---

# 4. PRINCIPIO DE PERSONALIZACIÓN

Guide se personaliza por **función de juego**, no mediante interpolación de datos personales.

Solo estos datos pueden seleccionar contenido editorial:

- `primaryPosition`
- `secondaryPosition`

Ningún otro valor del perfil puede:

- modificar el texto;
- seleccionar una variante;
- añadir una recomendación;
- eliminar contenido;
- generar una conclusión;
- interpolarse dentro de los 30 puntos.

Esto incluye:

- alias;
- birthYear;
- heightCm;
- dominantHand;
- experienceYears;
- competitiveLevel;
- weeklyPractices;
- weeklyGames;
- physicalContext.

El alias podrá aparecer en elementos de presentación de la interfaz, pero no forma parte del contenido canónico de Guide.

La lateralidad sí puede tratarse como conocimiento general de baloncesto, pero `dominantHand` no selecciona ninguna variante editorial.

Cualquier dato adicional que se quiera utilizar en una futura versión requerirá una nueva decisión editorial explícita que determine:

1. qué contenido modifica;
2. qué variantes preescritas existen;
3. qué inferencias están permitidas;
4. qué valor editorial justifica la nueva dimensión de composición.

---

# 5. TIPOS DE INTERVENCIÓN PRIMARIA

Un role pack primario puede intervenir de dos formas.

## 5.1 INSERT

Añade contenido específico de posición sin eliminar el texto del Core.

El insert puede:

- concretar responsabilidades;
- establecer prioridades;
- aportar ejemplos;
- añadir lecturas o situaciones propias de la función.

Un insert debe aportar información nueva.

No puede limitarse a repetir el Core utilizando vocabulario asociado a la posición.

---

## 5.2 OVERRIDE DELIMITADO

Sustituye únicamente un bloque genérico expresamente identificado dentro de un punto.

Cuando existe override:

- el bloque Core sustituido no aparece en la Guide compilada;
- el contenido primario ocupa exactamente esa zona;
- todo el Core situado fuera de los límites del override permanece intacto.

Un override nunca sustituye:

- el título del punto;
- su principio editorial;
- su estructura común, cuando la matriz exige conservarla;
- su cierre común, salvo autorización expresa.

El objetivo es evitar que una progresión genérica aparezca inmediatamente antes de otra equivalente pero específica.

Que un punto permita override no obliga a ninguna posición a utilizarlo.

Si el Core resulta suficientemente adecuado para una posición, se conserva.

---

# 6. PRINCIPIO DE RELEVANCIA

Las zonas de intervención primaria son **permisos, no cuotas**.

PG, SG, SF, PF y C:

- no tienen que intervenir en los mismos puntos;
- no necesitan la misma cantidad de texto;
- no necesitan idéntica estructura interna;
- no necesitan alcanzar un número mínimo de inserts u overrides.

Solo se añade o sustituye contenido cuando la posición cambia de forma material:

- la prioridad;
- la responsabilidad;
- la lectura;
- el contexto técnico;
- el orden de desarrollo.

No se introducirá contenido posicional únicamente para crear diferencias artificiales entre los cinco role packs.

---

# 7. REGLAS DE LOS HYBRID BRIDGES

Un hybrid bridge representa siempre un matiz menor.

Un bridge:

- nunca sustituye Core;
- nunca ejecuta overrides;
- nunca sustituye contenido del role pack primario;
- nunca contradice sus prioridades;
- nunca reparte la identidad al 50 % entre las dos posiciones;
- nunca crea una segunda progresión completa;
- solo añade observaciones o énfasis breves.

Si la combinación de posiciones no produce una diferencia relevante en un punto, el bridge no interviene.

Las zonas autorizadas son permisos, no obligaciones.

Los diez bridges tampoco necesitan igual longitud ni el mismo número de intervenciones.

La secuencia normativa dentro de un punto es:

```text
CORE INICIAL
→ INTERVENCIÓN PRIMARIA, SI EXISTE
→ HYBRID BRIDGE, SI EXISTE
→ CIERRE CORE
```

Si un punto permite bridge pero el role pack primario no necesita intervenir en él, el bridge puede añadir su matiz directamente en la zona autorizada.

---

# 8. ORDEN Y CAPÍTULOS

Los 30 puntos mantienen exactamente su orden canónico.

Quedan agrupados así:

## CAPÍTULO 1 · CONSTRUIR FIABILIDAD
P01–P05

## CAPÍTULO 2 · CONSTRUIR TU JUEGO
P06–P10

## CAPÍTULO 3 · APRENDER CADA DÍA
P11–P15

## CAPÍTULO 4 · SOSTENER EL PROCESO
P16–P20

## CAPÍTULO 5 · SER PARTE DE UN EQUIPO
P21–P24

## CAPÍTULO 6 · CRECER CON PERSPECTIVA
P25–P30

Los capítulos sirven para lectura y navegación.

No:

- fusionan puntos;
- alteran su numeración;
- cambian su orden;
- crean nuevas unidades editoriales equivalentes a los puntos.

---

# 9. MATRIZ NORMATIVA DE LOS 30 PUNTOS

| Punto | Core | Insert primario | Override primario | Hybrid bridge | Regla editorial |
| --- | --- | --- | --- | --- | --- |
| **P01 · Tu punto de partida** | Se conserva íntegro | **PERMITIDO** | NO | NO | El rol puede concretar qué primeras responsabilidades suelen construir confianza. No usar datos factuales del perfil. |
| **P02 · Estar disponible** | Se conserva íntegro | NO | NO | NO | Contenido común. No asumir lesión. Ningún dato médico puede personalizarlo. |
| **P03 · Ser fiable** | Se conserva íntegro | **PERMITIDO** | NO | **PERMITIDO** | Puede concretar qué significa ser fiable en cada función. El bridge solo añade un matiz de la intersección. |
| **P04 · No intentes aprender todo a la vez** | Se conservan introducción, estructura y cierre | NO | **PERMITIDO** | **PERMITIDO** | Puede sustituirse el contenido concreto de los niveles por una progresión específica de rol. Seguridad → eficacia → variedad permanece como principio común. |
| **P05 · Baloncesto simple** | Se conserva íntegro | NO | NO | NO | Principio universal de lectura y toma de decisiones. |
| **P06 · Aprende a jugar con tu cuerpo** | Se conserva íntegro | **PERMITIDO** | NO | **PERMITIDO** | El rol puede concretar usos del cuerpo frecuentes en su función. La lateralidad permanece también como contenido Core. No utilizar `heightCm` ni `dominantHand`. |
| **P07 · El rebote es una decisión** | Se conserva íntegro | **PERMITIDO** | NO | **PERMITIDO** | Debe variar el énfasis y la responsabilidad, nunca eliminar el rebote como fundamento. |
| **P08 · Corre** | Se conserva íntegro | **PERMITIDO** | NO | **PERMITIDO** | Puede concretar la primera responsabilidad ofensiva y defensiva en transición. |
| **P09 · Entiende los bloqueos** | Se conservan principio y cierre | NO | **PERMITIDO** | **PERMITIDO** | Puede sustituirse el bloque genérico de responsabilidades por el juego de bloqueos propio de cada función. |
| **P10 · Fundamentos aburridos** | Se conservan principio y cierre | NO | **PERMITIDO** | **PERMITIDO** | Puede sustituirse la selección y priorización genérica por fundamentos prioritarios del rol. Puede tratarse la lateralidad sin utilizar datos del perfil. |
| **P11 · Aprende baloncesto fuera de la pista** | Se conservan principio y método de revisión | NO | **PERMITIDO** | **PERMITIDO** | Pueden sustituirse las preguntas genéricas de observación por preguntas especialmente útiles para el rol. |
| **P12 · Cuaderno de baloncesto** | Se conserva íntegro | NO | NO | NO | Herramienta común y opcional. No convertirla en formulario obligatorio. |
| **P13 · Cuando te corrijan** | Se conserva íntegro | NO | NO | NO | Principio universal de aprendizaje. |
| **P14 · Next Play** | Se conserva íntegro | NO | NO | NO | `NEXT PLAY` permanece como expresión identitaria común. |
| **P15 · Antes del entrenamiento** | Se conserva íntegro | NO | NO | NO | Contenido común. Cualquier trabajo médico o físico individual depende de profesionales. |
| **P16 · Dormir es entrenar** | Se conserva íntegro | NO | NO | NO | Contenido general. Sin prescripciones individualizadas. |
| **P17 · Come para entrenar** | Se conserva íntegro | NO | NO | NO | Hábitos generales. No fijar calorías, peso objetivo ni prescripciones individuales. |
| **P18 · Cuida tu cuerpo cuando todo vaya bien** | Se conserva íntegro | NO | NO | NO | Prevención general. No modificar tratamientos, rehabilitación o readaptación. |
| **P19 · No añadas entrenamiento por culpa** | Se conserva íntegro | NO | NO | NO | No prescribir cargas concretas ni volumen individual. |
| **P20 · Tu cuerpo no es tu enemigo** | Se conserva íntegro | NO | NO | NO | La lesión aparece solo de forma condicional. La confianza física y psicológica puede tratarse en términos generales. Los problemas persistentes se remiten a profesionales adecuados. |
| **P21 · Haz que sea fácil jugar contigo** | Se conserva íntegro | **PERMITIDO** | NO | **PERMITIDO** | El rol puede concretar acciones que hacen mejor al equipo desde esa función. |
| **P22 · Habla** | Se conserva íntegro | **PERMITIDO** | NO | **PERMITIDO** | Puede concretarse qué información suele ver y comunicar cada función. |
| **P23 · Conoce los sistemas** | Se conserva íntegro | NO | NO | NO | No convertir Guide en un playbook de un equipo concreto. |
| **P24 · Fuera de la pista** | Se conserva íntegro | NO | NO | NO | Generaliza el contexto académico original a estudios, trabajo y otras responsabilidades. |
| **P25 · Sistema semanal** | Se conserva íntegro | NO | NO | NO | Las 12 valoraciones y las 3 preguntas son opcionales. No implican formulario, tracking ni obligación de producto. |
| **P26 · Plan de desarrollo** | Se conservan principio, fases y cierre | NO | **PERMITIDO** | **PERMITIDO** | Puede sustituirse el contenido específico de las tres fases por una progresión propia del rol. Fiabilidad → impacto → ampliación permanece como estructura común. |
| **P27 · Estadísticas que no aparecen** | Se conservan principio y cierre | NO | **PERMITIDO** | **PERMITIDO** | Pueden sustituirse ejemplos y preguntas por indicadores invisibles especialmente relevantes para la posición. |
| **P28 · Cuando no juegues** | Se conserva íntegro | NO | NO | NO | La primera acción sencilla dependerá naturalmente de la función, pero no requiere contenido posicional adicional. |
| **P29 · No te compares cada día** | Se conserva íntegro | NO | NO | NO | Comparación longitudinal con uno mismo. No utilizar datos personales del perfil. |
| **P30 · Tu mayor ventaja** | Se conserva íntegro | NO | NO | NO | Cierre universal sobre capacidad de mejora. No inferir techo ni potencial desde datos físicos o competitivos. |

---

# 10. ZONAS EXACTAS DE INTERVENCIÓN PRIMARIA

| Punto | Tipo | Zona exacta |
| --- | --- | --- |
| **P01** | Insert | Después de «Tu función en pista influirá en las primeras responsabilidades que debas dominar» y antes de «El principio es común». |
| **P03** | Insert | Después de la explicación general sobre cómo cambia la fiabilidad según la función y antes de «Primero conviértete en alguien útil». |
| **P04** | Override | Sustituye únicamente el contenido específico de los niveles 1, 2 y 3. Se conservan la introducción, los tres niveles y el cierre «Primero seguridad. Después eficacia. Finalmente variedad». |
| **P06** | Insert | Después del contenido común sobre cuerpo y lateralidad y antes de «Tu físico es una herramienta». |
| **P07** | Insert | Después de explicar que las responsabilidades de rebote varían y antes de «Lo que nunca deberías hacer...». |
| **P08** | Insert | Después de los bloques «Hemos recuperado el balón» y «Hemos perdido el balón», y antes del cierre sobre «llegar pronto al lugar correcto». |
| **P09** | Override | Sustituye únicamente el párrafo que comienza «Según tu función tendrás que aprender...». Se conservan la introducción, la lista de principios y el cierre sobre seguir jugando. |
| **P10** | Override | Sustituye el bloque comprendido desde «Entre los fundamentos están:» hasta «Necesitas saber cuáles sostienen ahora mismo tu juego». Se conservan la introducción y la filosofía sobre repetición consciente y automatismos. |
| **P11** | Override | Sustituye la lista de preguntas situada después de «Mira a quienes desempeñan funciones parecidas a las tuyas». Se conservan la introducción, «No copies únicamente movimientos», el principio de entender por qué aparecen y el método de revisión del propio vídeo. |
| **P21** | Insert | Después de los ejemplos comunes de comportamiento de equipo y antes de «El baloncesto contiene mucho trabajo...». |
| **P22** | Insert | Después de «Aprende qué información puedes aportar desde tu lugar en pista» y antes de «Hablar bien no significa hablar sin parar». |
| **P26** | Override | Sustituye el desarrollo específico situado dentro de cada una de las tres fases. Se conservan los nombres de las fases, sus objetivos generales y el principio de progresión. |
| **P27** | Override | Sustituye los ejemplos de acciones invisibles y la lista de preguntas posteriores al partido. Se conservan la introducción sobre los puntos como medida incompleta y el cierre «Puedes jugar bien anotando poco... Aprende la diferencia». |

---

# 11. RESUMEN DE ZONAS PRIMARIAS AUTORIZADAS

## INSERT PRIMARIO PERMITIDO

- P01
- P03
- P06
- P07
- P08
- P21
- P22

Total de zonas autorizadas: **7**

No son siete intervenciones obligatorias por role pack.

Cada posición utilizará únicamente las que aporten una diferencia material.

## OVERRIDE PRIMARIO PERMITIDO

- P04
- P09
- P10
- P11
- P26
- P27

Total de zonas autorizadas: **6**

Los overrides siempre son parciales y delimitados.

Nunca sustituyen el punto completo.

No son seis overrides obligatorios por role pack.

## TOTAL DE ZONAS DE INTERVENCIÓN PRIMARIA

13 puntos:

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

Los otros 17 puntos son exclusivamente Core.

---

# 12. ZONAS AUTORIZADAS PARA HYBRID BRIDGES

Un bridge solo puede añadir contenido en:

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

Total: **12 zonas posibles**.

P01 queda fuera porque el punto de partida debe estar dominado exclusivamente por la posición primaria.

En cada punto, el bridge se coloca:

- después del insert primario, si existe;
- después del override primario, si existe;
- directamente en la zona posicional autorizada si el primary no interviene;
- siempre antes del cierre Core.

Un bridge puede intervenir en una, varias o ninguna de estas zonas.

No existe cuota mínima.

---

# 13. PUNTOS EXCLUSIVAMENTE CORE

Los siguientes puntos no pueden recibir contenido primario ni híbrido:

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

Estos 17 puntos constituyen contenido común invariable entre posiciones.

---

# 14. REBOTE, TIRO Y OTROS FUNDAMENTOS

La diferenciación por posición expresa prioridades.

No define límites absolutos.

No se permitirá escribir reglas como:

- los bases no rebotean;
- los pívots no tiran;
- los escoltas solo anotan;
- los interiores no manejan;
- los exteriores no bloquean.

Una posición puede modificar:

- frecuencia;
- responsabilidad;
- contexto;
- prioridad;
- orden de desarrollo.

No debe eliminar arbitrariamente un fundamento del baloncesto moderno.

---

# 15. ESTEREOTIPOS FÍSICOS

Los role packs describen funciones.

No describen cuerpos.

No asumir:

- que un pívot es alto;
- que un base es bajo;
- que un jugador exterior es rápido;
- que un interior es fuerte;
- que determinada posición implica una mano dominante;
- que una característica física determina una posición.

Los role packs pueden explicar cómo utilizar determinadas ventajas cuando existen, pero no inferir que existen.

---

# 16. LATERALIDAD

La lateralidad se considera conocimiento baloncestístico relevante.

Guide puede explicar:

- cómo aprovechar la mano dominante;
- por qué debe desarrollarse la mano no dominante;
- cómo cambian determinados ángulos;
- cómo observar la lateralidad de un rival;
- cómo ajustar decisiones ofensivas y defensivas.

Este contenido puede aparecer:

- como principio general en Core;
- como aplicación técnica en un role pack;
- como matiz en un bridge cuando resulte relevante.

Nunca se seleccionará según el valor de `dominantHand` del perfil en Guide V1.

---

# 17. LÍMITE MÉDICO Y DE SALUD

Ningún role pack ni hybrid bridge puede:

- asumir una lesión;
- inferir una lesión;
- utilizar `physicalContext`;
- diagnosticar;
- prescribir rehabilitación;
- prescribir progresiones de carga individuales;
- indicar entrenar con dolor;
- establecer cuándo una persona puede volver a competir;
- sustituir recomendaciones médicas, de fisioterapia o readaptación.

Las referencias a salud, recuperación y prevención deben mantenerse generales.

Las decisiones individuales corresponden a profesionales cualificados que conozcan el caso.

---

# 18. LÍMITE DE PRODUCTO

Guide es contenido editorial.

No constituye un sistema de tareas.

El contenido no implica automáticamente:

- formularios;
- checkboxes;
- porcentajes de lectura;
- progreso de capítulos;
- streaks;
- badges;
- XP;
- tests;
- cumplimiento semanal;
- formularios obligatorios de reflexión.

Las herramientas de reflexión incluidas en P12 y P25 permanecen opcionales.

---

# 19. LAS 12 REGLAS

Las 12 Rules pertenecen exclusivamente al Core.

No pueden recibir:

- override;
- insert primario;
- hybrid bridge;
- interpolación de perfil.

Texto aprobado:

1. Cuida tu cuerpo.
2. Llega con todo preparado.
3. Escucha al cuerpo técnico.
4. Aprende los sistemas.
5. Defiende.
6. Cierra el rebote.
7. Corre el campo.
8. Haz fácil lo sencillo.
9. Después de un error: next play.
10. Haz mejor a tu equipo.
11. Mejora algo cada semana.
12. Sé constante cuando nadie esté mirando.

---

# 20. CIERRE

La idea final de Guide pertenece exclusivamente al Core.

No se personaliza por posición.

No recibe hybrid bridge.

No utiliza información del perfil.

Su función es cerrar el manual sobre una idea común:

**la oportunidad tiene valor porque permite seguir mejorando.**

---

# 21. RESTRICCIONES PARA E0.6 Y E0.7

## E0.6 · ROLE PACKS

Los cinco role packs solo podrán intervenir en los 13 puntos autorizados por esta matriz.

No podrán modificar otros puntos.

Toda intervención debe ser texto preescrito.

Si durante su redacción aparece una necesidad editorial legítima fuera de esas zonas, deberá reabrirse E0.5 antes de introducirla.

## E0.7 · HYBRID BRIDGES

Los diez bridges solo podrán añadir contenido en las 12 zonas autorizadas.

No podrán:

- ejecutar overrides;
- modificar Core;
- sustituir el role pack primario;
- crear una segunda progresión completa;
- intervenir fuera de las zonas permitidas.

Si una combinación no necesita un matiz en determinado punto, no se escribirá ninguno.

---

# 22. PRINCIPIO FINAL DE COMPOSICIÓN

La Guide resultante debe sentirse como un único manual coherente.

No como tres documentos pegados.

El Core aporta la filosofía.

La posición primaria aporta la perspectiva.

La combinación de posiciones añade únicamente matices cuando sean útiles.

La personalización debe ser perceptible porque el contenido entiende mejor las responsabilidades del jugador.

No porque repita datos que el jugador ya conoce.
