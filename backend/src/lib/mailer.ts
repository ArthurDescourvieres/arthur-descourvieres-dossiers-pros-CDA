import nodemailer, { type Transporter } from 'nodemailer'
import type { WorkspaceRole } from '@prisma/client'
import { APP_URL, MAIL, MAIL_ENABLED } from './env.js'
import { logger } from './logger.js'

// Lazily built so importing this module never opens a connection (and tests
// that don't configure SMTP never touch nodemailer at all).
let transporter: Transporter | null = null

function getTransport(): Transporter | null {
  if (!MAIL_ENABLED) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: MAIL.host,
      port: MAIL.port,
      secure: MAIL.port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: MAIL.user, pass: MAIL.pass },
    })
  }
  return transporter
}

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  OWNER: 'propriétaire',
  EDITOR: 'éditeur',
  VIEWER: 'lecteur',
}

/** Build the invite link from the server-side base URL (APP_URL). */
export function inviteLink(token: string): string {
  return `${APP_URL}/?invite=${encodeURIComponent(token)}`
}

// Minimal HTML escaping for values interpolated into the e-mail body. The
// workspace name is user-controlled, so this prevents it from breaking out of
// the markup.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type InvitationEmail = {
  to: string
  token: string
  workspaceName: string
  role: WorkspaceRole
  invitedByName: string
}

function buildText(input: InvitationEmail, link: string): string {
  const role = ROLE_LABEL[input.role]
  return [
    `${input.invitedByName} vous invite à rejoindre l'espace « ${input.workspaceName} » sur Memo en tant que ${role}.`,
    '',
    'Pour accepter, ouvrez ce lien (connectez-vous ou créez un compte avec cette adresse e-mail) :',
    link,
    '',
    "Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez ce message.",
  ].join('\n')
}

function buildHtml(input: InvitationEmail, link: string): string {
  const role = ROLE_LABEL[input.role]
  const workspace = escapeHtml(input.workspaceName)
  const invitedBy = escapeHtml(input.invitedByName)
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f4f4f5;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;">
            <tr><td style="font-size:18px;font-weight:600;padding-bottom:12px;">Invitation à rejoindre « ${workspace} »</td></tr>
            <tr><td style="font-size:14px;line-height:1.6;color:#3f3f46;padding-bottom:24px;">
              <strong>${invitedBy}</strong> vous invite à collaborer sur l'espace
              <strong>« ${workspace} »</strong> dans Memo, en tant que ${role}.
            </td></tr>
            <tr><td align="center" style="padding-bottom:24px;">
              <a href="${link}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">Accepter l'invitation</a>
            </td></tr>
            <tr><td style="font-size:12px;line-height:1.6;color:#71717a;">
              Connectez-vous ou créez un compte avec cette adresse e-mail pour accepter.
              Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez ce message.
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Send the workspace-invitation e-mail. Never throws and never logs the token:
 * on failure (or when mail is disabled) it logs the outcome and resolves false,
 * so invitation creation is unaffected — the OWNER can still forward the link.
 */
export async function sendInvitationEmail(input: InvitationEmail): Promise<boolean> {
  const transport = getTransport()
  if (!transport) {
    logger.info({ to: input.to }, 'invitation email skipped (mailer not configured)')
    return false
  }

  const link = inviteLink(input.token)
  try {
    await transport.sendMail({
      from: MAIL.from,
      to: input.to,
      subject: `Invitation à rejoindre « ${input.workspaceName} » sur Memo`,
      text: buildText(input, link),
      html: buildHtml(input, link),
    })
    logger.info({ to: input.to, workspace: input.workspaceName }, 'invitation email sent')
    return true
  } catch (err) {
    logger.error(
      { err: { message: (err as Error).message }, to: input.to },
      'invitation email failed',
    )
    return false
  }
}
