import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as tokenIdl } from '../declarations/token';
import { CANISTER_IDS } from '../config/canisters';
import { createAgent } from '../ic/agent';
import { Identity } from '@dfinity/agent';

export interface Transaction {
    id: bigint;
    amount: bigint;
    description: string;
    from: Principal;
    to: Principal;
    timestamp: bigint;
}

export class TokenService {
    private agent: HttpAgent | null = null;

    private async getAgent(identity?: Identity) {
        if (!this.agent || identity) {
            this.agent = await createAgent(identity);
        }
        return this.agent;
    }

    async getTokenActor(identity?: Identity) {
        const agent = await this.getAgent(identity);
        return Actor.createActor(tokenIdl, {
            agent,
            canisterId: CANISTER_IDS.token,
        });
    }

    async balanceOf(principal: Principal, identity?: Identity): Promise<bigint> {
        const actor = await this.getTokenActor(identity);
        return actor.balanceOf(principal) as Promise<bigint>;
    }

    async getSymbol(identity?: Identity): Promise<string> {
        const actor = await this.getTokenActor(identity);
        return actor.getSymbol() as Promise<string>;
    }

    async getTransactions(principal: Principal, identity?: Identity): Promise<Transaction[]> {
        const actor = await this.getTokenActor(identity);
        return actor.getTransactions(principal) as Promise<Transaction[]>;
    }

    async transfer(to: Principal, amount: number | bigint, identity?: Identity): Promise<string> {
        const actor = await this.getTokenActor(identity);
        return actor.transfer(to, BigInt(amount)) as Promise<string>;
    }

    async transferWithDescription(
        to: Principal,
        amount: bigint,
        description: string,
        identity?: Identity
    ): Promise<string> {
        const actor = await this.getTokenActor(identity);
        return actor.transferWithDescription(to, amount, description) as Promise<string>;
    }

    async rewardQuiz(amount: bigint, identity?: Identity): Promise<string> {
        const actor = await this.getTokenActor(identity);
        return actor.rewardQuiz(amount) as Promise<string>;
    }
}

export const tokenService = new TokenService();
