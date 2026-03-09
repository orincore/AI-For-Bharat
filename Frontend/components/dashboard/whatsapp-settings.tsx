"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Shield, CheckCircle, XCircle, Loader2, Plus, Star, Edit2, Trash2, Power } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface WhatsAppNumber {
  id: string
  phoneNumber: string
  displayName?: string
  isPrimary: boolean
  isActive: boolean
  isVerified: boolean
  createdAt: string
  metadata?: {
    lastUsed?: string
    messageCount?: number
  }
}

export function WhatsAppSettings() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingNumber, setEditingNumber] = useState<WhatsAppNumber | null>(null)
  const [editDisplayName, setEditDisplayName] = useState("")
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
        setNumbers(data.numbers || [])
      }
    } catch (error) {
      console.error("Failed to check WhatsApp status:", error)
    } finally {
      setChecking(false)
    }
  }

  const handleAddNumber = async () => {
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
        body: JSON.stringify({ 
          phoneNumber, 
          displayName: displayName.trim() || phoneNumber,
          isPrimary: numbers.length === 0 
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to add WhatsApp number")
      }

      toast({
        title: "WhatsApp number added",
        description: "You can now use Orin AI via this WhatsApp number",
      })

      await checkWhatsAppStatus()
      setPhoneNumber("")
      setDisplayName("")
      setIsAddDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Failed to add WhatsApp number",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveNumber = async (numberId: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/whatsapp/unlink`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ numberId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to remove WhatsApp number")
      }

      toast({
        title: "Number removed",
        description: "WhatsApp number has been removed from your account",
      })

      await checkWhatsAppStatus()
    } catch (error: any) {
      toast({
        title: "Failed to remove number",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetPrimary = async (numberId: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/whatsapp/set-primary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ numberId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to set primary number")
      }

      toast({
        title: "Primary number updated",
        description: "This number is now your primary WhatsApp number",
      })

      await checkWhatsAppStatus()
    } catch (error: any) {
      toast({
        title: "Failed to set primary",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDisplayName = async () => {
    if (!editingNumber || !editDisplayName.trim()) return

    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/whatsapp/update-name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ numberId: editingNumber.id, displayName: editDisplayName }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to update display name")
      }

      toast({
        title: "Display name updated",
        description: "Number display name has been updated",
      })

      await checkWhatsAppStatus()
      setEditingNumber(null)
      setEditDisplayName("")
    } catch (error: any) {
      toast({
        title: "Failed to update name",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (numberId: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/whatsapp/toggle-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ numberId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to toggle status")
      }

      toast({
        title: data.isActive ? "Number activated" : "Number deactivated",
        description: data.isActive ? "This number can now receive messages" : "This number is now inactive",
      })

      await checkWhatsAppStatus()
    } catch (error: any) {
      toast({
        title: "Failed to toggle status",
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Integration
            </CardTitle>
            <CardDescription>
              Manage multiple WhatsApp numbers for secure access
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add WhatsApp Number</DialogTitle>
                <DialogDescription>
                  Link a new WhatsApp number to your account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Personal, Work, etc."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleAddNumber}
                  disabled={loading || !phoneNumber.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Number
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Secure Access:</strong> Only your linked WhatsApp numbers can access your account data.
            Add multiple numbers for different devices or team members.
          </AlertDescription>
        </Alert>

        {/* Numbers List */}
        {numbers.length > 0 ? (
          <div className="space-y-4">
            {numbers.map((number) => (
              <div
                key={number.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">
                        {number.displayName || number.phoneNumber}
                      </p>
                      {number.isPrimary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      {!number.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {number.phoneNumber}
                    </p>
                    {number.metadata?.lastUsed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last used: {new Date(number.metadata.lastUsed).toLocaleDateString()}
                        {number.metadata.messageCount && ` • ${number.metadata.messageCount} messages`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingNumber(number)
                        setEditDisplayName(number.displayName || number.phoneNumber)
                      }}
                      disabled={loading}
                      title="Edit display name"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(number.id)}
                      disabled={loading}
                      title={number.isActive ? "Deactivate" : "Activate"}
                    >
                      <Power className={`h-4 w-4 ${number.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveNumber(number.id)}
                      disabled={loading || numbers.length === 1}
                      title="Remove number"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {!number.isPrimary && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetPrimary(number.id)}
                    disabled={loading}
                    className="w-full"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Set as Primary
                  </Button>
                )}
              </div>
            ))}

            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-semibold">How to use:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Send a message to your WhatsApp Business number</li>
                <li>Ask Orin AI anything (analytics, comments, captions, etc.)</li>
                <li>Get instant AI-powered responses with your data</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No WhatsApp Numbers Linked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first WhatsApp number to start using Orin AI via WhatsApp
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Number
            </Button>
          </div>
        )}

        {/* Edit Display Name Dialog */}
        <Dialog open={!!editingNumber} onOpenChange={(open) => !open && setEditingNumber(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Display Name</DialogTitle>
              <DialogDescription>
                Update the display name for this WhatsApp number
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editDisplayName">Display Name</Label>
                <Input
                  id="editDisplayName"
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleUpdateDisplayName}
                disabled={loading || !editDisplayName.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update Name
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
