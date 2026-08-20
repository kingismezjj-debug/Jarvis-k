import {
  Activity,
  Database,
  FlaskConical,
  ListTodo,
  MessageSquare,
  Mic2,
  Plug,
} from "lucide-react";

import type { NavItem } from "./types";

export const primaryNavigation: NavItem[] = [
  { id: "conversation", icon: MessageSquare },
  { id: "tasks", icon: ListTodo },
  { id: "plugins", icon: Plug },
  { id: "memory", icon: Database },
  { id: "voice", icon: Mic2 },
  { id: "activity", icon: Activity },
  { id: "developer", icon: FlaskConical },
];
