import type { VersionedPlanContent } from './types';

export const planContentVersion = '0.1.0';

export const planContentV1 = {
  version: planContentVersion,
  locales: {
    es: {
      hero: {
        title: 'Tu plan de juego',
        bodyTemplate:
          'Este es tu plan de trabajo{{aliasSuffix}}. No está pensado para que lo hagas todo a la vez. Reúne decisiones y hábitos que queremos convertir en parte natural de tu juego. Hoopjot irá tomando una idea cada vez y la llevará a tus entrenamientos y partidos. Después, lo que registres servirá para decidir qué conviene mantener, reforzar o volver a mirar.',
      },
      profileSnapshot: {
        title: 'Tu punto de partida',
      },
      howHoopjotWorks: {
        steps: [
          {
            title: 'Mira el mapa',
            body: 'El plan completo siempre está aquí.',
          },
          {
            title: 'Trabaja una idea',
            body: 'Hoy solo necesitas recordar un foco.',
          },
          {
            title: 'Juega y observa',
            body: 'No intentes evaluar todo mientras juegas.',
          },
          {
            title: 'Registra lo importante',
            body: 'Después, una valoración y una nota breve bastan.',
          },
        ],
      },
      developmentMap: {
        sections: [
          {
            id: 'attack',
            number: '01',
            title: 'Ataque',
            intro:
              'Atacar bien no significa hacer muchas cosas. Significa reconocer lo que tienes delante, ocupar un espacio útil y tomar una decisión a tiempo. El objetivo es que tus acciones sean cada vez más simples, claras y difíciles de defender.',
            subBlocks: [
              {
                id: 'attack-on-ball',
                title: 'Con balón',
                coreIdea: 'protege, observa y decide antes de que la defensa decida por ti.',
                principles: [
                  'Recibe preparada para jugar, no solo para sujetar el balón.',
                  'Protege el bote con tu cuerpo y mantén una base equilibrada.',
                  'Levanta la mirada antes de añadir un bote innecesario.',
                  'Si aparece una ventaja clara, atácala; si no, mueve el balón y vuelve a participar.',
                  'Cerca del aro, prioriza equilibrio, control y finalizaciones que puedas repetir.',
                ],
                guidelineIds: ['att.onball.protect-outside-hip', 'att.finish.two-foot-balance'],
              },
              {
                id: 'attack-off-ball',
                title: 'Sin balón',
                coreIdea: 'no desaparezcas de la jugada después de pasar el balón.',
                principles: [
                  'Mantén un espacio que ayude a quien tiene el balón.',
                  'Muéstrate en una línea de pase clara y útil.',
                  'Después de pasar, cortar o bloquear, realiza una segunda acción.',
                  'Evita quedarte mirando la jugada desde el mismo sitio.',
                  'Aprende a moverte cuando la defensa mira el balón, no cuando ya te ha visto.',
                ],
                guidelineIds: ['att.offball.show-target-window'],
              },
            ],
          },
          {
            id: 'defense',
            number: '02',
            title: 'Defensa',
            intro:
              'Defender bien empieza antes del contacto. Posición, distancia, visión y comunicación te permiten llegar antes y depender menos de una reacción tardía.',
            subBlocks: [
              {
                id: 'defense-on-ball',
                title: 'Con balón',
                coreIdea: 'contiene primero; roba solo cuando la situación lo permite.',
                principles: [
                  'Colócate para proteger la primera penetración.',
                  'Usa los pies antes que las manos.',
                  'Mantén una distancia que te permita reaccionar sin regalar el tiro.',
                  'Orienta a la atacante hacia el espacio que vuestra defensa quiere conceder.',
                  'Termina la posesión: una buena defensa no acaba hasta controlar el rebote.',
                ],
                guidelineIds: ['def.onball.contain-first-step'],
              },
              {
                id: 'defense-off-ball',
                title: 'Sin balón',
                coreIdea: 've a tu jugadora y al balón el mayor tiempo posible.',
                principles: [
                  'Ajusta tu posición cada vez que se mueve el balón.',
                  'No pierdas a tu jugadora por mirar únicamente la pelota.',
                  'Ayuda con intención y recupera con urgencia.',
                  'Habla antes de que llegue el problema: cortes, bloqueos, ayudas y cambios.',
                  'Cuanto más lejos estés del balón, más importante es entender qué puede ocurrir después.',
                ],
                guidelineIds: ['def.offball.see-player-ball'],
              },
              {
                id: 'defense-rebounding',
                title: 'Rebote',
                coreIdea:
                  'el rebote empieza localizando a una rival, no mirando la trayectoria del balón.',
                principles: [
                  'Cuando sale el tiro: localiza.',
                  'Crea contacto y gana una posición.',
                  'Después busca el balón.',
                  'Ataca el rebote con decisión y dos manos siempre que sea posible.',
                  'Tras asegurar el balón, la siguiente acción es salir de la presión y dar continuidad.',
                ],
                cue: 'TIRO → RIVAL → CONTACTO → BALÓN',
                guidelineIds: ['def.rebound.find-player-first'],
              },
            ],
          },
          {
            id: 'transition',
            number: '03',
            title: 'Transición',
            intro:
              'Los primeros segundos después de un cambio de posesión ofrecen ventajas enormes. La transición se juega antes de que todo el mundo esté colocado.',
            subBlocks: [
              {
                id: 'transition-offense',
                title: 'Cuando atacamos',
                principles: [
                  'Reacciona al cambio de posesión inmediatamente.',
                  'Corre hacia tu responsabilidad antes de mirar dónde está el balón.',
                  'Abre el campo o corre al aro según tu función.',
                  'Si no recibes, sigue formando parte de la jugada: ocupa espacio, bloquea, corta o genera una segunda acción.',
                ],
                guidelineIds: ['transition.run-immediately'],
              },
              {
                id: 'transition-defense',
                title: 'Cuando defendemos',
                principles: [
                  'Primero protege el aro y frena el balón.',
                  'Después identifica emparejamientos y amenazas.',
                  'Comunica mientras corres.',
                  'No conviertas una protesta, un error o un tiro fallado en dos segundos de ventaja para el rival.',
                ],
                guidelineIds: ['transition.stop-ball-early'],
              },
            ],
          },
          {
            id: 'communication-decisions',
            number: '04',
            title: 'Comunicación y decisiones',
            intro:
              'El juego se vuelve más sencillo cuando ves pronto, decides pronto y ayudas a tus compañeras a ver lo mismo.',
            subBlocks: [
              {
                id: 'communication',
                title: 'Comunicación',
                principles: [
                  'Habla antes de un bloqueo, no cuando ya ha ocurrido.',
                  'Usa mensajes cortos y reconocibles.',
                  'Comunica ayudas, cambios y cortes.',
                  'La comunicación útil debe dar información, no ruido.',
                ],
                guidelineIds: ['comm.screen.call-early'],
              },
              {
                id: 'decisions',
                title: 'Decisiones',
                principles: [
                  'No confundas participar con botar el balón.',
                  'Antes de atacar, identifica si existe una ventaja.',
                  'Si una compañera tiene una ventaja mejor, mueve el balón.',
                  'Una buena posesión puede necesitar que recibas, pases y vuelvas a moverte sin lanzar.',
                  'Aprende a reconocer la segunda ventaja, no solo la primera.',
                ],
                guidelineIds: ['decision.extra-pass-window'],
              },
            ],
          },
          {
            id: 'habits-attention',
            number: '05',
            title: 'Hábitos y atención',
            intro:
              'La mejora no depende de recordar veinte instrucciones durante un partido. Depende de convertir unas pocas decisiones correctas en hábitos que aparezcan sin tener que buscarlos.',
            subBlocks: [
              {
                id: 'preparation',
                title: 'Preparación',
                principles: [
                  'Llega a cada sesión con un solo foco claro.',
                  'Antes de empezar, recuerda el cue de ese día.',
                  'Durante el juego, vuelve al cue cuando te distraigas.',
                  'No intentes corregir cinco cosas a la vez.',
                ],
                guidelineIds: ['habits.prep.one-cue'],
              },
              {
                id: 'next-play',
                title: 'Siguiente jugada',
                principles: [
                  'Un error pertenece a la jugada anterior.',
                  'Reconócelo sin quedarte dentro de él.',
                  'Recupera tu posición y tu responsabilidad.',
                  'La respuesta más útil a un error suele ser jugar bien la siguiente acción.',
                ],
                guidelineIds: ['habits.confidence.next-play-reset'],
              },
            ],
          },
        ],
      },
      closing: {
        title: 'Cómo vamos a trabajar este plan',
        body: 'No necesitas memorizarlo todo. El plan está aquí para que puedas volver a él cuando quieras entender el conjunto. En el día a día, Hoopjot elegirá una sola idea. Llévala contigo al entrenamiento o al partido. Después registra brevemente qué ocurrió, qué sentiste que funcionó y qué merece volver a aparecer. La mejora no vendrá de marcar casillas, sino de repetir buenas decisiones hasta que dejen de parecer nuevas.',
      },
    },
    en: {
      hero: {
        title: 'Your game plan',
        bodyTemplate:
          'This is your development plan{{aliasSuffix}}. It is not meant to be worked on all at once. It brings together decisions and habits that should become a natural part of your game. Hoopjot will take one idea at a time into practices and games. What you record afterwards will help decide what to keep, reinforce or revisit.',
      },
      profileSnapshot: {
        title: 'Your starting point',
      },
      howHoopjotWorks: {
        steps: [
          {
            title: 'See the whole map',
            body: 'The full plan is always here.',
          },
          {
            title: 'Work on one idea',
            body: 'Today you only need to remember one focus.',
          },
          {
            title: 'Play and notice',
            body: 'Do not try to evaluate everything while you play.',
          },
          {
            title: 'Record what matters',
            body: 'Afterwards, one rating and a short note are enough.',
          },
        ],
      },
      developmentMap: {
        sections: [
          {
            id: 'attack',
            number: '01',
            title: 'Attack',
            intro:
              'Good offense does not mean doing many things. It means recognizing what is in front of you, occupying useful space and making a decision on time. The goal is for your actions to become simpler, clearer and harder to defend.',
            subBlocks: [
              {
                id: 'attack-on-ball',
                title: 'On ball',
                coreIdea: 'protect, see and decide before the defense decides for you.',
                principles: [
                  'Catch ready to play, not just to hold the ball.',
                  'Protect your dribble with your body and keep a balanced base.',
                  'Get your eyes up before adding an unnecessary dribble.',
                  'If a clear advantage appears, attack it; if not, move the ball and stay involved.',
                  'Near the rim, prioritize balance, control and finishes you can repeat.',
                ],
                guidelineIds: ['att.onball.protect-outside-hip', 'att.finish.two-foot-balance'],
              },
              {
                id: 'attack-off-ball',
                title: 'Off ball',
                coreIdea: 'do not disappear from the possession after passing the ball.',
                principles: [
                  'Keep spacing that helps the player with the ball.',
                  'Show a clear and useful passing window.',
                  'After passing, cutting or screening, make a second action.',
                  'Avoid watching the play from the same spot.',
                  'Learn to move when the defense is watching the ball, not after it has already seen you.',
                ],
                guidelineIds: ['att.offball.show-target-window'],
              },
            ],
          },
          {
            id: 'defense',
            number: '02',
            title: 'Defense',
            intro:
              'Good defense starts before contact. Position, distance, vision and communication let you arrive earlier and depend less on late reactions.',
            subBlocks: [
              {
                id: 'defense-on-ball',
                title: 'On ball',
                coreIdea: 'contain first; steal only when the situation allows it.',
                principles: [
                  'Position yourself to protect the first drive.',
                  'Use your feet before your hands.',
                  'Keep a distance that lets you react without giving away the shot.',
                  'Influence the attacker toward the space your defense wants to allow.',
                  'Finish the possession: good defense is not complete until the rebound is controlled.',
                ],
                guidelineIds: ['def.onball.contain-first-step'],
              },
              {
                id: 'defense-off-ball',
                title: 'Off ball',
                coreIdea: 'see your player and the ball for as much of the possession as possible.',
                principles: [
                  'Adjust your position every time the ball moves.',
                  'Do not lose your player by watching only the ball.',
                  'Help with purpose and recover with urgency.',
                  'Talk before the problem arrives: cuts, screens, help and switches.',
                  'The farther you are from the ball, the more important it is to understand what may happen next.',
                ],
                guidelineIds: ['def.offball.see-player-ball'],
              },
              {
                id: 'defense-rebounding',
                title: 'Rebounding',
                coreIdea:
                  'rebounding starts by finding an opponent, not by watching the flight of the ball.',
                principles: [
                  'When the shot goes up: locate.',
                  'Make contact and win position.',
                  'Then find the ball.',
                  'Pursue the rebound decisively and with two hands whenever possible.',
                  'After securing it, get out of pressure and continue the possession.',
                ],
                cue: 'SHOT → PLAYER → CONTACT → BALL',
                guidelineIds: ['def.rebound.find-player-first'],
              },
            ],
          },
          {
            id: 'transition',
            number: '03',
            title: 'Transition',
            intro:
              'The first seconds after possession changes create enormous advantages. Transition is played before everyone is set.',
            subBlocks: [
              {
                id: 'transition-offense',
                title: 'When we attack',
                principles: [
                  'React to the change of possession immediately.',
                  'Run to your responsibility before watching where the ball is.',
                  'Space the floor or run to the rim according to your role.',
                  'If you do not receive the ball, stay part of the play: space, screen, cut or make a second action.',
                ],
                guidelineIds: ['transition.run-immediately'],
              },
              {
                id: 'transition-defense',
                title: 'When we defend',
                principles: [
                  'Protect the rim and stop the ball first.',
                  'Then identify matchups and threats.',
                  'Communicate while you run.',
                  'Do not turn a complaint, mistake or missed shot into two seconds of advantage for the opponent.',
                ],
                guidelineIds: ['transition.stop-ball-early'],
              },
            ],
          },
          {
            id: 'communication-decisions',
            number: '04',
            title: 'Communication & decisions',
            intro:
              'The game becomes simpler when you see early, decide early and help teammates see the same thing.',
            subBlocks: [
              {
                id: 'communication',
                title: 'Communication',
                principles: [
                  'Talk before a screen, not after it happens.',
                  'Use short, recognizable messages.',
                  'Communicate help, switches and cuts.',
                  'Useful communication provides information, not noise.',
                ],
                guidelineIds: ['comm.screen.call-early'],
              },
              {
                id: 'decisions',
                title: 'Decisions',
                principles: [
                  'Do not confuse being involved with dribbling the ball.',
                  'Before attacking, identify whether an advantage exists.',
                  'If a teammate has a better advantage, move the ball.',
                  'A good possession may require you to catch, pass and move again without taking a shot.',
                  'Learn to recognize the second advantage, not only the first.',
                ],
                guidelineIds: ['decision.extra-pass-window'],
              },
            ],
          },
          {
            id: 'habits-attention',
            number: '05',
            title: 'Habits & attention',
            intro:
              'Improvement does not depend on remembering twenty instructions during a game. It depends on turning a few good decisions into habits that appear without having to search for them.',
            subBlocks: [
              {
                id: 'preparation',
                title: 'Preparation',
                principles: [
                  'Arrive at each session with one clear focus.',
                  "Before starting, remember that day's cue.",
                  'During play, return to the cue when your attention drifts.',
                  'Do not try to correct five things at once.',
                ],
                guidelineIds: ['habits.prep.one-cue'],
              },
              {
                id: 'next-play',
                title: 'Next play',
                principles: [
                  'A mistake belongs to the previous play.',
                  'Acknowledge it without staying inside it.',
                  'Recover your position and responsibility.',
                  'The most useful response to a mistake is usually to play the next action well.',
                ],
                guidelineIds: ['habits.confidence.next-play-reset'],
              },
            ],
          },
        ],
      },
      closing: {
        title: 'How we will work this plan',
        body: 'You do not need to memorize all of it. The plan is here so you can return whenever you want to understand the whole picture. Day to day, Hoopjot will choose one idea. Take it into practice or a game. Afterwards, record briefly what happened, what felt useful and what deserves to appear again. Improvement will not come from checking boxes. It will come from repeating good decisions until they stop feeling new.',
      },
    },
  },
} satisfies VersionedPlanContent;
