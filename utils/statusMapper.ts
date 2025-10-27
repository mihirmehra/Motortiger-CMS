/**
 * Maps Twilio message statuses to internal SMS message statuses
 * Twilio statuses: queued, sending, sent, delivered, undelivered, failed
 * Internal statuses: queued, sending, sent, delivered, failed, received, read, undelivered
 */
export function mapTwilioStatus(twilioStatus: string): string {
  const statusMap: Record<string, string> = {
    queued: "queued",
    sending: "sending",
    sent: "sent",
    delivered: "delivered",
    undelivered: "undelivered",
    failed: "failed",
    received: "received",
    read: "read",
  }

  return statusMap[twilioStatus] || "sent"
}

/**
 * Determines if a status represents a terminal state (no further updates expected)
 */
export function isTerminalStatus(status: string): boolean {
  return ["delivered", "failed", "undelivered", "read"].includes(status)
}

/**
 * Determines if a status represents a pending state
 */
export function isPendingStatus(status: string): boolean {
  return ["queued", "sending"].includes(status)
}
