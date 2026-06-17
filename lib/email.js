// VENTEBEAST email service — uses Resend if RESEND_API_KEY is set, otherwise logs.
import { Resend } from 'resend';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vanshwadehra606@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'VENTEBEAST <onboarding@resend.dev>';

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function inr(n) { return '₹' + (n || 0).toLocaleString('en-IN'); }

function orderTable(order) {
  const rows = order.items.map(it => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #2a2a2a;">
        <img src="${it.image}" width="60" style="border-radius:4px;" />
      </td>
      <td style="padding:12px;border-bottom:1px solid #2a2a2a;color:#fff;">
        <div style="font-weight:600;">${it.name}</div>
        <div style="font-size:12px;color:#999;">${it.size} · Qty ${it.qty}</div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #2a2a2a;text-align:right;color:#fff;">${inr(it.total)}</td>
    </tr>`).join('');
  return `
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
      ${rows}
      <tr><td colspan="3" style="padding:12px;color:#999;font-size:13px;">
        Subtotal: <b style="color:#fff;float:right;">${inr(order.subtotal)}</b></td></tr>
      ${order.discount ? `<tr><td colspan="3" style="padding:12px;color:#5fd97d;font-size:13px;">Discount (${order.couponCode}): <b style="float:right;">−${inr(order.discount)}</b></td></tr>` : ''}
      <tr><td colspan="3" style="padding:12px;color:#999;font-size:13px;">Shipping: <b style="color:#fff;float:right;">${order.shipping ? inr(order.shipping) : 'Free'}</b></td></tr>
      <tr style="background:#1a1a1a;"><td colspan="3" style="padding:14px;color:#fff;font-size:16px;font-weight:bold;">Total: <span style="float:right;">${inr(order.total)}</span></td></tr>
    </table>`;
}

function adminTemplate(order) {
  const addr = order.address;
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;background:#000;color:#fff;padding:32px;">
      <div style="text-align:center;border-bottom:1px solid #2a2a2a;padding-bottom:20px;margin-bottom:24px;">
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:28px;letter-spacing:0.2em;margin:0;">VENTEBEAST</h1>
        <div style="font-size:10px;letter-spacing:0.3em;color:#888;margin-top:4px;">NEW ORDER · ACTION REQUIRED</div>
      </div>
      <div style="background:#caa845;color:#000;padding:16px;text-align:center;border-radius:6px;margin-bottom:24px;">
        <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">New COD Order</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:32px;margin-top:6px;">${order.orderNumber}</div>
        <div style="font-size:18px;font-weight:bold;">${inr(order.total)} · ${order.items.length} item${order.items.length>1?'s':''}</div>
      </div>
      <h3 style="margin:24px 0 12px;font-size:11px;letter-spacing:0.3em;color:#caa845;text-transform:uppercase;">Ship To</h3>
      <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:16px;color:#fff;">
        <div style="font-weight:600;font-size:16px;">${addr.name}</div>
        <div style="color:#aaa;margin-top:6px;line-height:1.5;">
          ${addr.line1}${addr.line2 ? '<br>'+addr.line2 : ''}<br>
          ${addr.city}, ${addr.state} ${addr.pincode}<br>
          ${addr.country || 'India'}
        </div>
        <div style="margin-top:8px;color:#caa845;">📞 ${addr.phone}</div>
        <div style="margin-top:4px;color:#888;font-size:13px;">${order.userEmail}</div>
      </div>
      <h3 style="margin:24px 0 12px;font-size:11px;letter-spacing:0.3em;color:#caa845;text-transform:uppercase;">Order Items</h3>
      ${orderTable(order)}
      <div style="margin-top:24px;padding:16px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;color:#fff;">
        <div style="font-size:11px;letter-spacing:0.3em;color:#888;text-transform:uppercase;">Payment</div>
        <div style="font-size:16px;margin-top:4px;">Cash on Delivery — Collect ${inr(order.total)} on delivery</div>
      </div>
      <div style="text-align:center;margin-top:32px;color:#666;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
        Composed in shadow · Shipped with care
      </div>
    </div>`;
}

function customerTemplate(order) {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;background:#000;color:#fff;padding:32px;">
      <div style="text-align:center;border-bottom:1px solid #2a2a2a;padding-bottom:20px;margin-bottom:24px;">
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:28px;letter-spacing:0.2em;margin:0;">VENTEBEAST</h1>
        <div style="font-size:10px;letter-spacing:0.3em;color:#888;margin-top:4px;">ACCESSIBILIS NICHE PERFUMERY</div>
      </div>
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:32px;text-align:center;color:#fff;">Thank you for your order</h2>
      <p style="text-align:center;color:#aaa;">Order <b style="color:#caa845;">${order.orderNumber}</b> has been received. You'll pay <b>${inr(order.total)}</b> on delivery.</p>
      ${orderTable(order)}
      <div style="margin-top:24px;padding:20px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;">
        <div style="font-size:11px;letter-spacing:0.3em;color:#caa845;text-transform:uppercase;margin-bottom:8px;">Shipping To</div>
        <div style="color:#fff;">${order.address.name}<br><span style="color:#aaa;">${order.address.line1}, ${order.address.city}, ${order.address.state} ${order.address.pincode}</span></div>
      </div>
      <div style="text-align:center;margin-top:32px;color:#666;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
        Worn slowly. Remembered always.
      </div>
    </div>`;
}

export async function sendOrderEmails(order) {
  const client = getClient();
  if (!client) {
    console.log('[email] RESEND_API_KEY not configured. Skipping. Order:', order.orderNumber);
    return { sent: false, reason: 'no-api-key' };
  }
  try {
    const adminRes = await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🐋 New VENTEBEAST Order ${order.orderNumber} — ₹${order.total} COD`,
      html: adminTemplate(order),
    });
    const custRes = order.userEmail ? await client.emails.send({
      from: FROM_EMAIL,
      to: order.userEmail,
      subject: `Your VENTEBEAST order ${order.orderNumber} is confirmed`,
      html: customerTemplate(order),
    }) : null;
    return { sent: true, adminId: adminRes?.data?.id, customerId: custRes?.data?.id };
  } catch (e) {
    console.error('[email] send failed:', e);
    return { sent: false, error: e.message };
  }
}

export async function sendWelcomeEmail(email, name, password) {
  const client = getClient();
  if (!client) {
    console.log('[email] RESEND_API_KEY not configured. Skipping welcome email for', email);
    return { sent: false, reason: 'no-api-key' };
  }
  try {
    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;background:#000;color:#fff;padding:32px;">
        <div style="text-align:center;margin-bottom:24px;"><h1 style="font-family:'Cormorant Garamond',serif;font-size:28px;margin:0;">VENTEBEAST</h1></div>
        <p style="color:#aaa;">Hi ${name || ''},</p>
        <p style="color:#fff;">Welcome to VENTEBEAST. You can sign in with the credentials below:</p>
        <div style="background:#111;padding:16px;border-radius:8px;margin:12px 0;color:#fff;">
          <div style="font-size:13px;color:#999;">Email</div>
          <div style="font-weight:600;">${email}</div>
          <div style="font-size:13px;color:#999;margin-top:8px;">Password</div>
          <div style="font-weight:600;">${password}</div>
        </div>
        <p style="color:#aaa;">We recommend changing your password after signing in.</p>
        <p style="color:#666;font-size:12px;margin-top:20px;">If you did not request this account, please ignore this email.</p>
      </div>`;

    const res = await client.emails.send({ from: FROM_EMAIL, to: email, subject: `Welcome to VENTEBEAST — your account details`, html });
    return { sent: true, id: res?.data?.id };
  } catch (e) {
    console.error('[email] welcome send failed:', e);
    return { sent: false, error: e.message };
  }
}

export async function sendLoginCodeEmail(email, code) {
  const client = getClient();
  if (!client) {
    console.log('[email] RESEND_API_KEY not configured. Skipping login code email for', email);
    return { sent: false, reason: 'no-api-key' };
  }
  try {
    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;background:#000;color:#fff;padding:32px;">
        <div style="text-align:center;margin-bottom:24px;"><h1 style="font-family:'Cormorant Garamond',serif;font-size:28px;margin:0;">VENTEBEAST</h1></div>
        <p style="color:#aaa;">Your verification code is:</p>
        <div style="background:#111;padding:16px;border-radius:8px;margin:12px 0;color:#fff;font-size:24px;letter-spacing:0.2em;text-align:center;">${code}</div>
        <p style="color:#aaa;">Enter this code to sign in. It expires in 10 minutes.</p>
        <p style="color:#666;font-size:12px;margin-top:20px;">If you did not request this, ignore this email.</p>
      </div>`;

    const res = await client.emails.send({ from: FROM_EMAIL, to: email, subject: `Your VENTEBEAST sign-in code`, html });
    return { sent: true, id: res?.data?.id };
  } catch (e) {
    console.error('[email] login code send failed:', e);
    return { sent: false, error: e.message };
  }
}
