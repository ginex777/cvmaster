# Lebenslauf-Agent Frontend

Angular 21 standalone SPA for the Lebenslauf-Agent product.

## Design System

Atlas is the current frontend design system for the marketing pages, app shell,
pipeline, editor, CV management, settings, and shared UI primitives.

- Spec: [Atlas Redesign Spec](../redesign/Atlas%20Redesign%20Spec.md)
- Visual examples: [Redesign Examples](../redesign/Redesign%20Examples.html)
- Source mockups: [shared.jsx](../redesign/shared.jsx), [screens-marketing.jsx](../redesign/screens-marketing.jsx), [screens-app.jsx](../redesign/screens-app.jsx), [screen-editor.jsx](../redesign/screen-editor.jsx)

Shared components added or aligned for Atlas:

- `AppShellComponent` and `AppTopbarComponent`
- `AtsPanel`
- `ButtonComponent`, `CardComponent`, `PillComponent`
- `CommandPalette`
- `CompanyLogoComponent`
- `ConfirmDeleteModal`
- `ConsentBanner`
- `CoverLetterTonePicker`
- `CvMiniPreviewClassic`, `CvMiniPreviewEditorial`, `CvMiniPreviewExecutive`, `CvMiniPreviewMinimal`, `CvMiniPreviewModern`
- `CvSectionEditorComponent`
- `CvTemplatePicker`
- `EinstellungenModalComponent`
- `KeywordBarComponent`
- `NavbarComponent` and `FooterComponent`
- `OnboardingModalComponent`
- `PipelineBoard` and `PipelineToolbar`
- `ProLock`
- `ScoreRingComponent`
- `StatusPillComponent`
- `ToastHost`
- `UpgradeModal`

Status model:

- `DRAFT`: Entwurf
- `APPLIED`: Beworben
- `INTERVIEW`: Interview
- `OFFER`: Angebot
- `REJECTED`: Abgesagt

Legacy backend statuses are normalized through
`src/app/shared/utils/status.utils.ts`; components should consume
`ApplicationStatus`, `STATUS_META`, `STATUS_ORDER`, and `legacyToStatus()`
instead of duplicating status maps.

Lucide icon convention:

- Import icons through `src/app/shared/icons/icons.module.ts`.
- Prefer existing Lucide icons for buttons, menus, empty states, navigation,
  and utility actions.
- Add new icons to `IconsModule` once, then use the `<lucide-icon>` component
  in templates.
- Do not inline ad hoc SVGs for standard UI actions when Lucide has an
  equivalent.
