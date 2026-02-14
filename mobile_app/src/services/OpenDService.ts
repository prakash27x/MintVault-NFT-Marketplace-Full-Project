import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as opendIdl } from '../declarations/opend';
import { idlFactory as nftIdl } from '../declarations/nft';
import { CANISTER_IDS } from '../config/canisters';
import { createAgent } from '../ic/agent';
import { tokenService } from './TokenService';

export interface NFT {
    id: Principal;
    name: string;
    owner: Principal;
    image: Uint8Array | number[]; // or string base64
    price: bigint;
}

export class OpenDService {
    private agent: HttpAgent | null = null;

    private async getAgent(identity?: Identity) {
        if (!this.agent || identity) {
            this.agent = await createAgent(identity);
        }
        return this.agent;
    }

    async getOpenDActor(identity?: Identity) {
        const agent = await this.getAgent(identity);
        return Actor.createActor(opendIdl, {
            agent,
            canisterId: CANISTER_IDS.opend,
        });
    }

    async getNFTActor(canisterId: Principal, identity?: Identity) {
        const agent = await this.getAgent(identity);
        return Actor.createActor(nftIdl, {
            agent,
            canisterId,
        });
    }

    async getListedNFTs(identity?: Identity): Promise<NFT[]> {
        const opendActor = await this.getOpenDActor(identity);
        // @ts-ignore
        const listedNFTIds = (await opendActor.getListedNFTs()) as Principal[];

        const nfts: NFT[] = [];
        for (const nftId of listedNFTIds) {
            try {
                const nftActor = await this.getNFTActor(nftId, identity);
                const name = (await nftActor.getName()) as string;
                const owner = (await opendActor.getOriginalOwner(nftId)) as Principal;
                const imageData = (await nftActor.getAsset()) as Uint8Array;
                const price = (await opendActor.getListedNFTPrice(nftId)) as bigint;

                nfts.push({
                    id: nftId,
                    name,
                    owner,
                    image: imageData,
                    price,
                });
            } catch (e) {
                console.error(`Failed to fetch NFT ${nftId.toText()}`, e);
            }
        }
        return nfts;
    }

    async getNFTById(nftId: Principal, identity?: Identity): Promise<NFT | null> {
        try {
            const opendActor = await this.getOpenDActor(identity);
            const nftActor = await this.getNFTActor(nftId, identity);
            const name = (await nftActor.getName()) as string;
            const imageData = (await nftActor.getAsset()) as Uint8Array;
            const isListed = (await opendActor.isListed(nftId)) as boolean;

            let owner: Principal;
            let price: bigint;
            if (isListed) {
                owner = (await opendActor.getOriginalOwner(nftId)) as Principal;
                price = (await opendActor.getListedNFTPrice(nftId)) as bigint;
            } else {
                owner = (await nftActor.getOwner()) as Principal;
                price = BigInt(0);
            }

            return { id: nftId, name, owner, image: imageData, price };
        } catch (e) {
            console.error(`Failed to fetch NFT ${nftId.toText()}`, e);
            return null;
        }
    }

    async getOwnedNFTs(principal: Principal, identity?: Identity): Promise<NFT[]> {
        const opendActor = await this.getOpenDActor(identity);
        const ownedIds = (await opendActor.getOwnedNFTs(principal)) as Principal[];

        const nfts: NFT[] = [];
        for (const nftId of ownedIds) {
            try {
                const nftActor = await this.getNFTActor(nftId, identity);
                const name = (await nftActor.getName()) as string;
                const owner = (await nftActor.getOwner()) as Principal;
                const imageData = (await nftActor.getAsset()) as Uint8Array;
                const isListed = (await opendActor.isListed(nftId)) as boolean;
                const price = isListed
                    ? ((await opendActor.getListedNFTPrice(nftId)) as bigint)
                    : BigInt(0);

                nfts.push({
                    id: nftId,
                    name,
                    owner,
                    image: imageData,
                    price,
                });
            } catch (e) {
                console.error(`Failed to fetch owned NFT ${nftId.toText()}`, e);
            }
        }
        return nfts;
    }

    async buyNFT(
        nftId: Principal,
        sellerId: Principal,
        price: bigint,
        buyerId: Principal,
        identity: Identity
    ): Promise<string> {
        const desc = `NFT purchase from ${sellerId.toText()}`;
        const transferResult = await tokenService.transferWithDescription(
            sellerId,
            price,
            desc,
            identity
        );
        if (transferResult !== 'Success') return transferResult;

        const opendActor = await this.getOpenDActor(identity);
        return opendActor.completePurchase(nftId, sellerId, buyerId) as Promise<string>;
    }

    async sellNFT(nftId: Principal, price: bigint, identity: Identity): Promise<string> {
        const opendActor = await this.getOpenDActor(identity);
        const result = await opendActor.listItem(nftId, price) as string;
        if (result !== 'Success') return result;

        const openDId = await opendActor.getOpenDCanisterID() as Principal;
        const nftActor = await this.getNFTActor(nftId, identity);
        return nftActor.transferOwnership(openDId) as Promise<string>;
    }
}

export const openDService = new OpenDService();
