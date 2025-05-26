"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site-header";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { useState } from "react";
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAdmin } from "@/lib/hooks/useAdmin";
import { formatUSD, formatDate } from "@/lib/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProcessClaims() {
    const { address } = useAccount();
    const { disconnect: disconnectFn } = useDisconnect();
    const router = useRouter();

    const {
        isAdmin,
        claims,
        isLoading: isLoadingAdmin,
        isProcessingClaim,
        actions,
        error: adminError,
        refetch
    } = useAdmin();

    const [selectedClaimId, setSelectedClaimId] = useState<bigint | null>(null);
    const [processingNotes, setProcessingNotes] = useState('');
    const [error, setError] = useState<string>('');

    // Redirect if not admin
    if (!isAdmin) {
        router.push('/admin/dashboard');
        return null;
    }

    const handleProcessClaim = async (claimId: bigint, approved: boolean) => {
        try {
            setError('');
            const externalDataHash = processingNotes || 'Admin processed claim';
            await actions.processClaim(claimId, externalDataHash, approved);
            setSelectedClaimId(null);
            setProcessingNotes('');
            refetch();
        } catch (err: any) {
            console.error('Error processing claim:', err);
            setError(err.message || 'Failed to process claim');
        }
    };

    const pendingClaims = claims?.filter(c => c.status === 0) || []; // PENDING = 0
    const processedClaims = claims?.filter(c => c.status !== 0) || [];
    return (
        <main className="min-h-screen bg-background">
            <SiteHeader
                title="Shieldly"
                subtitle="Process Claims"
                userInfo={{
                    label: "Admin Wallet",
                    value: `${address?.slice(0, 7)}...${address?.slice(-4)}`
                }}
                actionLabel="Disconnect"
                onAction={() => disconnectFn()}
            />

            <div className="container mx-auto py-8 px-4">
                {/* Back button */}
                <div className="mb-6">
                    <Button variant="outline" asChild>
                        <Link href="/admin/dashboard">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Error display */}
                {(adminError || error) && (
                    <div className="mb-6 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        <AlertCircle size={16} />
                        <span>{adminError || error}</span>
                    </div>
                )}

                {/* Loading state */}
                {isLoadingAdmin && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin h-8 w-8" />
                        <span className="ml-2">Loading claims data...</span>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Insurance Claims</h2>
                        <p className="text-muted-foreground">Review and process pending insurance claims</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoadingAdmin}>
                            {isLoadingAdmin ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Refreshing...
                                </>
                            ) : (
                                'Refresh'
                            )}
                        </Button>
                        <Button size="sm" disabled>
                            Auto-Process Eligible Claims
                        </Button>
                    </div>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Claim Queue</CardTitle>
                        <CardDescription>Claims requiring review and processing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="pending" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="pending">Pending ({pendingClaims.length})</TabsTrigger>
                                <TabsTrigger value="processed">Processed ({processedClaims.length})</TabsTrigger>
                                <TabsTrigger value="all">All Claims ({claims?.length || 0})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="pending" className="space-y-4">
                                {pendingClaims.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <AlertCircle className="mx-auto h-12 w-12 mb-4 text-zinc-400" />
                                        <h3 className="text-lg font-medium mb-2">No Pending Claims</h3>
                                        <p>There are currently no claims awaiting review.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted">
                                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Claim ID</th>
                                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Policy ID</th>
                                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Claimant</th>
                                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Submitted</th>
                                                        <th className="text-right py-3 px-3 font-medium text-muted-foreground">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b">
                                                        <td className="py-3 px-3 font-mono text-xs">#CL-2025-0042</td>
                                                        <td className="py-3 px-3">John D.</td>
                                                        <td className="py-3 px-3">Crop Insurance</td>
                                                        <td className="py-3 px-3">May 15, 2025</td>
                                                        <td className="py-3 px-3 text-right">$250</td>
                                                        <td className="py-3 px-3 text-right">
                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">High</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline" size="sm">Review</Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Claim Review: #CL-2025-0042</DialogTitle>
                                                                        <DialogDescription>
                                                                            Review and process this crop insurance claim
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4 py-4">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <div className="text-sm font-medium">Policyholder</div>
                                                                                <div className="text-sm">John D.</div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-medium">Policy Number</div>
                                                                                <div className=" font-mono text-xs">#PL-2025-0126</div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-medium">Claim Date</div>
                                                                                <div className="text-sm">May 15, 2025</div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-medium">Claim Amount</div>
                                                                                <div className="text-sm">$250</div>
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <div className="text-sm font-medium mb-1">Claim Reason</div>
                                                                            <div className="text-sm p-3 bg-muted rounded border">
                                                                                Crop damage due to insufficient rainfall. Weather data shows only 180mm rainfall in the past 30 days, below the 200mm trigger threshold.
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <div className="text-sm font-medium mb-1">Oracle Data</div>
                                                                            <div className="text-sm p-3 bg-muted rounded border">
                                                                                <div className="flex justify-between mb-1">
                                                                                    <span>Data Source:</span>
                                                                                    <span>Weather Oracle</span>
                                                                                </div>
                                                                                <div className="flex justify-between mb-1">
                                                                                    <span>Reading:</span>
                                                                                    <span>180mm rainfall (30-day period)</span>
                                                                                </div>
                                                                                <div className="flex justify-between mb-1">
                                                                                    <span>Trigger Threshold:</span>
                                                                                    <span>200mm rainfall</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span>Verification Status:</span>
                                                                                    <span className="text-green-600">Verified</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <div className="text-sm font-medium mb-1">Admin Notes</div>
                                                                            <textarea
                                                                                className="flex w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                                                                placeholder="Add notes about this claim review (internal only)"
                                                                            ></textarea>
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter className="flex gap-2">
                                                                        <Button variant="outline" className="flex-1">Reject Claim</Button>
                                                                        <Button className="flex-1">Approve Payout</Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="py-3 px-3 font-mono text-xs">#CL-2025-0041</td>
                                                        <td className="py-3 px-3">Maria L.</td>
                                                        <td className="py-3 px-3">Livestock Insurance</td>
                                                        <td className="py-3 px-3">May 15, 2025</td>
                                                        <td className="py-3 px-3 text-right">$500</td>
                                                        <td className="py-3 px-3 text-right">
                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">High</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <Button variant="outline" size="sm">Review</Button>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="py-3 px-3 font-mono text-xs">#CL-2025-0039</td>
                                                        <td className="py-3 px-3">Samuel T.</td>
                                                        <td className="py-3 px-3">Business Insurance</td>
                                                        <td className="py-3 px-3">May 14, 2025</td>
                                                        <td className="py-3 px-3 text-right">$350</td>
                                                        <td className="py-3 px-3 text-right">
                                                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Medium</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <Button variant="outline" size="sm">Review</Button>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="py-3 px-3 font-mono text-xs">#CL-2025-0038</td>
                                                        <td className="py-3 px-3">Amina K.</td>
                                                        <td className="py-3 px-3">Health Insurance</td>
                                                        <td className="py-3 px-3">May 14, 2025</td>
                                                        <td className="py-3 px-3 text-right">$200</td>
                                                        <td className="py-3 px-3 text-right">
                                                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Medium</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <Button variant="outline" size="sm">Review</Button>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-3 px-3 font-mono text-xs">#CL-2025-0037</td>
                                                        <td className="py-3 px-3">David M.</td>
                                                        <td className="py-3 px-3">Crop Insurance</td>
                                                        <td className="py-3 px-3">May 13, 2025</td>
                                                        <td className="py-3 px-3 text-right">$175</td>
                                                        <td className="py-3 px-3 text-right">
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Low</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <Button variant="outline" size="sm">Review</Button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-muted-foreground">Showing 5 of 23 pending claims</div>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" disabled>Previous</Button>
                                                <Button variant="outline" size="sm">Next</Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="highPriority">
                                <div className="py-8 text-center text-muted-foreground">
                                    Switch to the "Pending" tab to see high priority claims
                                </div>
                            </TabsContent>

                            <TabsContent value="approved">
                                <div className="py-8 text-center text-muted-foreground">
                                    No approved claims to display in this view
                                </div>
                            </TabsContent>

                            <TabsContent value="rejected">
                                <div className="py-8 text-center text-muted-foreground">
                                    No rejected claims to display in this view
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Oracle Data Status</CardTitle>
                        <CardDescription>Current status of parametric data sources</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted">
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Oracle</th>
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Data Type</th>
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Last Update</th>
                                        <th className="text-right py-3 px-3 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-3 px-3">Weather Oracle</td>
                                        <td className="py-3 px-3">Rainfall Data</td>
                                        <td className="py-3 px-3">15 minutes ago</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Online</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-3">Weather Oracle</td>
                                        <td className="py-3 px-3">Temperature Data</td>
                                        <td className="py-3 px-3">15 minutes ago</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Online</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-3">Price Oracle</td>
                                        <td className="py-3 px-3">Commodity Prices</td>
                                        <td className="py-3 px-3">1 hour ago</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Online</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-3">Health Data Oracle</td>
                                        <td className="py-3 px-3">Disease Outbreak Metrics</td>
                                        <td className="py-3 px-3">6 hours ago</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Delayed</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
} 