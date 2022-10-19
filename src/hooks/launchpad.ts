import {
  CandyMachine,
  createMintNftInstruction,
  findLockupSettingsId,
  PROGRAM_ID,
  remainingAccountsForLockup,
  WhitelistMintMode,
} from '@cardinal/mpl-candy-machine-utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  AccountMeta,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  Transaction,
} from '@solana/web3.js';
import { BN } from 'bn.js';
import { useEffect, useState } from 'react';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Edition, Metadata, MetadataProgram } from '@metaplex-foundation/mpl-token-metadata';
import { createAssociatedTokenAccountInstruction, getAtaForMint } from '../modules/candymachine';

interface MintOptions {
  type: 'Standard' | 'Dynamic';
}

export interface LaunchpadState {
  supply: number;
  minted: number;
  price: number;
}

interface LaunchpadContext {
  onMint: () => Promise<void>;
  refresh: () => void;
  isMinting: boolean;
  launchpadState: {
    supply: number;
    minted: number;
    price: number;
  };
}

export default function useLaunchpad(candyMachineId: string): LaunchpadContext {
  const { connected, publicKey, signTransaction } = useWallet();
  const [candyMachineState, setCandyMachineState] = useState<LaunchpadState>();
  const [cm, setCM] = useState<CandyMachine>();
  const [isMinting, setIsMinting] = useState<boolean>(false);

  const { connection } = useConnection();

  const candyMachinePubkey = new PublicKey(candyMachineId);

  const fetchCandyMachine = async () => {
    const candyMachine = await CandyMachine.fromAccountAddress(connection, candyMachinePubkey);

    const candyMachineState = {
      supply: Number(candyMachine.data.itemsAvailable.toString()),
      minted: Number(candyMachine.itemsRedeemed.toString()),
      price: Number(candyMachine.data.price.toString()) / LAMPORTS_PER_SOL,
    };
    setCandyMachineState(candyMachineState);
    setCM(candyMachine);
  };

  useEffect(() => {
    fetchCandyMachine();
  }, []);

  const onMint = async () => {
    if (connected && publicKey && signTransaction && cm && connection) {
      setIsMinting(true);
      const mintKeypair = Keypair.generate();

      const tokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintKeypair.publicKey,
        publicKey,
        false
      );
      const metadataPDA = await Metadata.getPDA(mintKeypair.publicKey);
      const editionPDA = await Edition.getPDA(mintKeypair.publicKey);
      const [candyMachineCreatorId, candyMachineCreatorIdBump] = await PublicKey.findProgramAddress(
        [Buffer.from('candy_machine'), candyMachinePubkey.toBuffer()],
        PROGRAM_ID
      );

      const mintInstruction = createMintNftInstruction(
        {
          candyMachine: candyMachinePubkey,
          candyMachineCreator: candyMachineCreatorId,
          payer: publicKey,
          wallet: cm.wallet,
          metadata: metadataPDA,
          mint: mintKeypair.publicKey,
          mintAuthority: publicKey,
          updateAuthority: publicKey,
          masterEdition: editionPDA,
          tokenMetadataProgram: MetadataProgram.PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
          recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
          instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        },
        {
          creatorBump: candyMachineCreatorIdBump,
        }
      );

      const remainingAccs: AccountMeta[] = [];

      // TODO: add token payment and other whitelist/etc
      if (cm.tokenMint) {
      }
      if (cm.data.whitelistMintSettings) {
        const whitelistMint = cm.data.whitelistMintSettings.mint;
        const [whitelistTokenAccount, whitelistTokenAccountBump] = await getAtaForMint(
          whitelistMint,
          publicKey
        );
        remainingAccs.push({
          pubkey: whitelistTokenAccount,
          isWritable: false,
          isSigner: false,
        });
        if (cm.data.whitelistMintSettings.mode === WhitelistMintMode.BurnEveryTime) {
          remainingAccs.push({
            pubkey: whitelistMint,
            isWritable: true,
            isSigner: false,
          });
          remainingAccs.push({
            pubkey: publicKey,
            isWritable: false,
            isSigner: true,
          });
        }
      }

      // TODO: lockup settings waiting on motley to decide details
      const [lockupSettingsId] = await findLockupSettingsId(candyMachinePubkey);
      const lockupSettings = await connection.getAccountInfo(lockupSettingsId);
      if (lockupSettings) {
        remainingAccs.push(
          ...(await remainingAccountsForLockup(
            candyMachinePubkey,
            mintKeypair.publicKey,
            tokenAccount
          ))
        );
      }

      // instructions
      const instructions = [
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MintLayout.span,
          lamports: await connection.getMinimumBalanceForRentExemption(MintLayout.span),
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mintKeypair.publicKey,
          0,
          publicKey,
          publicKey
        ),
        createAssociatedTokenAccountInstruction(
          tokenAccount,
          publicKey,
          publicKey,
          mintKeypair.publicKey
        ),
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          mintKeypair.publicKey,
          tokenAccount,
          publicKey,
          [],
          1
        ),
        {
          ...mintInstruction,
          keys: [...mintInstruction.keys, ...remainingAccs],
        },
      ];

      const tx = new Transaction();
      tx.instructions = instructions;
      tx.feePayer = publicKey;
      const recentBlockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = recentBlockhash.blockhash;
      try {
        tx.sign(mintKeypair);
        const signedTx = await signTransaction(tx);

        const txtId = await connection.sendRawTransaction(signedTx.serialize());
        if (txtId) {
          await connection.confirmTransaction(
            {
              blockhash: recentBlockhash.blockhash,
              lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
              signature: txtId,
            },
            'confirmed'
          );
          console.log(`Successfully minted`);
        }
      } catch (err) {
        console.log('Error whilst minting', err);
      } finally {
        await fetchCandyMachine();
        setIsMinting(false);
      }
    } else {
      return;
    }
  };

  return {
    onMint: onMint,
    refresh: fetchCandyMachine,
    isMinting,
    launchpadState: {
      supply: candyMachineState?.supply || 0,
      minted: candyMachineState?.minted || 0,
      price: candyMachineState?.price || 0,
    },
  };
}
