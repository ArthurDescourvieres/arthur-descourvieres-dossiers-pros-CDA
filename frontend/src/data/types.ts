export type ChipColor = 'teal' | 'gold' | 'slate' | 'rose';

export type Tag = [string, ChipColor];
export type Status = [string, ChipColor];

export type BlockCallout = { type: 'callout'; icon: string; body: string };
export type BlockH1 = { type: 'h1'; text: string };
export type BlockH2 = { type: 'h2'; text: string };
export type BlockP = { type: 'p'; html?: string; text?: string };
export type BlockQuote = { type: 'quote'; text: string; cite: string };
export type BlockDivider = { type: 'divider' };
export type BlockTodo = {
  type: 'todo';
  label: string;
  done: boolean;
  meta: string;
};
export type BlockSlash = { type: 'slash' };

export type Block =
  | BlockCallout
  | BlockH1
  | BlockH2
  | BlockP
  | BlockQuote
  | BlockDivider
  | BlockTodo
  | BlockSlash;

export type PageMeta = {
  created: string;
  edited: string;
  by: string;
  tags: Tag[];
  status: Status;
  icon: string;
};

export type Page = {
  id: string;
  title: string;
  titleHTML: string;
  emoji: string;
  path: string[];
  meta: PageMeta;
  blocks: Block[];
};

export type NavNode = {
  uid?: string;
  id?: string | null;
  label: string;
  icon: string;
  mapId?: string;
  badge?: string;
  starred?: boolean;
  expanded?: boolean;
  children?: NavNode[];
  _pendingNew?: { type: 'note' | 'folder' };
};

export type VirtualKey = 'today' | 'archive' | 'trash' | 'inbox_empty';
export type VirtualPage = {
  emoji: string;
  title: string;
  subtitle: string;
  icon: string;
};
