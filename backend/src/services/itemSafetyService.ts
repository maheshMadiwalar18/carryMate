import { PROHIBITED_KEYWORDS, PROHIBITED_CATEGORIES } from '../utils/constants';
import { AppError } from '../utils/AppError';

/**
 * Server-side prohibited-item screen. Runs on item name + description so a
 * requester cannot bypass the restriction by naming the item innocuously and
 * describing the real contents (or vice versa). This is a first line of
 * defense, not a substitute for reporting/dispute review.
 */
export function assertItemAllowed(itemName: string, description = ''): void {
  const haystack = `${itemName} ${description}`.toLowerCase();
  const hit = PROHIBITED_KEYWORDS.find((kw) => haystack.includes(kw));
  if (hit) {
    throw AppError.validation(
      'This item appears to fall under a prohibited category and cannot be transported via CarryMate.',
      { prohibitedCategories: PROHIBITED_CATEGORIES }
    );
  }
}
