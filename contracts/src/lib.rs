#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, Env, Vec, vec
};

// ===== ERRORS =====
#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TrustLendError {
    NotFound = 1,
    NotPending = 2,
    Unauthorized = 3,
    InsufficientScore = 4,
    AlreadyRepaid = 5,
    InvalidAmount = 6,
    LoanNotActive = 7,
    GuaranteeNotFound = 8,
    AlreadyDefaulted = 9,
}

// ===== ENUMS =====
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Pending = 0,
    Released = 1,
    Refunded = 2,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    Pending = 0,
    Active = 1,
    Repaid = 2,
    Rejected = 3,
    Defaulted = 4,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum GuaranteeStatus {
    Locked = 0,
    Released = 1,
    Slashed = 2,
}

// ===== STRUCTS =====
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub sender: Address,
    pub receiver: Address,
    pub amount: i128,
    pub status: EscrowStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    pub borrower: Address,
    pub amount: i128,
    pub repaid: i128,
    pub duration: u32,
    pub trust_score: u32,
    pub status: LoanStatus,
    pub escrow_id: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Guarantee {
    pub guarantor: Address,
    pub borrower: Address,
    pub amount: i128,
    pub status: GuaranteeStatus,
}
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserScore {
    pub score: u32,
    pub total_loans: u32,
    pub loans_repaid: u32,
    pub loans_defaulted: u32,
    pub last_updated: u64,
}
// ===== STORAGE KEYS =====
#[contracttype]
pub enum DataKey {
    // Counters
    EscrowCounter,
    LoanCounter,
    GuaranteeCounter,
    // Records
    Escrow(u64),
    Loan(u64),
    Guarantee(u64),
    // Admin
    Admin,
    // Pool
    PoolBalance,
    // Indexes
    WalletEscrows(Address),
    WalletLoans(Address),
    WalletGuarantees(Address),
    UserScore(Address), 
}

// ===== CONTRACT =====
#[contract]
pub struct TrustLendContract;

#[contractimpl]
impl TrustLendContract {

    // ===== INIT =====
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PoolBalance, &0i128);
        env.storage().instance().set(&DataKey::EscrowCounter, &0u64);
        env.storage().instance().set(&DataKey::LoanCounter, &0u64);
        env.storage().instance().set(&DataKey::GuaranteeCounter, &0u64);
    }

    // ===== LENDER FUNCTIONS =====

    /// Lender deposits funds → locked in escrow
    pub fn create_escrow(
        env: Env,
        sender: Address,
        receiver: Address,
        amount: i128,
    ) -> Result<u64, TrustLendError> {
        sender.require_auth();

        if amount <= 0 {
            return Err(TrustLendError::InvalidAmount);
        }

        let mut id: u64 = env.storage().instance()
            .get(&DataKey::EscrowCounter).unwrap_or(0);
        id += 1;
        env.storage().instance().set(&DataKey::EscrowCounter, &id);

        let escrow = Escrow {
            sender: sender.clone(),
            receiver,
            amount,
            status: EscrowStatus::Pending,
        };

        env.storage().persistent().set(&DataKey::Escrow(id), &escrow);

        // Update pool balance
        let pool_bal: i128 = env.storage().instance()
            .get(&DataKey::PoolBalance).unwrap_or(0);
        env.storage().instance().set(&DataKey::PoolBalance, &(pool_bal + amount));

        // Index by wallet
        let mut wallet_escrows: Vec<u64> = env.storage().persistent()
            .get(&DataKey::WalletEscrows(sender.clone()))
            .unwrap_or(vec![&env]);
        wallet_escrows.push_back(id);
        env.storage().persistent()
            .set(&DataKey::WalletEscrows(sender), &wallet_escrows);

        Ok(id)
    }

    /// Release escrow funds to receiver (AI approved)
    pub fn release_funds(
        env: Env,
        escrow_id: u64,
    ) -> Result<(), TrustLendError> {
        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env.storage().persistent()
            .get(&key).ok_or(TrustLendError::NotFound)?;

        if escrow.status != EscrowStatus::Pending {
            return Err(TrustLendError::NotPending);
        }

        escrow.receiver.require_auth();
        escrow.status = EscrowStatus::Released;
        env.storage().persistent().set(&key, &escrow);

        // Deduct from pool balance
        let pool_bal: i128 = env.storage().instance()
            .get(&DataKey::PoolBalance).unwrap_or(0);
        env.storage().instance()
            .set(&DataKey::PoolBalance, &(pool_bal - escrow.amount));

        Ok(())
    }

    /// Refund escrow to sender (AI rejected / loan cancelled)
    pub fn refund_funds(
        env: Env,
        escrow_id: u64,
    ) -> Result<(), TrustLendError> {
        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env.storage().persistent()
            .get(&key).ok_or(TrustLendError::NotFound)?;

        if escrow.status != EscrowStatus::Pending {
            return Err(TrustLendError::NotPending);
        }

        escrow.sender.require_auth();
        escrow.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&key, &escrow);

        // Deduct from pool balance
        let pool_bal: i128 = env.storage().instance()
            .get(&DataKey::PoolBalance).unwrap_or(0);
        env.storage().instance()
            .set(&DataKey::PoolBalance, &(pool_bal - escrow.amount));

        Ok(())
    }

    // ===== BORROWER FUNCTIONS =====

    /// Borrower requests loan → stored on chain
pub fn request_loan(
    env: Env,
    borrower: Address,
    amount: i128,
    duration: u32,
    escrow_id: u64,
) -> Result<u64, TrustLendError> {
    borrower.require_auth();

    if amount <= 0 {
        return Err(TrustLendError::InvalidAmount);
    }

    // READ SCORE FROM CHAIN — cannot be faked
    let score_data: UserScore = env.storage().persistent()
        .get(&DataKey::UserScore(borrower.clone()))
        .ok_or(TrustLendError::NotFound)?;

    let trust_score = score_data.score;

    let mut id: u64 = env.storage().instance()
        .get(&DataKey::LoanCounter).unwrap_or(0);
    id += 1;
    env.storage().instance().set(&DataKey::LoanCounter, &id);

    let loan = Loan {
        borrower: borrower.clone(),
        amount,
        repaid: 0,
        duration,
        trust_score,
        status: LoanStatus::Pending,
        escrow_id,
    };

    env.storage().persistent().set(&DataKey::Loan(id), &loan);

    let mut wallet_loans: Vec<u64> = env.storage().persistent()
        .get(&DataKey::WalletLoans(borrower.clone()))
        .unwrap_or(vec![&env]);
    wallet_loans.push_back(id);
    env.storage().persistent()
        .set(&DataKey::WalletLoans(borrower), &wallet_loans);

    Ok(id)
}
    /// AI auto release based on trust score
  pub fn auto_release(
    env: Env,
    loan_id: u64,
    admin: Address,
) -> Result<bool, TrustLendError> {
    admin.require_auth();

    // Verify admin
    let stored_admin: Address = env.storage().instance()
        .get(&DataKey::Admin)
        .ok_or(TrustLendError::Unauthorized)?;
    if admin != stored_admin {
        return Err(TrustLendError::Unauthorized);
    }

    // LOAD LOAN FIRST
    let key = DataKey::Loan(loan_id);
    let mut loan: Loan = env.storage().persistent()
        .get(&key).ok_or(TrustLendError::NotFound)?;

    if loan.status != LoanStatus::Pending {
        return Err(TrustLendError::LoanNotActive);
    }

    // THEN READ SCORE USING loan.borrower
    let score_data: UserScore = env.storage().persistent()
        .get(&DataKey::UserScore(loan.borrower.clone()))
        .ok_or(TrustLendError::NotFound)?;

    // HARDCODED MINIMUM — no param needed
    if score_data.score >= 500 {
        loan.status = LoanStatus::Active;
        env.storage().persistent().set(&key, &loan);
        Ok(true)
    } else {
        loan.status = LoanStatus::Rejected;
        env.storage().persistent().set(&key, &loan);
        Ok(false)
    }
}
    /// Borrower repays loan
    pub fn repay_loan(
        env: Env,
        loan_id: u64,
        borrower: Address,
        amount: i128,
    ) -> Result<i128, TrustLendError> {
        borrower.require_auth();

        if amount <= 0 {
            return Err(TrustLendError::InvalidAmount);
        }

        let key = DataKey::Loan(loan_id);
        let mut loan: Loan = env.storage().persistent()
            .get(&key).ok_or(TrustLendError::NotFound)?;

        if loan.status != LoanStatus::Active {
            return Err(TrustLendError::LoanNotActive);
        }

        if loan.borrower != borrower {
            return Err(TrustLendError::Unauthorized);
        }

        loan.repaid += amount;

        // Update pool balance
        let pool_bal: i128 = env.storage().instance()
            .get(&DataKey::PoolBalance).unwrap_or(0);
        env.storage().instance()
            .set(&DataKey::PoolBalance, &(pool_bal + amount));

        // Check if fully repaid
        if loan.repaid >= loan.amount {
            loan.status = LoanStatus::Repaid;
        }

        let remaining = (loan.amount - loan.repaid).max(0);
        env.storage().persistent().set(&key, &loan);

        Ok(remaining)
    }

    /// Mark loan as defaulted (backend cron job)
    pub fn mark_default(
        env: Env,
        loan_id: u64,
        admin: Address,
    ) -> Result<(), TrustLendError> {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .ok_or(TrustLendError::Unauthorized)?;
        if admin != stored_admin {
            return Err(TrustLendError::Unauthorized);
        }

        let key = DataKey::Loan(loan_id);
        let mut loan: Loan = env.storage().persistent()
            .get(&key).ok_or(TrustLendError::NotFound)?;

        if loan.status != LoanStatus::Active {
            return Err(TrustLendError::LoanNotActive);
        }

        loan.status = LoanStatus::Defaulted;
        env.storage().persistent().set(&key, &loan);

        Ok(())
    }

    // ===== GUARANTOR FUNCTIONS =====

    /// Guarantor locks funds for borrower
    pub fn lock_guarantee(
        env: Env,
        guarantor: Address,
        borrower: Address,
        amount: i128,
    ) -> Result<u64, TrustLendError> {
        guarantor.require_auth();

        if amount <= 0 {
            return Err(TrustLendError::InvalidAmount);
        }

        let mut id: u64 = env.storage().instance()
            .get(&DataKey::GuaranteeCounter).unwrap_or(0);
        id += 1;
        env.storage().instance().set(&DataKey::GuaranteeCounter, &id);

        let guarantee = Guarantee {
            guarantor: guarantor.clone(),
            borrower,
            amount,
            status: GuaranteeStatus::Locked,
        };

        env.storage().persistent().set(&DataKey::Guarantee(id), &guarantee);

        // Index by wallet
        let mut wallet_guarantees: Vec<u64> = env.storage().persistent()
            .get(&DataKey::WalletGuarantees(guarantor.clone()))
            .unwrap_or(vec![&env]);
        wallet_guarantees.push_back(id);
        env.storage().persistent()
            .set(&DataKey::WalletGuarantees(guarantor), &wallet_guarantees);

        Ok(id)
    }

    /// Release guarantor after full repayment
    pub fn release_guarantee(
        env: Env,
        guarantee_id: u64,
        admin: Address,
    ) -> Result<(), TrustLendError> {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .ok_or(TrustLendError::Unauthorized)?;
        if admin != stored_admin {
            return Err(TrustLendError::Unauthorized);
        }

        let key = DataKey::Guarantee(guarantee_id);
        let mut guarantee: Guarantee = env.storage().persistent()
            .get(&key).ok_or(TrustLendError::GuaranteeNotFound)?;

        guarantee.status = GuaranteeStatus::Released;
        env.storage().persistent().set(&key, &guarantee);

        Ok(())
    }

    /// Slash guarantor on borrower default
    pub fn slash_guarantee(
        env: Env,
        guarantee_id: u64,
        admin: Address,
    ) -> Result<(), TrustLendError> {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .ok_or(TrustLendError::Unauthorized)?;
        if admin != stored_admin {
            return Err(TrustLendError::Unauthorized);
        }

        let key = DataKey::Guarantee(guarantee_id);
        let mut guarantee: Guarantee = env.storage().persistent()
            .get(&key).ok_or(TrustLendError::GuaranteeNotFound)?;

        guarantee.status = GuaranteeStatus::Slashed;
        env.storage().persistent().set(&key, &guarantee);

        Ok(())
    }
// ===== TRUST SCORE FUNCTIONS =====

    /// Called when user registers — sets initial score
    pub fn init_score(
        env: Env,
        user: Address,
        admin: Address,
    ) -> Result<(), TrustLendError> {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .ok_or(TrustLendError::Unauthorized)?;
        if admin != stored_admin {
            return Err(TrustLendError::Unauthorized);
        }

        let score = UserScore {
            score: 300,           // everyone starts at 300
            total_loans: 0,
            loans_repaid: 0,
            loans_defaulted: 0,
            last_updated: env.ledger().timestamp(),
        };

        env.storage().persistent()
            .set(&DataKey::UserScore(user), &score);

        Ok(())
    }

    /// Admin updates score after repayment or default
    pub fn update_score(
        env: Env,
        user: Address,
        admin: Address,
        on_time: bool,
        defaulted: bool,
    ) -> Result<u32, TrustLendError> {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .ok_or(TrustLendError::Unauthorized)?;
        if admin != stored_admin {
            return Err(TrustLendError::Unauthorized);
        }

        let key = DataKey::UserScore(user.clone());
        let mut score_data: UserScore = env.storage().persistent()
            .get(&key)
            .ok_or(TrustLendError::NotFound)?;

        if defaulted {
            // Default → big penalty
            score_data.score = score_data.score.saturating_sub(100);
            score_data.loans_defaulted += 1;
            score_data.total_loans += 1;

            // 2+ defaults → blacklist (score floor 0)
            if score_data.loans_defaulted >= 2 {
                score_data.score = 0;
            }

        } else if on_time {
            // Repaid on time → reward
            score_data.score = (score_data.score + 15).min(1000);
            score_data.loans_repaid += 1;
            score_data.total_loans += 1;

        } else {
            // Repaid but late → small penalty
            score_data.score = score_data.score.saturating_sub(25);
            score_data.loans_repaid += 1;
            score_data.total_loans += 1;
        }

        score_data.last_updated = env.ledger().timestamp();
        env.storage().persistent().set(&key, &score_data);

        Ok(score_data.score)
    }

    /// Anyone can read a user's score — public
    pub fn get_score(
        env: Env,
        user: Address,
    ) -> Result<UserScore, TrustLendError> {
        env.storage().persistent()
            .get(&DataKey::UserScore(user))
            .ok_or(TrustLendError::NotFound)
    }
    // ===== READ FUNCTIONS =====

    pub fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, TrustLendError> {
        env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(TrustLendError::NotFound)
    }

    pub fn get_loan(env: Env, loan_id: u64) -> Result<Loan, TrustLendError> {
        env.storage().persistent()
            .get(&DataKey::Loan(loan_id))
            .ok_or(TrustLendError::NotFound)
    }

    pub fn get_guarantee(env: Env, guarantee_id: u64) -> Result<Guarantee, TrustLendError> {
        env.storage().persistent()
            .get(&DataKey::Guarantee(guarantee_id))
            .ok_or(TrustLendError::GuaranteeNotFound)
    }

    pub fn get_pool_balance(env: Env) -> i128 {
        env.storage().instance()
            .get(&DataKey::PoolBalance).unwrap_or(0)
    }

    pub fn get_wallet_escrows(env: Env, wallet: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::WalletEscrows(wallet))
            .unwrap_or(vec![&env])
    }

    pub fn get_wallet_loans(env: Env, wallet: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::WalletLoans(wallet))
            .unwrap_or(vec![&env])
    }

    pub fn get_wallet_guarantees(env: Env, wallet: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::WalletGuarantees(wallet))
            .unwrap_or(vec![&env])
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }
}