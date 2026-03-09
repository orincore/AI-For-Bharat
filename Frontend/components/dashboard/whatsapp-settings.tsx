"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function WhatsAppSettings() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [linkedNumber, setLinkedNumber] = useState<string | null>(null)
  const [isLinked, setIsLinked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkWhatsAppStatus()
  }, [])

  const checkWhatsAppStatus = async () => {
    try {
      setChecking(true)
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/whatsapp/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setIsLinked(data.isLinked)
        setLinkedNumber(data.phoneNumber)
      }
    } catch (error) {
      console.error("Failed to check WhatsApp status:", error)
    } finally {
      setChecking(false)
    }
  }

  const handleLinkNumber = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your WhatsApp number",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/whatsapp/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to link WhatsApp number")
      }

      toast({
        title: "WhatsApp linked successfully",
        description: "You can now use Orin AI via WhatsApp securely",
      })

      setIsLinked(true)
      setLinkedNumber(data.phoneNumber)
      setPhoneNumber("")
    } catch (error: any) {
      toast({
        title: "Failed to link WhatsApp",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkNumber = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/whatsapp/unlink`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to unlink WhatsApp number")
      }

      toast({
        title: "WhatsApp unlinked",
        description: "Your WhatsApp number has been removed",
      })

      setIsLinked(false)
      setLinkedNumber(null)
    } catch (error: any) {
      toast({
        title: "Failed to unlink WhatsApp",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Integration
        </CardTitle>
        <CardDescription>
          Link your WhatsApp number to use Orin AI securely via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Secure Access:</strong> Only the linked WhatsApp number can access your account data.
            This protects your analytics, posts, and personal information.
          </AlertDescription>
        </Alert>

        {/* Current Status */}
        {isLinked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  WhatsApp Connected
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {linkedNumber}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">How to use:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Send a message to <strong>+1 (555) 833-5359</strong> on WhatsApp</li>
                <li>Ask Orin AI anything (analytics, comments, captions, etc.)</li>
                <li>Get instant AI-powered responses with your data</li>
              </ol>
            </div>

            <Button
              variant="destructive"
              onClick={handleUnlinkNumber}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlinking...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Unlink WhatsApp Number
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">WhatsApp Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US, +91 for India)
              </p>
            </div>

            <Button
              onClick={handleLinkNumber}
              disabled={loading || !phoneNumber.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Link WhatsApp Number
                </>
              )}
            </Button>

            <div className="rounded-lg border border-muted bg-muted/50 p-4">
              <h4 className="text-sm font-semibold mb-2">Why link your number?</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Secure access to your account data</li>
                <li>✓ Use Orin AI directly from WhatsApp</li>
                <li>✓ Get analytics, comments, and insights on-the-go</li>
                <li>✓ No one else can access your data via WhatsApp</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
