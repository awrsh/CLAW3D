const fs = require("fs");
const path = require("path");

const dir =
  "E:/Cinnagen_Project/Claw3D/new-version/src/features/office/legacy/objects";
const files = [
  "kitchen.tsx",
  "machines.tsx",
  "primitives.tsx",
  "Jukebox.tsx",
  "types.ts",
];

for (const f of files) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(
    /@\/features\/retro-office\/core\/constants/g,
    "@/features/office/legacy/shim",
  );
  s = s.replace(
    /@\/features\/retro-office\/core\/geometry/g,
    "@/features/office/legacy/shim",
  );
  s = s.replace(
    /@\/features\/retro-office\/core\/types/g,
    "@/features/office/legacy/shim",
  );
  s = s.replace(
    /@\/features\/retro-office\/objects\/types/g,
    "@/features/office/legacy/shim",
  );
  fs.writeFileSync(p, s);
  console.log("patched", f);
}

fs.writeFileSync(
  path.join(dir, "types.ts"),
  "export type {\n  BasicFurnitureModelProps,\n  InteractiveFurnitureModelProps,\n  FurnitureItem,\n} from \"@/features/office/legacy/shim\";\n",
);
console.log("types rewritten");
