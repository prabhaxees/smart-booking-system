import sgMail from "@sendgrid/mail";

let initialized = false;
let cachedConfig = null;

function getConfig() {
  return {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: process.env.SENDGRID_FROM_NAME || "Resource Booking",
    dataResidency: process.env.SENDGRID_DATA_RESIDENCY, // set to "eu" if using EU subuser
  };
}

function ensureInitialized() {
  if (initialized) return;
  const { apiKey, dataResidency } = getConfig();
  cachedConfig = getConfig();
  if (!apiKey) {
    console.warn("SendGrid disabled: missing SENDGRID_API_KEY");
    initialized = true;
    return;
  }
  sgMail.setApiKey(apiKey);
  if (dataResidency === "eu") {
    sgMail.setDataResidency("eu");
  }
  initialized = true;
}

async function sendEmail({ to, subject, text, html }) {
  ensureInitialized();

  const { apiKey, fromEmail, fromName } = cachedConfig || getConfig();

  if (!apiKey || !fromEmail) {
    console.warn("SendGrid disabled: missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL");
    return { skipped: true };
  }

  const msg = {
    to,
    from: { email: fromEmail, name: fromName },
    subject,
    text,
    html,
  };

  await sgMail.send(msg);
  return { skipped: false };
}

function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return "";
  return `${startTime} - ${endTime}`;
}

export async function sendBookingConfirmedEmail({
  to,
  userName,
  resourceName,
  date,
  startTime,
  endTime,
  bookingId,
}) {
  const timeRange = formatTimeRange(startTime, endTime);
  const { fromName } = cachedConfig || getConfig();
  const subject = `Booking confirmed: ${resourceName} on ${date} ${timeRange}`;
  const text =
    `Hi ${userName || "there"},\n\n` +
    `Your booking is confirmed.\n` +
    `Resource: ${resourceName}\n` +
    `Date: ${date}\n` +
    `Time: ${timeRange}\n` +
    `Booking ID: ${bookingId}\n\n` +
    `Thanks,\n${fromName}`;
  const html =
    `<p>Hi ${userName || "there"},</p>` +
    `<p>Your booking is confirmed.</p>` +
    `<ul>` +
    `<li><strong>Resource:</strong> ${resourceName}</li>` +
    `<li><strong>Date:</strong> ${date}</li>` +
    `<li><strong>Time:</strong> ${timeRange}</li>` +
    `<li><strong>Booking ID:</strong> ${bookingId}</li>` +
    `</ul>` +
    `<p>Thanks,<br>${fromName}</p>`;

  return sendEmail({ to, subject, text, html });
}

export async function sendBookingCancelledEmail({
  to,
  userName,
  resourceName,
  date,
  startTime,
  endTime,
  bookingId,
}) {
  const timeRange = formatTimeRange(startTime, endTime);
  const { fromName } = cachedConfig || getConfig();
  const subject = `Booking cancelled: ${resourceName} on ${date} ${timeRange}`;
  const text =
    `Hi ${userName || "there"},\n\n` +
    `Your booking has been cancelled.\n` +
    `Resource: ${resourceName}\n` +
    `Date: ${date}\n` +
    `Time: ${timeRange}\n` +
    `Booking ID: ${bookingId}\n\n` +
    `Thanks,\n${fromName}`;
  const html =
    `<p>Hi ${userName || "there"},</p>` +
    `<p>Your booking has been cancelled.</p>` +
    `<ul>` +
    `<li><strong>Resource:</strong> ${resourceName}</li>` +
    `<li><strong>Date:</strong> ${date}</li>` +
    `<li><strong>Time:</strong> ${timeRange}</li>` +
    `<li><strong>Booking ID:</strong> ${bookingId}</li>` +
    `</ul>` +
    `<p>Thanks,<br>${fromName}</p>`;

  return sendEmail({ to, subject, text, html });
}

export async function sendRecurringBookingConfirmedEmail({
  to,
  userName,
  resourceName,
  startDate,
  endDate,
  startTime,
  endTime,
  count,
  seriesId,
}) {
  const timeRange = formatTimeRange(startTime, endTime);
  const { fromName } = cachedConfig || getConfig();
  const subject = `Recurring bookings confirmed: ${resourceName} (${count} bookings)`;
  const text =
    `Hi ${userName || "there"},\n\n` +
    `Your recurring bookings are confirmed.\n` +
    `Resource: ${resourceName}\n` +
    `Date range: ${startDate} to ${endDate}\n` +
    `Time: ${timeRange}\n` +
    `Count: ${count}\n` +
    `Series ID: ${seriesId}\n\n` +
    `Thanks,\n${fromName}`;
  const html =
    `<p>Hi ${userName || "there"},</p>` +
    `<p>Your recurring bookings are confirmed.</p>` +
    `<ul>` +
    `<li><strong>Resource:</strong> ${resourceName}</li>` +
    `<li><strong>Date range:</strong> ${startDate} to ${endDate}</li>` +
    `<li><strong>Time:</strong> ${timeRange}</li>` +
    `<li><strong>Count:</strong> ${count}</li>` +
    `<li><strong>Series ID:</strong> ${seriesId}</li>` +
    `</ul>` +
    `<p>Thanks,<br>${fromName}</p>`;

  return sendEmail({ to, subject, text, html });
}
