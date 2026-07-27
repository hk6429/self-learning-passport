import { CHARACTER_CATALOG } from "../data/character-catalog.js";
import { MISSION_CATALOG } from "../data/mission-catalog.js";
import { REALM_CATALOG } from "../data/realm-catalog.js";
import { getReturnVoyage } from "./progress.js";
import { ROLE_CATALOG } from "./roles.js";

const findCharacter = (characterId) =>
  CHARACTER_CATALOG.find(({ id }) => id === characterId);

const characterDisplay = (character, displayState) => ({
  id: character.id,
  name: character.name,
  role: character.role,
  displayState,
  assetUrl: character.assets[displayState],
  alt: character.stateText[displayState].alt,
  fallback: character.stateText[displayState].fallback,
});

export function buildHomeState({ state, now = new Date().toISOString() }) {
  const voyage = getReturnVoyage(
    { activeDays: state.student.activeDays },
    { now },
  );
  const guideState = voyage ? "recover" : "idle";
  const preferredRealm =
    REALM_CATALOG.find(
      ({ subject }) => subject === state.student.primarySubject,
    ) ?? REALM_CATALOG[0];
  const returnMission = voyage
    ? MISSION_CATALOG.find(
        ({ siteId, durationMinutes }) =>
          siteId === preferredRealm.siteId && durationMinutes === 5,
      )
    : null;

  return {
    roles: ROLE_CATALOG.map((role) => ({
      ...role,
      active: role.id === state.activeRole,
    })),
    studentPreferences: {
      dailyMinutes: state.student.dailyMinutes,
      primarySubject: state.student.primarySubject,
    },
    guide: characterDisplay(findCharacter("ink-tail-guide"), guideState),
    guideCelebration: characterDisplay(
      findCharacter("ink-tail-guide"),
      "celebrate",
    ),
    realms: REALM_CATALOG.map((realm) => ({
      ...realm,
      character: realm.primaryNpcId
        ? characterDisplay(findCharacter(realm.primaryNpcId), "idle")
        : null,
      routes: MISSION_CATALOG.filter(
        ({ siteId }) => siteId === realm.siteId,
      )
        .sort((left, right) => left.durationMinutes - right.durationMinutes)
        .map((mission) => ({ ...mission })),
    })),
    restorative: voyage
      ? {
          ...voyage,
          mission: { ...returnMission },
        }
      : null,
  };
}
