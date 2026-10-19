import type { JSONContent } from "@tiptap/core";
export type Group = {
  id: string;
  title: string;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
};
export type Category = {
  summarySequence?: number;
  id: string;
  groupId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};
export type Note = {
  id: string;
  categoryId: string;
  type: "note" | "summary";
  title: string;
  complete: boolean;
  content: JSONContent;
  createdAt: number;
  updatedAt: number;
  sources?: { id: string; updatedAt: number }[];
};
export const presets = [
  "Impact Deluxe",
  "Fluid Ink",
  "Pixel Burst",
  "Digital Glitch",
  "Arc Energy",
] as const;
export type Preset = (typeof presets)[number];
export type AnimationPreferences = {
  preset: Preset;
  intensity: number;
  typing: boolean;
  enter: boolean;
  timeline: boolean;
  panel: boolean;
  summary: boolean;
  shake: "off" | "subtle" | "strong";
  sound: boolean;
  volume: number;
  reduced: boolean;
  focus: boolean;
};
export const defaultPreferences: AnimationPreferences = {
  preset: "Impact Deluxe",
  intensity: 65,
  typing: true,
  enter: true,
  timeline: true,
  panel: true,
  summary: true,
  shake: "subtle",
  sound: false,
  volume: 25,
  reduced: false,
  focus: false,
};
export type Workspace = {
  version: 1;
  groups: Group[];
  categories: Category[];
  notes: Note[];
  selectedCategoryId: string;
  selectedNoteId: string;
  preferences: AnimationPreferences;
};
export const id = () => crypto.randomUUID();
export const paragraph = (text = ""): JSONContent => ({
  type: "paragraph",
  ...(text ? { content: [{ type: "text", text }] } : {}),
});
export const document = (...content: JSONContent[]): JSONContent => ({
  type: "doc",
  content: content.length ? content : [paragraph()],
});
export function newNote(
  categoryId: string,
  title = "",
  type: Note["type"] = "note",
): Note {
  const now = Date.now();
  return {
    id: id(),
    categoryId,
    title,
    type,
    complete: false,
    content: document(),
    createdAt: now,
    updatedAt: now,
  };
}
export function nodesFor(state: Workspace, categoryId: string) {
  return [
    ...state.notes.filter(
      (n) => n.categoryId === categoryId && n.type === "note",
    ),
    ...state.notes.filter(
      (n) => n.categoryId === categoryId && n.type === "summary",
    ),
  ];
}
export function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item) next.splice(Math.max(0, to), 0, item);
  return next;
}
export function textOf(node: JSONContent): string {
  if (node.type === "text") return node.text || "";
  if (node.type === "image")
    return `[Gambar: ${node.attrs?.alt || node.attrs?.caption || "tanpa keterangan"}; gambar tidak dianalisis]`;
  const text =
    node.content
      ?.map(textOf)
      .join(node.type === "paragraph" || node.type === "heading" ? "" : "\n") ||
    "";
  return node.type === "codeBlock"
    ? `\n\`\`\`${node.attrs?.language || ""}\n${text}\n\`\`\`\n`
    : text;
}
export function createWorkspace(): Workspace {
  const now = Date.now();
  const g = id(),
    c = id(),
    c2 = id(),
    c3 = id();
  const notes = [
    newNote(c, "Pengantar jaringan"),
    newNote(c, "Model OSI & TCP/IP"),
    newNote(c, "Protokol jaringan"),
  ];
  notes[0].complete = true;
  notes[1].complete = true;
  notes[2].content = document(
    {
      type: "heading",
      attrs: { level: 2 },
      content: [
        { type: "text", text: "Bagaimana perangkat saling berbicara?" },
      ],
    },
    paragraph(
      "Protokol adalah aturan yang disepakati agar perangkat dapat bertukar data. Setiap protokol memiliki tugas, format pesan, dan cara menangani kesalahan yang berbeda.",
    ),
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "TCP dan UDP" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            paragraph(
              "TCP — koneksi andal, data berurutan, dan pengiriman ulang saat paket hilang.",
            ),
          ],
        },
        {
          type: "listItem",
          content: [
            paragraph(
              "UDP — pengiriman tanpa membangun koneksi, cocok untuk kebutuhan latensi rendah.",
            ),
          ],
        },
      ],
    },
    {
      type: "callout",
      attrs: { kind: "info" },
      content: [
        paragraph(
          "Ingat: andal dan cepat adalah dua kebutuhan yang berbeda. Pilih protokol sesuai kebutuhan aplikasi.",
        ),
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Mencoba sebuah request" }],
    },
    {
      type: "codeBlock",
      attrs: { language: "bash" },
      content: [
        {
          type: "text",
          text: "curl -I https://example.com\n# Lihat status dan header respons HTTP",
        },
      ],
    },
    paragraph(
      "HTTP digunakan untuk pertukaran request dan response di web. HTTPS menambahkan perlindungan TLS pada komunikasi tersebut.",
    ),
    paragraph(),
  );
  return {
    version: 1,
    groups: [
      {
        id: g,
        title: "Semester 1",
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: id(),
        title: "Semester 2",
        collapsed: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    categories: [
      {
        id: c,
        groupId: g,
        title: "Jaringan Komputer",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: c2,
        groupId: g,
        title: "Basis Data",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: c3,
        groupId: g,
        title: "Rekayasa Perangkat Lunak",
        createdAt: now,
        updatedAt: now,
      },
    ],
    notes,
    selectedCategoryId: c,
    selectedNoteId: notes[2].id,
    preferences: { ...defaultPreferences },
  };
}

/** Restore deleted entities at their old positions while keeping subsequent edits. */
export function restoreDeleted<T extends { id: string }>(
  current: T[],
  before: T[],
  deletedIds: Set<string>,
): T[] {
  const next = [...current];
  for (let i = 0; i < before.length; i++) {
    const item = before[i];
    if (!deletedIds.has(item.id) || next.some((x) => x.id === item.id))
      continue;
    const following = before
      .slice(i + 1)
      .find((x) => next.some((n) => n.id === x.id));
    if (following) {
      next.splice(
        next.findIndex((x) => x.id === following.id),
        0,
        item,
      );
      continue;
    }
    const preceding = before
      .slice(0, i)
      .reverse()
      .find((x) => next.some((n) => n.id === x.id));
    next.splice(
      preceding ? next.findIndex((x) => x.id === preceding.id) + 1 : 0,
      0,
      item,
    );
  }
  return next;
}

export function readPreferences(input: unknown): AnimationPreferences {
  const value = (
    input && typeof input === "object" ? input : {}
  ) as Partial<AnimationPreferences>;
  const result = { ...defaultPreferences };
  if (presets.includes(value.preset as Preset)) result.preset = value.preset!;
  for (const key of [
    "typing",
    "enter",
    "timeline",
    "panel",
    "summary",
    "sound",
    "reduced",
    "focus",
  ] as const)
    if (typeof value[key] === "boolean") result[key] = value[key]!;
  if (typeof value.intensity === "number" && Number.isFinite(value.intensity))
    result.intensity = Math.min(100, Math.max(0, value.intensity));
  if (typeof value.volume === "number" && Number.isFinite(value.volume))
    result.volume = Math.min(100, Math.max(0, value.volume));
  if (["off", "subtle", "strong"].includes(value.shake || ""))
    result.shake = value.shake!;
  return result;
}

export function nextSummaryNumber(state: Workspace, categoryId: string) {
  const saved =
    state.categories.find((c) => c.id === categoryId)?.summarySequence || 0;
  return (
    state.notes
      .filter((n) => n.categoryId === categoryId && n.type === "summary")
      .reduce(
        (max, n) =>
          Math.max(max, Number(n.title.match(/^Summary (\d+)/)?.[1]) || 0),
        saved,
      ) + 1
  );
}
