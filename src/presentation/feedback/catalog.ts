import type { OutcomeCode } from '../../domain/outcome'
import type { MessageKey } from '../../adapters/localization/message-keys'

interface Presentation {
  titleKey: MessageKey
  bodyKey: MessageKey
  surface: 'inline' | 'blocking' | 'field'
  actions: readonly ('login' | 'retry' | 'edit_input' | 'review_permission')[]
  allowedParams: readonly string[]
}

export const presentationCatalog = {
  'sale.pending': { titleKey: 'feedback.request.title', bodyKey: 'sale.pendingBody', surface: 'inline', actions: [], allowedParams: [] },
  'sale.not_found': { titleKey: 'feedback.request.title', bodyKey: 'sale.missing', surface: 'inline', actions: [], allowedParams: [] },
  'sale.already_reversed': { titleKey: 'feedback.request.title', bodyKey: 'sale.alreadyReversed', surface: 'inline', actions: [], allowedParams: [] },
  'sale.idempotency_conflict': { titleKey: 'feedback.request.title', bodyKey: 'sale.conflict', surface: 'inline', actions: [], allowedParams: [] },
  'payment.insufficient_cash': { titleKey: 'feedback.request.title', bodyKey: 'sale.insufficient', surface: 'inline', actions: [], allowedParams: [] },
  'catalog.item_not_found': { titleKey: 'feedback.request.title', bodyKey: 'catalog.missing', surface: 'inline', actions: [], allowedParams: [] },
  'catalog.item_not_sellable': { titleKey: 'feedback.request.title', bodyKey: 'catalog.unsellable', surface: 'inline', actions: [], allowedParams: [] },
  'auth.login_required': { titleKey: 'feedback.login.title', bodyKey: 'feedback.login.body', surface: 'inline', actions: ['login'], allowedParams: [] },
  'auth.session_expired': { titleKey: 'feedback.expired.title', bodyKey: 'feedback.expired.body', surface: 'blocking', actions: ['login'], allowedParams: [] },
  'auth.logged_out': { titleKey: 'feedback.logout.title', bodyKey: 'feedback.logout.body', surface: 'inline', actions: [], allowedParams: [] },
  'access.denied': { titleKey: 'feedback.denied.title', bodyKey: 'feedback.denied.body', surface: 'inline', actions: ['review_permission'], allowedParams: [] },
  'capability.unavailable': { titleKey: 'feedback.unavailable.title', bodyKey: 'feedback.unavailable.body', surface: 'inline', actions: [], allowedParams: [] },
  'validation.invalid_request': { titleKey: 'feedback.validation.title', bodyKey: 'feedback.validation.body', surface: 'inline', actions: ['edit_input'], allowedParams: [] },
  'validation.required': { titleKey: 'feedback.validation.title', bodyKey: 'feedback.required', surface: 'field', actions: ['edit_input'], allowedParams: [] },
  'validation.invalid_value': { titleKey: 'feedback.validation.title', bodyKey: 'feedback.invalid', surface: 'field', actions: ['edit_input'], allowedParams: [] },
  'network.unavailable': { titleKey: 'feedback.network.title', bodyKey: 'feedback.network.body', surface: 'inline', actions: ['retry'], allowedParams: [] },
  'request.failed': { titleKey: 'feedback.request.title', bodyKey: 'feedback.request.body', surface: 'inline', actions: ['edit_input'], allowedParams: [] },
  'system.unexpected_error': { titleKey: 'feedback.system.title', bodyKey: 'feedback.system.body', surface: 'inline', actions: ['retry'], allowedParams: ['requestId'] },
  'system.contract_error': { titleKey: 'feedback.contract.title', bodyKey: 'feedback.contract.body', surface: 'blocking', actions: [], allowedParams: ['requestId'] },
} satisfies Record<OutcomeCode, Presentation>
