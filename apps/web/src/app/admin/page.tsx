"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useState } from "react";
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useAdmin } from "@/lib/hooks/useAdmin";
import { formatUSD, formatDate } from "@/lib/utils/format";
import Link from "next/link";

export default function AdminDashboard() {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect: disconnectFn } = useDisconnect();
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Use the admin hook
    const {
        isAdmin,
        policies,
        claims,
        isLoading: isLoadingAdmin,
        actions,
        error: adminError,
        refetch
    } = useAdmin();

    const connectWallet = async (walletType: 'braavos' | 'argentX') => {
        try {
            setError('');
            setIsLoading(true);

            // Find the specific connector
            const targetConnector = connectors.find(
                (connector: any) => connector.id === walletType
            );

            if (!targetConnector) {
                setError(`${walletType === 'braavos' ? 'Braavos' : 'Argent'} wallet not detected. Please install the ${walletType === 'braavos' ? 'Braavos' : 'Argent'} extension.`);
                return;
            }

            // This will open the wallet extension popup
            await connect({ connector: targetConnector });

        } catch (err: any) {
            console.error('Connection failed:', err);
            if (err.message?.includes('User rejected')) {
                setError('Connection was rejected by user');
            } else if (err.message?.includes('not installed')) {
                setError(`${walletType === 'braavos' ? 'Braavos' : 'Argent'} wallet not installed. Please install the extension.`);
            } else {
                setError('Failed to connect wallet. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonLoading = isLoading || isConnecting;

    // If not connected, show wallet connection
    if (!isConnected || !address) {
        return (
            <main className="min-h-screen bg-background">
                <SiteHeader
                    title="Shieldly"
                    subtitle="Admin Dashboard"
                />

                <div className="container mx-auto py-8 px-4">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-bold">Admin Access Required</h1>
                            <p className="text-lg text-zinc-600 max-w-md">
                                Connect your admin wallet to access the admin dashboard and manage policies and claims.
                            </p>
                        </div>

                        <Card className="w-full max-w-md shadow-lg">
                            <CardHeader>
                                <CardTitle>Connect Admin Wallet</CardTitle>
                                <CardDescription>Use the authorized admin wallet to access admin functions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <button
                                    onClick={() => connectWallet('braavos')}
                                    disabled={isButtonLoading}
                                    className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                                >
                                    {isButtonLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wallet size={20} />
                                            <span>Connect Braavos</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => connectWallet('argentX')}
                                    disabled={isButtonLoading}
                                    className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                                >
                                    {isButtonLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wallet size={20} />
                                            <span>Connect Argent</span>
                                        </>
                                    )}
                                </button>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="text-center space-y-2 text-sm text-zinc-500 max-w-md">
                            <p>Admin wallet required: 0x03037d2...4BCcf</p>
                            <p>Only the authorized admin wallet can access this dashboard.</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // If connected but not admin, show access denied
    if (!isAdmin) {
        return (
            <main className="min-h-screen bg-background">
                <SiteHeader
                    title="Shieldly"
                    subtitle="Admin Dashboard"
                    userInfo={{
                        label: "Connected Wallet",
                        value: `${address?.slice(0, 7)}...${address?.slice(-4)}`
                    }}
                    actionLabel="Disconnect"
                    onAction={() => disconnectFn()}
                />

                <div className="container mx-auto py-8 px-4">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                        <div className="text-center space-y-4">
                            <AlertCircle size={64} className="text-red-500 mx-auto" />
                            <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
                            <p className="text-lg text-zinc-600 max-w-md">
                                This wallet is not authorized to access the admin dashboard. Please connect with the authorized admin wallet.
                            </p>
                        </div>

                        <Card className="w-full max-w-md shadow-lg">
                            <CardContent className="pt-6">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Connected:</span>
                                        <span className="font-mono">{address?.slice(0, 10)}...{address?.slice(-6)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Required:</span>
                                        <span className="font-mono">0x03037d2...4BCcf</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => disconnectFn()}
                                >
                                    Disconnect & Try Again
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }
    // Calculate metrics from real data
    const totalPolicies = policies?.length || 0;
    const draftPolicies = policies?.filter(p => p.status === 0).length || 0; // DRAFT = 0
    const activePolicies = policies?.filter(p => p.status === 1).length || 0; // ACTIVE = 1
    const totalClaims = claims?.length || 0;
    const pendingClaims = claims?.filter(c => c.status === 0).length || 0; // PENDING = 0

    return (
        <main className="min-h-screen bg-background">
            <SiteHeader
                title="Shieldly"
                subtitle="Admin Dashboard"
                userInfo={{
                    label: "Admin Wallet",
                    value: `${address?.slice(0, 7)}...${address?.slice(-4)}`
                }}
                actionLabel="Disconnect"
                onAction={() => disconnectFn()}
            />

            <div className="container mx-auto py-8 px-4">
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
                        <span className="ml-2">Loading admin data...</span>
                    </div>
                )}

                {/* Key metrics cards - using real data */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Total Policies</CardTitle>
                            <CardDescription>All insurance policies in system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalPolicies}</div>
                            <p className="text-sm text-zinc-500 mt-1">
                                {activePolicies} active, {draftPolicies} draft
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Open Claims</CardTitle>
                            <CardDescription>Claims awaiting processing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600">{pendingClaims}</div>
                            <p className="text-sm text-zinc-500 mt-1">
                                {totalClaims} total claims submitted
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">System Status</CardTitle>
                            <CardDescription>Admin dashboard status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">Online</div>
                            <p className="text-sm text-zinc-500 mt-1">
                                All systems operational
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main action cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Policy</CardTitle>
                            <CardDescription>Define a new insurance product for users</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-sm text-zinc-600">Create parametric insurance policies that automatically trigger payouts based on predefined conditions.</p>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">Active Policy Types:</span>
                                <span className="text-sm">3</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">Last Created:</span>
                                <span className="text-sm">May 14, 2025</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium">Most Popular:</span>
                                <span className="text-sm">Crop Insurance</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" asChild>
                                <Link href="/admin/policies/new">Create Policy</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Process Claims</CardTitle>
                            <CardDescription>Review and approve insurance claims</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-sm text-zinc-600">Process claims that require manual verification or have been flagged by the automated system.</p>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">Pending Review:</span>
                                <span className="text-sm text-amber-600 font-medium">23</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">High Priority:</span>
                                <span className="text-sm text-red-600 font-medium">5</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium">Avg. Processing Time:</span>
                                <span className="text-sm">1.2 days</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" asChild>
                                <Link href="/admin/claims">Process Claims</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Recent activity table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest policy and claim events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-3 font-medium text-zinc-500">Time</th>
                                        <th className="text-left py-3 px-3 font-medium text-zinc-500">Event</th>
                                        <th className="text-left py-3 px-3 font-medium text-zinc-500">Details</th>
                                        <th className="text-right py-3 px-3 font-medium text-zinc-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-3 px-3">2 hours ago</td>
                                        <td className="py-3 px-3">New Claim</td>
                                        <td className="py-3 px-3">Crop damage claim submitted by John D.</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Pending Review</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-3">5 hours ago</td>
                                        <td className="py-3 px-3">Policy Created</td>
                                        <td className="py-3 px-3">New livestock policy for Maria L.</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-3">Yesterday</td>
                                        <td className="py-3 px-3">Claim Processed</td>
                                        <td className="py-3 px-3">Equipment damage claim for Robert K.</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Approved</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-3">Yesterday</td>
                                        <td className="py-3 px-3">Policy Created</td>
                                        <td className="py-3 px-3">Health insurance policy template</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
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