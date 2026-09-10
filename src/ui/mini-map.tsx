import { useEffect, useRef, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { bounds, obstacles, objects } from "../data/world";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";

export function MiniMap() {
  const location = useGame((s) => s.game.location),
    dot = useRef<SVGCircleElement>(null);
  const { w, d } = bounds[location];
  useEffect(() => {
    const timer = setInterval(() => {
      dot.current?.setAttribute("cx", String(runtime.player[0]));
      dot.current?.setAttribute("cy", String(runtime.player[1]));
    }, 150);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="minimap">
      <div className="minimap-title">
        <MapPin size={12} />
        {location === "home"
          ? "YOUR PLACE"
          : location === "office"
            ? "MONDAY, INC."
            : "THE COMMUTE"}
        <span>N ↑</span>
      </div>
      <svg
        viewBox={`${-w / 2 - 1} ${-d / 2 - 1} ${w + 2} ${d + 2}`}
        role="img"
        aria-label="Local map. Yellow is you. Green is your desk, orange is coffee."
      >
        <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="#e6e8d9" />
        {obstacles[location].map((o, i) => (
          <rect
            key={i}
            x={o.x - o.w / 2}
            y={o.z - o.d / 2}
            width={o.w}
            height={o.d}
            fill="#9cae98"
          />
        ))}
        {objects.reduce<ReactNode[]>((markers, o) => {
          if (
            o.location === location &&
            ["desk", "exit", "coffee"].includes(o.kind)
          )
            markers.push(
              <circle
                key={o.id}
                cx={o.position[0]}
                cy={o.position[1]}
                r={0.55}
                fill={o.kind === "coffee" ? "#d68b56" : "#447959"}
              />,
            );
          return markers;
        }, [])}
        <circle
          ref={dot}
          r={0.53}
          fill="#f4c858"
          stroke="#fff9e9"
          strokeWidth={0.22}
        />
      </svg>
      <div className="map-legend">
        <span>
          <i />
          You
        </span>
        <span>
          <i />
          Goal
        </span>
        {location === "office" && (
          <span>
            <i />
            Coffee
          </span>
        )}
      </div>
    </div>
  );
}
