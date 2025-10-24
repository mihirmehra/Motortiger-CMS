"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send } from "lucide-react"

interface WhatsAppComposerProps {
  recipient: string
  content: string
  onRecipientChange: (recipient: string) => void
  onContentChange: (content: string) => void
  onSend: () => void
  sending?: boolean
  disabled?: boolean
}

export default function WhatsAppComposer({
  recipient,
  content,
  onRecipientChange,
  onContentChange,
  onSend,
  sending = false,
  disabled = false,
}: WhatsAppComposerProps) {
  const getCharacterCount = () => {
    const maxLength = 4096
    return {
      count: content.length,
      max: maxLength,
      remaining: maxLength - content.length,
    }
  }

  const charInfo = getCharacterCount()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Compose WhatsApp Message
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipient */}
        <div>
          <Label htmlFor="recipient">Recipient Phone Number</Label>
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => onRecipientChange(e.target.value)}
            placeholder="+1234567890"
            disabled={disabled}
            className="flex-1 mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for USA)</p>
        </div>

        {/* Message Content */}
        <div>
          <Label htmlFor="content">Message</Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Type your WhatsApp message here..."
            rows={4}
            maxLength={4096}
            disabled={disabled}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {charInfo.count}/{charInfo.max} characters
            </span>
            <span className={`text-xs ${charInfo.remaining < 100 ? "text-red-500" : "text-gray-500"}`}>
              {charInfo.remaining} remaining
            </span>
          </div>
        </div>

        {/* Quick Templates */}
        <div>
          <Label>Quick Templates</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContentChange("Hello! How can I help you today?")}
              disabled={disabled}
            >
              Greeting
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContentChange("Thank you for reaching out. We will get back to you shortly.")}
              disabled={disabled}
            >
              Thank You
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onContentChange(
                  "Hello,\n\nthis message is to inform you that we have recived your order and your order is under proccess",
                )
              }
              disabled={disabled}
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              ✓ Order Confirmation (Approved)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContentChange("Your order has been confirmed and will be delivered soon.")}
              disabled={disabled}
            >
              Order Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContentChange("Please call us at your earliest convenience.")}
              disabled={disabled}
            >
              Call Request
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={onSend}
          disabled={disabled || sending || !recipient.trim() || !content.trim()}
          className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send WhatsApp Message"}
        </Button>
      </CardContent>
    </Card>
  )
}
