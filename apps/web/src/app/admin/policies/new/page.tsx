"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { useState } from "react";
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAdmin } from "@/lib/hooks/useAdmin";
import { PolicyMetadata } from "@/lib/types/contracts";
import { parseTokenAmount } from "@/lib/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreatePolicy() {
    const { address } = useAccount();
    const { disconnect: disconnectFn } = useDisconnect();
    const router = useRouter();

    const {
        isAdmin,
        isCreatingPolicy,
        actions,
        error: adminError
    } = useAdmin();

    const [formData, setFormData] = useState({
        coverageAmount: '',
        premiumAmount: '',
        payoutAmount: '',
        termDays: '',
        triggerDescription: '',
        details: ''
    });
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if not admin
    if (!isAdmin) {
        router.push('/admin/dashboard');
        return null;
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError(''); // Clear error when user types
    };

    const validateForm = (): boolean => {
        if (!formData.coverageAmount || !formData.premiumAmount || !formData.payoutAmount) {
            setError('Coverage amount, premium amount, and payout amount are required');
            return false;
        }

        if (!formData.termDays || parseInt(formData.termDays) <= 0) {
            setError('Term days must be a positive number');
            return false;
        }

        if (!formData.triggerDescription.trim()) {
            setError('Trigger description is required');
            return false;
        }

        const coverage = parseFloat(formData.coverageAmount);
        const premium = parseFloat(formData.premiumAmount);
        const payout = parseFloat(formData.payoutAmount);

        if (coverage <= 0 || premium <= 0 || payout <= 0) {
            setError('All amounts must be positive numbers');
            return false;
        }

        if (payout > coverage) {
            setError('Payout amount cannot exceed coverage amount');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');

            const metadata: PolicyMetadata = {
                coverage_amount: parseTokenAmount(formData.coverageAmount, 6), // USDC has 6 decimals
                premium_amount: parseTokenAmount(formData.premiumAmount, 6),
                payout_amount: parseTokenAmount(formData.payoutAmount, 6),
                term_days: parseInt(formData.termDays),
                trigger_description: formData.triggerDescription,
                details: formData.details || 'No additional details provided'
            };

            const policyId = await actions.createPolicy(metadata);

            // Success - redirect to dashboard
            router.push('/admin/dashboard');

        } catch (err: any) {
            console.error('Error creating policy:', err);
            setError(err.message || 'Failed to create policy');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-background">
            <SiteHeader
                title="Shieldly"
                subtitle="Create New Policy"
                userInfo={{
                    label: "Admin Wallet",
                    value: `${address?.slice(0, 7)}...${address?.slice(-4)}`
                }}
                actionLabel="Disconnect"
                onAction={() => disconnectFn()}
            />

            <div className="container mx-auto py-8 px-4 max-w-2xl">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Create Insurance Policy</CardTitle>
                        <CardDescription>
                            Define a new parametric insurance policy that users can purchase
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Financial Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Financial Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="coverageAmount">Coverage Amount (USDC)</Label>
                                        <Input
                                            id="coverageAmount"
                                            type="number"
                                            step="0.01"
                                            placeholder="1000.00"
                                            value={formData.coverageAmount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('coverageAmount', e.target.value)}
                                            disabled={isSubmitting || isCreatingPolicy}
                                        />
                                        <p className="text-xs text-zinc-500">Total coverage provided by this policy</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="premiumAmount">Premium Amount (USDC)</Label>
                                        <Input
                                            id="premiumAmount"
                                            type="number"
                                            step="0.01"
                                            placeholder="50.00"
                                            value={formData.premiumAmount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('premiumAmount', e.target.value)}
                                            disabled={isSubmitting || isCreatingPolicy}
                                        />
                                        <p className="text-xs text-zinc-500">Cost for users to purchase this policy</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payoutAmount">Payout Amount (USDC)</Label>
                                        <Input
                                            id="payoutAmount"
                                            type="number"
                                            step="0.01"
                                            placeholder="800.00"
                                            value={formData.payoutAmount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('payoutAmount', e.target.value)}
                                            disabled={isSubmitting || isCreatingPolicy}
                                        />
                                        <p className="text-xs text-zinc-500">Amount paid out when claim is approved</p>
                                    </div>
                                </div>
                            </div>

                            {/* Policy Terms */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Policy Terms</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="termDays">Term Duration (Days)</Label>
                                    <Input
                                        id="termDays"
                                        type="number"
                                        placeholder="90"
                                        value={formData.termDays}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('termDays', e.target.value)}
                                        disabled={isSubmitting || isCreatingPolicy}
                                    />
                                    <p className="text-xs text-zinc-500">How long the policy remains active after purchase</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="triggerDescription">Trigger Condition</Label>
                                    <Input
                                        id="triggerDescription"
                                        placeholder="e.g., Rainfall below 50mm in 30-day period"
                                        value={formData.triggerDescription}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('triggerDescription', e.target.value)}
                                        disabled={isSubmitting || isCreatingPolicy}
                                    />
                                    <p className="text-xs text-zinc-500">Condition that triggers automatic payout</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="details">Additional Details (Optional)</Label>
                                    <textarea
                                        id="details"
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                        placeholder="Additional policy terms, conditions, or descriptions..."
                                        value={formData.details}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('details', e.target.value)}
                                        disabled={isSubmitting || isCreatingPolicy}
                                        rows={4}
                                    />
                                    <p className="text-xs text-zinc-500">Any additional information about this policy</p>
                                </div>
                            </div>

                            {/* Summary */}
                            {formData.coverageAmount && formData.premiumAmount && formData.payoutAmount && (
                                <div className="bg-zinc-50 p-4 rounded-lg space-y-2">
                                    <h4 className="font-medium">Policy Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-zinc-500">Premium to Coverage Ratio:</span>
                                            <span className="ml-2 font-medium">
                                                {((parseFloat(formData.premiumAmount) / parseFloat(formData.coverageAmount)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">Payout to Coverage Ratio:</span>
                                            <span className="ml-2 font-medium">
                                                {((parseFloat(formData.payoutAmount) / parseFloat(formData.coverageAmount)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.push('/admin/dashboard')}
                                    disabled={isSubmitting || isCreatingPolicy}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isSubmitting || isCreatingPolicy}
                                >
                                    {isSubmitting || isCreatingPolicy ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            Creating Policy...
                                        </>
                                    ) : (
                                        'Create Policy'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
} 