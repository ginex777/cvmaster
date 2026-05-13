# Legal And Compliance Launch Checklist

Created: 2026-05-13  
Scope: Lebenslauf-Agent public-launch evidence

## Engineering Evidence

- GDPR export excludes raw AI prompts and raw AI responses; only AI job metadata is exported.
- Art. 9 registration consent is stored as `art9-processing-v1.0-2026-05-13`.
- Support-cookie consent is privacy-by-default: necessary only unless the user accepts support chat.
- Crisp loads only after support consent and a configured website ID.
- Users can reopen cookie settings and revoke support consent from every route.
- Public legal routes exist: `/datenschutz`, `/agb`, `/impressum`.

## External Evidence Required Before Public Launch

- Lawyer-approved AGB.
- Lawyer-approved Datenschutzerklaerung.
- Final Impressum with responsible operator, address, VAT/tax details if applicable.
- AVV / DPA evidence for IONOS, Groq, Anthropic, Resend, Paddle, and Crisp if Crisp remains enabled.
- Documented transfer-risk review for AI providers before processing CVs that may include Art. 9 data.
- Final DSFA sign-off.
- Final VVT sign-off.
- Final TOM sign-off.

## Launch Gate

Public launch is blocked until all external evidence above is complete and stored in the evidence vault or linked from this file.
