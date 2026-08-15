export type EmailLocale = "es" | "en";

const COPY: Record<
  EmailLocale,
  {
    subject: string;
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    fallback: string;
    ignore: string;
    footer: string;
    rights: string;
  }
> = {
  es: {
    subject: "Verificá tu correo en AfroUp",
    eyebrow: "Cuenta nueva",
    title: "Confirmá tu correo para entrar a AfroUp",
    lead: "Recibimos un registro con este correo. Para activar tu cuenta y empezar a guardar artículos, hacé click en el botón.",
    cta: "Verificar mi correo",
    fallback: "Si el botón no funciona, copiá y pegá este enlace en tu navegador:",
    ignore: "Si no creaste esta cuenta, podés ignorar este mensaje.",
    footer: "AfroUp · Conocimiento afro libre",
    rights: "© 2026 AfroUp. Todos los derechos reservados.",
  },
  en: {
    subject: "Verify your email in AfroUp",
    eyebrow: "New account",
    title: "Confirm your email to sign in to AfroUp",
    lead: "We just received a sign-up with this email. Click the button below to activate your account and start saving articles.",
    cta: "Verify my email",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    ignore: "If you didn't create this account, you can safely ignore this message.",
    footer: "AfroUp · Free Afro knowledge",
    rights: "© 2026 AfroUp. All rights reserved.",
  },
};

const BRAND = {
  cream: "#FBF5E9",
  paper: "#FFFFFF",
  teal: "#0A79A6",
  tealInk: "#FBF5E9",
  amber: "#F5C03A",
  amberInk: "#5A4406",
  ink: "#17150F",
  muted: "#5A4406",
  border: "#ECE5D5",
};

function escape(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface VerificationEmail {
  to: string;
  verifyUrl: string;
  locale: EmailLocale;
  name?: string;
}

export function buildVerificationEmail({ to, verifyUrl, locale, name }: VerificationEmail) {
  const copy = COPY[locale];
  const safeUrl = escape(verifyUrl);
  const safeName = name ? escape(name) : "";

  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(copy.subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Mulish',Helvetica,Arial,sans-serif;color:${BRAND.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
      <tr><td style="background:${BRAND.teal};padding:18px 24px;border-radius:14px 14px 0 0;">
        <span style="font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;color:${BRAND.tealInk};letter-spacing:-0.01em;">AfroUp</span>
      </td></tr>
      <tr><td style="background:${BRAND.paper};padding:32px 24px 8px 24px;">
        <p style="margin:0 0 12px 0;font-size:11.5px;font-weight:800;letter-spacing:0.18em;color:${BRAND.teal};text-transform:uppercase;">${escape(copy.eyebrow)}</p>
        <h1 style="margin:0 0 14px 0;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:28px;line-height:1.1;font-weight:800;color:${BRAND.ink};letter-spacing:-0.005em;">${escape(copy.title)}</h1>
        <p style="margin:0 0 22px 0;font-size:16px;line-height:1.55;color:${BRAND.ink};">${safeName ? `<strong>${safeName}</strong>, ` : ""}${escape(copy.lead)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
          <tr><td style="background:${BRAND.teal};border-radius:999px;">
            <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:${BRAND.tealInk};text-decoration:none;letter-spacing:-0.005em;">${escape(copy.cta)}</a>
          </td></tr>
        </table>
        <p style="margin:0 0 6px 0;font-size:13.5px;line-height:1.5;color:${BRAND.muted};">${escape(copy.fallback)}</p>
        <p style="word-break:break-all;margin:0 0 24px 0;font-size:13px;color:${BRAND.teal};"><a href="${safeUrl}" style="color:${BRAND.teal};">${safeUrl}</a></p>
        <hr style="border:0;border-top:1px solid ${BRAND.border};margin:24px 0;">
        <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.muted};">${escape(copy.ignore)}</p>
      </td></tr>
      <tr><td style="background:${BRAND.amber};padding:18px 24px;border-radius:0 0 14px 14px;text-align:center;">
        <p style="margin:0 0 4px 0;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:14px;font-weight:800;color:${BRAND.amberInk};">${escape(copy.footer)}</p>
        <p style="margin:0;font-size:12px;color:${BRAND.amberInk};opacity:0.85;">${escape(copy.rights)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    copy.subject,
    "",
    copy.title,
    "",
    name ? `${name}, ` : "",
    copy.lead,
    "",
    copy.cta,
    verifyUrl,
    "",
    copy.fallback,
    verifyUrl,
    "",
    copy.ignore,
    "",
    copy.rights,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: copy.subject, html, text, to };
}

export interface SendEmailEnv {
  EMAIL?: {
    send: (message: {
      to: string;
      from: { email: string; name?: string };
      subject: string;
      html: string;
      text: string;
    }) => Promise<unknown>;
  };
  EMAIL_FROM_ADDRESS?: string;
  EMAIL_FROM_NAME?: string;
}

export async function sendVerificationEmail(
  env: SendEmailEnv,
  payload: VerificationEmail,
): Promise<unknown> {
  const message = buildVerificationEmail(payload);
  if (!env.EMAIL) {
    throw new Error("EMAIL binding not configured");
  }
  return env.EMAIL.send({
    to: message.to,
    from: {
      email: env.EMAIL_FROM_ADDRESS ?? "verificacion@afroup.com",
      name: env.EMAIL_FROM_NAME ?? "AfroUp",
    },
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

const RESET_COPY: Record<
  EmailLocale,
  {
    subject: string;
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    fallback: string;
    ignore: string;
    footer: string;
    rights: string;
    expires: string;
  }
> = {
  es: {
    subject: "Restablecé tu contraseña en AfroUp",
    eyebrow: "Recuperar contraseña",
    title: "Elegí una nueva contraseña",
    lead: "Recibimos un pedido para restablecer tu cuenta. El enlace vence en 1 hora.",
    cta: "Restablecer contraseña",
    fallback: "Si el botón no funciona, copiá y pegá este enlace en tu navegador:",
    ignore: "Si no pediste este cambio, podés ignorar este mensaje.",
    footer: "AfroUp · Conocimiento afro libre",
    rights: "© 2026 AfroUp. Todos los derechos reservados.",
    expires: "Por seguridad, este enlace expira en 1 hora.",
  },
  en: {
    subject: "Reset your AfroUp password",
    eyebrow: "Recover password",
    title: "Choose a new password",
    lead: "We received a request to reset your account. The link expires in 1 hour.",
    cta: "Reset password",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    ignore: "If you didn't request this change, you can ignore this message.",
    footer: "AfroUp · Free Afro knowledge",
    rights: "© 2026 AfroUp. All rights reserved.",
    expires: "For security, this link expires in 1 hour.",
  },
};

export interface ResetEmail {
  to: string;
  resetUrl: string;
  locale: EmailLocale;
  name?: string;
}

export function buildResetEmail({ to, resetUrl, locale, name }: ResetEmail) {
  const copy = RESET_COPY[locale];
  const safeUrl = escape(resetUrl);
  const safeName = name ? escape(name) : "";
  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(copy.subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Mulish',Helvetica,Arial,sans-serif;color:${BRAND.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
      <tr><td style="background:${BRAND.teal};padding:18px 24px;border-radius:14px 14px 0 0;">
        <span style="font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;color:${BRAND.tealInk};letter-spacing:-0.01em;">AfroUp</span>
      </td></tr>
      <tr><td style="background:${BRAND.paper};padding:32px 24px 8px 24px;">
        <p style="margin:0 0 12px 0;font-size:11.5px;font-weight:800;letter-spacing:0.18em;color:${BRAND.teal};text-transform:uppercase;">${escape(copy.eyebrow)}</p>
        <h1 style="margin:0 0 14px 0;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:28px;line-height:1.1;font-weight:800;color:${BRAND.ink};letter-spacing:-0.005em;">${escape(copy.title)}</h1>
        <p style="margin:0 0 22px 0;font-size:16px;line-height:1.55;color:${BRAND.ink};">${safeName ? `<strong>${safeName}</strong>, ` : ""}${escape(copy.lead)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
          <tr><td style="background:${BRAND.teal};border-radius:999px;">
            <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:${BRAND.tealInk};text-decoration:none;letter-spacing:-0.005em;">${escape(copy.cta)}</a>
          </td></tr>
        </table>
        <p style="margin:0 0 6px 0;font-size:13.5px;line-height:1.5;color:${BRAND.muted};">${escape(copy.fallback)}</p>
        <p style="word-break:break-all;margin:0 0 16px 0;font-size:13px;color:${BRAND.teal};"><a href="${safeUrl}" style="color:${BRAND.teal};">${safeUrl}</a></p>
        <p style="margin:0 0 24px 0;font-size:13px;color:${BRAND.amberInk};font-weight:700;">${escape(copy.expires)}</p>
        <hr style="border:0;border-top:1px solid ${BRAND.border};margin:24px 0;">
        <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.muted};">${escape(copy.ignore)}</p>
      </td></tr>
      <tr><td style="background:${BRAND.amber};padding:18px 24px;border-radius:0 0 14px 14px;text-align:center;">
        <p style="margin:0 0 4px 0;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:14px;font-weight:800;color:${BRAND.amberInk};">${escape(copy.footer)}</p>
        <p style="margin:0;font-size:12px;color:${BRAND.amberInk};opacity:0.85;">${escape(copy.rights)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  const text = [
    copy.subject,
    "",
    copy.title,
    "",
    name ? `${name}, ` : "",
    copy.lead,
    "",
    copy.cta,
    resetUrl,
    "",
    copy.fallback,
    resetUrl,
    "",
    copy.expires,
    "",
    copy.ignore,
    "",
    copy.rights,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject: copy.subject, html, text, to };
}

export async function sendResetEmail(env: SendEmailEnv, payload: ResetEmail): Promise<unknown> {
  const message = buildResetEmail(payload);
  if (!env.EMAIL) {
    throw new Error("EMAIL binding not configured");
  }
  return env.EMAIL.send({
    to: message.to,
    from: {
      email: env.EMAIL_FROM_ADDRESS ?? "verificacion@afroup.com",
      name: env.EMAIL_FROM_NAME ?? "AfroUp",
    },
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

const INVITE_COPY: Record<
  EmailLocale,
  {
    subject: string;
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    fallback: string;
    ignore: string;
    footer: string;
    rights: string;
    expires: string;
  }
> = {
  es: {
    subject: "Activá tu cuenta en AfroUp Admin",
    eyebrow: "Invitación",
    title: "Te invitaron al equipo administrador de AfroUp",
    lead: "Alguien del equipo te creó una cuenta. Activá tu acceso definiendo una contraseña antes de que expire el enlace.",
    cta: "Activar mi cuenta",
    fallback: "Si el botón no funciona, copiá y pegá este enlace en tu navegador:",
    ignore: "Si no esperabas este correo, podés ignorarlo.",
    footer: "AfroUp · Panel de administración",
    rights: "© 2026 AfroUp. Todos los derechos reservados.",
    expires: "Por seguridad, este enlace expira en 24 horas.",
  },
  en: {
    subject: "Activate your AfroUp Admin account",
    eyebrow: "Invitation",
    title: "You've been invited to the AfroUp admin team",
    lead: "Someone on the team just created an account for you. Activate your access by setting a password before the link expires.",
    cta: "Activate my account",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    ignore: "If you weren't expecting this email, you can safely ignore it.",
    footer: "AfroUp · Admin panel",
    rights: "© 2026 AfroUp. All rights reserved.",
    expires: "For security, this link expires in 24 hours.",
  },
};

export interface InviteEmail {
  to: string;
  acceptUrl: string;
  locale: EmailLocale;
  name?: string;
  expiresInHours?: number;
}

export function buildInviteEmail({ to, acceptUrl, locale, name, expiresInHours }: InviteEmail) {
  const copy = INVITE_COPY[locale];
  const safeUrl = escape(acceptUrl);
  const safeName = name ? escape(name) : "";
  const expiry = expiresInHours ?? 24;

  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(copy.subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Mulish',Helvetica,Arial,sans-serif;color:${BRAND.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
      <tr><td style="background:${BRAND.neutral};padding:18px 24px;border-radius:14px 14px 0 0;">
        <span style="font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;color:${BRAND.tealInk};letter-spacing:-0.01em;">AfroUp</span>
        <span style="display:inline-block;margin-left:10px;padding:3px 10px;border-radius:999px;background:${BRAND.accent};color:${BRAND.accentContent};font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Admin</span>
      </td></tr>
      <tr><td style="background:${BRAND.paper};padding:32px 24px 8px 24px;">
        <p style="margin:0 0 12px 0;font-size:11.5px;font-weight:800;letter-spacing:0.18em;color:${BRAND.teal};text-transform:uppercase;">${escape(copy.eyebrow)}</p>
        <h1 style="margin:0 0 14px 0;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:28px;line-height:1.1;font-weight:800;color:${BRAND.ink};letter-spacing:-0.005em;">${escape(copy.title)}</h1>
        <p style="margin:0 0 22px 0;font-size:16px;line-height:1.55;color:${BRAND.ink};">${safeName ? `<strong>${safeName}</strong>, ` : ""}${escape(copy.lead)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
          <tr><td style="background:${BRAND.teal};border-radius:999px;">
            <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:${BRAND.tealInk};text-decoration:none;letter-spacing:-0.005em;">${escape(copy.cta)}</a>
          </td></tr>
        </table>
        <p style="margin:0 0 6px 0;font-size:13.5px;line-height:1.5;color:${BRAND.muted};">${escape(copy.fallback)}</p>
        <p style="word-break:break-all;margin:0 0 16px 0;font-size:13px;color:${BRAND.teal};"><a href="${safeUrl}" style="color:${BRAND.teal};">${safeUrl}</a></p>
        <p style="margin:0 0 24px 0;font-size:13px;color:${BRAND.warning};font-weight:700;">⏱ ${escape(copy.expires.replace("{0}", String(expiry)))}</p>
        <hr style="border:0;border-top:1px solid ${BRAND.border};margin:24px 0;">
        <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.muted};">${escape(copy.ignore)}</p>
      </td></tr>
      <tr><td style="background:${BRAND.neutral};padding:18px 24px;border-radius:0 0 14px 14px;text-align:center;">
        <p style="margin:0 0 4px 0;font-family:'Baloo 2','Baloo',Helvetica,Arial,sans-serif;font-size:14px;font-weight:800;color:${BRAND.tealInk};">${escape(copy.footer)}</p>
        <p style="margin:0;font-size:12px;color:${BRAND.tealInk};opacity:0.7;">${escape(copy.rights)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    copy.subject,
    "",
    copy.title,
    "",
    name ? `${name}, ` : "",
    copy.lead,
    "",
    copy.cta,
    acceptUrl,
    "",
    copy.fallback,
    acceptUrl,
    "",
    copy.expires.replace("{0}", String(expiry)),
    "",
    copy.ignore,
    "",
    copy.rights,
  ]
    .filter(Boolean)
        .join("\n");
  return { subject: copy.subject, html, text, to };
}

export async function sendInviteEmail(env: SendEmailEnv, payload: InviteEmail): Promise<void> {
  const message = buildInviteEmail(payload);
  if (!env.EMAIL) {
    throw new Error("EMAIL binding not configured");
  }
  await env.EMAIL.send({
    to: message.to,
    from: {
      email: env.EMAIL_FROM_ADDRESS ?? "verificacion@afroup.com",
      name: env.EMAIL_FROM_NAME ?? "AfroUp",
    },
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}