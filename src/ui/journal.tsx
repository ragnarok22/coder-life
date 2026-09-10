import { Award, Check, LockKeyhole, Users } from "lucide-react";
import { useGame } from "../game/store";
import { achievements } from "../data/achievements";
import { endings } from "../data/endings";
import { npcs } from "../data/content";
import { BALANCE } from "../data/balance";
import { clock } from "../game/rules";
import { Modal } from "./modal";
import { useMemo } from "react";

export function Journal({ onClose }: { onClose: () => void }) {
  const game = useGame((s) => s.game),
    profile = useGame((s) => s.profile);
  const unlockedAchievements = useMemo(
    () => new Set(profile.achievements),
    [profile.achievements],
  );
  const discoveredEndings = useMemo(
    () => new Set(profile.endings),
    [profile.endings],
  );
  return (
    <Modal
      title="The Monday dossier."
      subtitle="RELATIONSHIPS & MILESTONES"
      wide
      onClose={onClose}
    >
      <div className="journal-summary">
        <span>
          BEST SCORE<strong>{profile.bestScore}</strong>
        </span>
        <span>
          MONDAYS SURVIVED<strong>{profile.completedRuns}</strong>
        </span>
        <span>
          ENDINGS FOUND
          <strong>
            {profile.endings.length} / {endings.length}
          </strong>
        </span>
      </div>
      <h3 className="journal-heading">
        <Users size={16} /> Your office people
      </h3>
      <div className="journal-people">
        {npcs.map((n) => {
          const relation = game.relations[n.id] ?? 0;
          return (
            <div key={n.id}>
              <i style={{ background: n.color }}>{n.name[0]}</i>
              <div>
                <strong>
                  {n.name} <small>· {n.role}</small>
                </strong>
                <p>{n.personality?.description}</p>
              </div>
              <span
                className={
                  relation >= BALANCE.goodRelationship
                    ? "trust-good"
                    : relation <= BALANCE.hostileRelationship
                      ? "trust-bad"
                      : ""
                }
              >
                {relation >= BALANCE.goodRelationship
                  ? "On your side"
                  : relation <= BALANCE.hostileRelationship
                    ? "Strained"
                    : relation > 0
                      ? "Warming up"
                      : "Neutral"}
              </span>
            </div>
          );
        })}
      </div>
      <h3 className="journal-heading">
        <Award size={16} /> Achievements{" "}
        <small>
          {profile.achievements.length} / {achievements.length}
        </small>
      </h3>
      <div className="journal-achievements">
        {achievements.map((a) => {
          const unlocked = unlockedAchievements.has(a.id);
          return (
            <div key={a.id} className={unlocked ? "unlocked" : ""}>
              {unlocked ? <Award size={18} /> : <LockKeyhole size={16} />}
              <div>
                <strong>{a.title}</strong>
                <p>{a.description}</p>
              </div>
              {unlocked && <Check size={13} />}
            </div>
          );
        })}
      </div>
      <h3 className="journal-heading">Endings discovered</h3>
      <div className="journal-endings">
        {endings.map((e) => (
          <div
            key={e.id}
            className={discoveredEndings.has(e.id) ? "discovered" : ""}
          >
            <strong>
              {discoveredEndings.has(e.id) ? e.title : "Undiscovered ending"}
            </strong>
            <p>{e.description}</p>
          </div>
        ))}
      </div>
      {game.history.length > 0 && (
        <>
          <h3 className="journal-heading">Today, in questionable decisions</h3>
          <ol className="day-timeline">
            {game.history.slice(-12).map((e, i) => (
              <li key={`${e.id}-${e.at}-${i}`}>
                <time>{clock(e.at)}</time>
                <span>
                  {e.title}
                  <small>{e.choice}</small>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="fine-print">
        Day 1 seed: {game.seed}. Trust resets with each new Monday; your
        achievements, discovered endings and best score stay on this device.
      </p>
    </Modal>
  );
}
