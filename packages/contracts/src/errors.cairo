pub mod CoreErrors {
    pub const Paused: felt252 = 'shieldly: contract paused';
    pub const NotAdmin: felt252 = 'shieldly: caller is not admin';
    pub const NotKycManager: felt252 = 'shieldly: not kyc manager';
    pub const AlreadyRegistered: felt252 = 'shieldly: user exists';
    pub const UserNotFound: felt252 = 'shieldly: user not found';
    pub const UserNotActive: felt252 = 'shieldly: user not active';
    pub const KycNotVerified: felt252 = 'shieldly: kyc not verified';
    pub const InvalidClassHash: felt252 = 'shieldly: invalid class hash';
}

pub mod PolicyErrors {
    pub const Paused: felt252 = 'shieldly: contract paused';
    pub const NotAdmin: felt252 = 'shieldly: caller is not admin';
    pub const InvalidAmount: felt252 = 'shieldly: invalid amount';
    pub const PolicyNotFound: felt252 = 'shieldly: policy not found';
    pub const PolicyNotActive: felt252 = 'shieldly: policy is not active';
    pub const UserDoesNotOwnPolicy: felt252 = 'shieldly: not policy owner';
    pub const PolicyExpired: felt252 = 'shieldly: policy expired';
    pub const ClaimNotFound: felt252 = 'shieldly: claim not found';
    pub const ClaimNotPending: felt252 = 'shieldly: claim is not pending';
    pub const ClaimNotApproved: felt252 = 'shieldly: claim is not approved';
    pub const CoverageInvalid: felt252 = 'shieldly: coverage is invalid';
    pub const PremiumInvalid: felt252 = 'shieldly: premium is invalid';
    pub const PayoutInvalid: felt252 = 'shieldly: payout is invalid';
    pub const TermInvalid: felt252 = 'shieldly: term is invalid';
    pub const PayoutExceedsCoverage: felt252 = 'shieldly: payout > coverage';
    pub const TokenNotConfigured: felt252 = 'shieldly: token not configured';
    pub const ApprovalFailed: felt252 = 'shieldly: token approval failed';
    pub const TransferFailed: felt252 = 'shieldly: token transfer failed';
    pub const ReserveNotSet: felt252 = 'shieldly: reserve not set';
    pub const InvalidTokenAddress: felt252 = 'shieldly: invalid token address';
    pub const NotAuthorizedRenewer: felt252 = 'shieldly: unauthorized renewer';
    pub const NoRenewalsRemaining: felt252 = 'shieldly: no renewals left';
    pub const TooEarlyForRenewal: felt252 = 'shieldly: too early to renew';
    pub const InsufficientAllowance: felt252 = 'shieldly: low allowance';
}

pub mod ReserveErrors {
    pub const Paused: felt252 = 'shieldly: contract paused';
    pub const NotAdmin: felt252 = 'shieldly: caller is not admin';
    pub const InvalidAmount: felt252 = 'shieldly: invalid amount';
    pub const InsufficientFunds: felt252 = 'shieldly: insufficient funds';
    pub const NoStake: felt252 = 'shieldly: no stake';
    pub const RateExceedsMax: felt252 = 'shieldly: rate exceeds max';
    pub const TokenNotConfigured: felt252 = 'shieldly: token not configured';
    pub const TokenTransferFailed: felt252 = 'shieldly: token transfer failed';
    pub const InvalidTokenAddress: felt252 = 'shieldly: invalid token address';
    pub const NotApprovedPolicy: felt252 = 'shieldly: not approved policy';
    pub const InvalidAddress: felt252 = 'shieldly: invalid address';
}
