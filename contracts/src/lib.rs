#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Pending = 0,
    Released = 1,
    Refunded = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub sender: Address,
    pub receiver: Address,
    pub amount: i128,
    pub status: EscrowStatus,
}

#[contracttype]
pub enum DataKey {
    Counter,
    Escrow(u64),
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Register escrow after XLM has been sent via classic payment
    pub fn create_escrow(
        env: Env,
        sender: Address,
        receiver: Address,
        amount: i128,
    ) -> u64 {
        sender.require_auth();

        let mut id: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        id += 1;
        env.storage().instance().set(&DataKey::Counter, &id);

        let escrow = Escrow {
            sender,
            receiver,
            amount,
            status: EscrowStatus::Pending,
        };

        env.storage().persistent().set(&DataKey::Escrow(id), &escrow);
        id
    }

    pub fn release_funds(env: Env, escrow_id: u64) {
        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Escrow not found"));

        if escrow.status != EscrowStatus::Pending {
            panic!("Escrow is not pending");
        }

        escrow.receiver.require_auth();
        escrow.status = EscrowStatus::Released;
        env.storage().persistent().set(&key, &escrow);
    }

    pub fn refund_funds(env: Env, escrow_id: u64) {
        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Escrow not found"));

        if escrow.status != EscrowStatus::Pending {
            panic!("Escrow is not pending");
        }

        escrow.sender.require_auth();
        escrow.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&key, &escrow);
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .unwrap_or_else(|| panic!("Escrow not found"))
    }
}