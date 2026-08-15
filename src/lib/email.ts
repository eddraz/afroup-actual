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
): Promise<void> {
  const message = buildVerificationEmail(payload);
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