"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useState } from "react";
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useReserve } from "@/lib/hooks/useReserve";
import { formatUSD, formatPercentage, formatBasisPoints, parseTokenAmount, formatDate } from "@/lib/utils/format";

export default function FunderDashboard() {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect: disconnectFn } = useDisconnect();
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [stakeAmount, setStakeAmount] = useState<string>('');
    const [unstakeAmount, setUnstakeAmount] = useState<string>('');

    // Use the reserve hook
    const {
        metrics,
        userProfile,
        reserveData,
        isLoading: isLoadingReserve,
        isStaking,
        isUnstaking,
        isClaiming,
        actions,
        error: reserveError,
        refetch
    } = useReserve();

    const connectWallet = async (walletType: 'braavos' | 'argentX') => {
        try {
            setError('');
            setIsLoading(true);

            // Find the specific connector
            const targetConnector = connectors.find(
                connector => connector.id === walletType
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

    if (!isConnected || !address) {
        return (
            <main className="min-h-screen bg-background">
                <SiteHeader
                    title="Shieldly"
                    subtitle="Funder Dashboard"
                />

                <div className="container mx-auto py-8 px-4">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-bold">Connect Your Wallet</h1>
                            <p className="text-lg text-zinc-600 max-w-md">
                                Connect your Starknet wallet to access the funder dashboard and start earning yield from insurance premiums.
                            </p>
                        </div>

                        <Card className="w-full max-w-md shadow-lg">
                            <CardHeader>
                                <CardTitle>Choose Your Wallet</CardTitle>
                                <CardDescription>Select your preferred Starknet wallet to connect</CardDescription>
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
                            <p>Supported wallets: Braavos & Argent</p>
                            <p>Choose your preferred Starknet wallet to connect and access the dashboard.</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <SiteHeader
                title="Shieldly"
                subtitle="Funder Dashboard"
                userInfo={{
                    label: "Connected Wallet",
                    value: `${address?.slice(0, 7)}...${address?.slice(-4)}`
                }}
                actionLabel="Disconnect"
                onAction={() => disconnectFn()}
            />

            <div className="container mx-auto py-8 px-4">
                {/* Error display */}
                {(reserveError || error) && (
                    <div className="mb-6 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        <AlertCircle size={16} />
                        <span>{reserveError || error}</span>
                    </div>
                )}

                {/* Loading state */}
                {isLoadingReserve && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin h-8 w-8" />
                        <span className="ml-2">Loading reserve data...</span>
                    </div>
                )}

                {/* Key metrics cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Total Pool Value</CardTitle>
                            <CardDescription>Current TVL in the reserve pool</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {metrics ? formatUSD(metrics.totalPoolValue, 6) : '$0'}
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">
                                {reserveData ? `${reserveData.total_stakers} stakers` : 'Loading...'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Your Stake</CardTitle>
                            <CardDescription>Your contributed capital</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {metrics ? formatUSD(metrics.userStake, 6) : '$0'}
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">
                                {metrics ? `${formatPercentage(metrics.userStakePercentage)} of total pool` : 'Loading...'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Current APR</CardTitle>
                            <CardDescription>Based on current yield rate</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {metrics ? formatBasisPoints(metrics.currentYieldRate) : '0%'}
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">
                                Accrued yield: {metrics ? formatUSD(metrics.availableYield, 6) : '$0'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Action cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stake Funds</CardTitle>
                            <CardDescription>Add funds to the insurance reserve pool</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="stake-amount">Amount (USDC)</Label>
                                <Input
                                    id="stake-amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={stakeAmount}
                                    onChange={(e: any) => setStakeAmount(e.target.value)}
                                    disabled={isStaking}
                                />
                            </div>
                            <div className="text-sm text-zinc-500">
                                Enter amount to stake in the reserve pool
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={async () => {
                                    if (stakeAmount && !isStaking) {
                                        try {
                                            const amount = parseTokenAmount(stakeAmount, 6); // USDC has 6 decimals
                                            await actions.stakeFunds(amount);
                                            setStakeAmount('');
                                        } catch (err) {
                                            console.error('Stake error:', err);
                                        }
                                    }
                                }}
                                disabled={!stakeAmount || isStaking || !metrics}
                            >
                                {isStaking ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Staking...
                                    </>
                                ) : (
                                    'Stake Funds'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Withdraw Stake</CardTitle>
                            <CardDescription>Remove funds from the reserve pool</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="unstake-amount">Amount (USDC)</Label>
                                <Input
                                    id="unstake-amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={unstakeAmount}
                                    onChange={(e: any) => setUnstakeAmount(e.target.value)}
                                    disabled={isUnstaking}
                                />
                            </div>
                            <div className="text-sm text-zinc-500">
                                Staked balance: {metrics ? formatUSD(metrics.userStake, 6) : '$0'}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={async () => {
                                    if (unstakeAmount && !isUnstaking) {
                                        try {
                                            const amount = parseTokenAmount(unstakeAmount, 6); // USDC has 6 decimals
                                            await actions.unstakeFunds(amount);
                                            setUnstakeAmount('');
                                        } catch (err) {
                                            console.error('Unstake error:', err);
                                        }
                                    }
                                }}
                                disabled={!unstakeAmount || isUnstaking || !metrics || metrics.userStake === 0n}
                            >
                                {isUnstaking ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Withdrawing...
                                    </>
                                ) : (
                                    'Withdraw Funds'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Claim Yield</CardTitle>
                            <CardDescription>Collect your earned insurance premiums</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-500">Available yield:</span>
                                <span className="text-lg font-medium">
                                    {metrics ? formatUSD(metrics.availableYield, 6) : '$0'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-500">Last claim:</span>
                                <span className="text-sm">
                                    {metrics && metrics.lastYieldClaimed > 0n
                                        ? formatDate(metrics.lastYieldClaimed)
                                        : 'Never'
                                    }
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={async () => {
                                    if (!isClaiming) {
                                        try {
                                            await actions.claimYield();
                                        } catch (err) {
                                            console.error('Claim error:', err);
                                        }
                                    }
                                }}
                                disabled={isClaiming || !metrics || metrics.availableYield === 0n}
                            >
                                {isClaiming ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Claiming...
                                    </>
                                ) : (
                                    'Claim Yield'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Reserve Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reserve Pool Information</CardTitle>
                        <CardDescription>Current status and metrics of the insurance reserve</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Total Pool Value:</span>
                                    <span className="font-medium">
                                        {metrics ? formatUSD(metrics.totalPoolValue, 6) : '$0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Available Funds:</span>
                                    <span className="font-medium">
                                        {metrics ? formatUSD(metrics.availableFunds, 6) : '$0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Total Stakers:</span>
                                    <span className="font-medium">
                                        {reserveData ? reserveData.total_stakers.toLocaleString() : '0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Current Yield Rate:</span>
                                    <span className="font-medium text-green-600">
                                        {metrics ? formatBasisPoints(metrics.currentYieldRate) : '0%'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Your Stake:</span>
                                    <span className="font-medium">
                                        {metrics ? formatUSD(metrics.userStake, 6) : '$0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Pool Share:</span>
                                    <span className="font-medium">
                                        {metrics ? formatPercentage(metrics.userStakePercentage) : '0%'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Available Yield:</span>
                                    <span className="font-medium text-green-600">
                                        {metrics ? formatUSD(metrics.availableYield, 6) : '$0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500">Last Yield Distribution:</span>
                                    <span className="font-medium">
                                        {reserveData && reserveData.last_yield_distribution > 0n
                                            ? formatDate(reserveData.last_yield_distribution)
                                            : 'Never'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Refresh button */}
                        <div className="mt-6 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={refetch}
                                disabled={isLoadingReserve}
                                className="w-full md:w-auto"
                            >
                                {isLoadingReserve ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Refreshing...
                                    </>
                                ) : (
                                    'Refresh Data'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
} 