"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Instagram, Plus, Trash2, Check } from "lucide-react"
import { instagramService, InstagramAccount } from "@/lib/instagram"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function InstagramAccounts() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const { toast } = useToast()

  const backendOrigin = (() => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return null
      return new URL(apiUrl).origin
    } catch (error) {
      console.warn("Invalid NEXT_PUBLIC_API_URL", error)
      return null
    }
  })()

  useEffect(() => {
    loadAccounts()

    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [window.location.origin]
      if (backendOrigin) {
        allowedOrigins.push(backendOrigin)
      }

      if (!allowedOrigins.includes(event.origin)) return

      if (event.data?.type === 'INSTAGRAM_CONNECTED') {
        const accountsPayload = Array.isArray(event.data.accounts)
          ? event.data.accounts
          : event.data.account
            ? [event.data.account]
            : []

        if (accountsPayload.length > 0) {
          const usernames = accountsPayload.map((acc: any) => `@${acc.username || acc.platformUsername}`).join(', ')
          toast({
            title: "Instagram Connected",
            description: `${usernames} connected successfully.`,
          })
        } else {
          toast({
            title: "Instagram Connection",
            description: "Instagram authorization completed.",
          })
        }

        loadAccounts()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await instagramService.getConnectedAccounts()
      setAccounts(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      await instagramService.connectAccount()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = async (accountId: string) => {
    try {
      await instagramService.disconnectAccount(accountId)
      toast({
        title: "Account Disconnected",
        description: "Instagram account has been removed.",
      })
      loadAccounts()
      setDisconnectingId(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSetActive = async (accountId: string) => {
    try {
      await instagramService.setActiveAccount(accountId)
      toast({
        title: "Active Account Updated",
        description: "This account is now your active Instagram account.",
      })
      loadAccounts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-500" />
                Instagram Accounts
              </CardTitle>
              <CardDescription>
                Connect and manage multiple Instagram accounts
              </CardDescription>
            </div>
            <Button onClick={handleConnect} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <Instagram className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No Instagram accounts connected yet
              </p>
              <Button onClick={handleConnect} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={account.profilePicture} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                        {account.platformUsername.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">@{account.platformUsername}</p>
                        {account.isActive && (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ID: {account.platformAccountId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(account.id)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDisconnectingId(account.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!disconnectingId} onOpenChange={() => setDisconnectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Instagram Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the account from your dashboard. You can reconnect it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectingId && handleDisconnect(disconnectingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
