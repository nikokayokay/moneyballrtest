export type SkillAxis = "contact" | "power" | "discipline" | "speed" | "runPrevention" | "command";

export type SkillProfileInput = {
  contact?: number;
  power?: number;
  discipline?: number;
  speed?: number;
  runPrevention?: number;
  command?: number;
};

export type SkillProfilePoint = {
  axis: SkillAxis;
  value: number;
  label: string;
};

function clampPercentile(value = 50) {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function buildSkillProfile(input: SkillProfileInput): SkillProfilePoint[] {
  return [
    { axis: "contact", label: "Contact", value: clampPercentile(input.contact) },
    { axis: "power", label: "Power", value: clampPercentile(input.power) },
    { axis: "discipline", label: "Discipline", value: clampPercentile(input.discipline) },
    { axis: "speed", label: "Speed", value: clampPercentile(input.speed) },
    { axis: "runPrevention", label: "Run Prevention", value: clampPercentile(input.runPrevention) },
    { axis: "command", label: "Command", value: clampPercentile(input.command) },
  ];
}

export function skillProfileScore(profile: SkillProfilePoint[]) {
  if (!profile.length) return 0;
  return Math.round(profile.reduce((sum, point) => sum + point.value, 0) / profile.length);
}
