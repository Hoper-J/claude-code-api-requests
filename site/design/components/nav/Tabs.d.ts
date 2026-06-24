import * as React from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  /** Optional count pill (e.g. tools count). */
  count?: number | null;
}

/**
 * Tabs — underline tab bar for switching panels within a view.
 *
 * @startingPoint section="Navigation" subtitle="Underline tab bar with count pills" viewport="700x150"
 */
export interface TabsProps {
  items: TabItem[];
  /** Controlled active id. Omit for uncontrolled. */
  value?: string;
  onChange?: (id: string) => void;
  style?: React.CSSProperties;
}

export function Tabs(props: TabsProps): JSX.Element;
