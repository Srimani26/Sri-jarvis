/**
 * J.A.R.V.I.S. MARK-V Browser Automation Types & Security Contracts
 */

export type BrowserActionType =
  | 'navigate'
  | 'click'
  | 'type'
  | 'extract'
  | 'screenshot'
  | 'submit'
  | 'wait';

export interface InteractiveElement {
  id: string;
  tag: string;
  type?: string;
  name?: string;
  text?: string;
  value?: string;
  placeholder?: string;
  href?: string;
  selector: string;
}

export interface BrowserPageSnapshot {
  url: string;
  title: string;
  statusCode: number;
  interactiveElements: InteractiveElement[];
  visibleText: string;
  forms: Array<{ action?: string; method?: string; inputs: string[] }>;
  links: Array<{ text: string; href: string }>;
  screenshotPlaceholder?: string;
  untrustedWarning?: string;
}

export interface BrowserActionRequest {
  action: BrowserActionType;
  url?: string;
  selector?: string;
  value?: string;
  timeoutMs?: number;
}

export interface BrowserActionResult {
  action: BrowserActionType;
  success: boolean;
  url: string;
  snapshot?: BrowserPageSnapshot;
  error?: string;
  durationMs: number;
}
