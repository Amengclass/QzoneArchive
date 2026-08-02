export interface QzoneTextPart {
  type: "text" | "mention";
  value: string;
  uin?: string;
}

const mentionPattern = /@\{uin:([^,}]+),nick:([^}]+)\}/g;

export function parseQzoneText(value?: string): QzoneTextPart[] {
  const text = value?.replace(/^[：:]\s*/, "") || "";
  const parts: QzoneTextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(mentionPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: "text", value: text.slice(cursor, index) });
    parts.push({ type: "mention", value: `@${match[2]}`, uin: match[1] });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ type: "text", value: text.slice(cursor) });
  return parts.length ? parts : [{ type: "text", value: "该动态没有文字内容" }];
}
