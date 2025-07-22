import { ethers } from "ethers";
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { decryptToString } from '@lit-protocol/encryption'
import { createSiweMessage, generateAuthSig, LitAccessControlConditionResource } from '@lit-protocol/auth-helpers'
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants'

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export async function decryptContent(cipherText: string, dataToEncryptHash: string, contentId: string): Promise<string> {
  console.log("🔓 Starting Lit Protocol decryption...");
  console.log("📝 Content ID:", contentId);
  console.log("🔑 Data Hash:", dataToEncryptHash);
  console.log("📄 Ciphertext length:", cipherText.length);

  // Use Farcaster wallet provider instead of private key
  const { sdk } = await import('@farcaster/frame-sdk');
  const isMiniApp = await sdk.isInMiniApp();
  
  if (!isMiniApp) {
    throw new Error("Not in Farcaster Mini App environment");
  }

  const provider = await sdk.wallet.getEthereumProvider();
  if (!provider) {
    throw new Error("No Ethereum provider available");
  }

  const ethersProvider = new ethers.BrowserProvider(provider);
  const walletClient = await ethersProvider.getSigner();

  console.log("👤 Decrypting with Farcaster wallet address:", walletClient.address);

  // Handle contentId format
  let bytes32ContentId: string;
  if (contentId.startsWith('0x') && contentId.length === 66) {
    bytes32ContentId = contentId;
    console.log("🔑 Content ID already in bytes32 format:", bytes32ContentId);
  } else {
    bytes32ContentId = ethers.encodeBytes32String(contentId);
    console.log("🔑 Converted Content ID to bytes32:", bytes32ContentId);
  }

  // Initialize Lit Protocol
  const litNodeClient = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilTest });
  await litNodeClient.connect();
  console.log("✅ Lit Protocol connected for decryption");

  // EVM access control conditions
  const evmContractConditions = [
    {
      contractAddress: contentAccessContract,
      functionName: "checkAccess",
      functionParams: [":userAddress", bytes32ContentId],
      functionAbi: {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "contentId",
            "type": "bytes32"
          }
        ],
        "name": "checkAccess",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      chain: "base",
      returnValueTest: {
        key: "",
        comparator: '=',
        value: 'true'
      }
    }
  ];

  console.log("🔐 EVM Contract Conditions:", JSON.stringify(evmContractConditions, null, 2));

  const sessionSigs = await litNodeClient.getSessionSigs({
    chain: "base",
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource(
          await LitAccessControlConditionResource.generateResourceString(
            evmContractConditions,
            dataToEncryptHash
          )
        ),
        ability: LIT_ABILITY.AccessControlConditionDecryption
      }
    ],
    authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: walletClient.address,
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient
      })
      return await generateAuthSig({ signer: walletClient, toSign })
    }
  });

  console.log("✅ Session signatures generated successfully");

  const decrypted = await decryptToString(
    {
      chain: "base",
      ciphertext: cipherText,
      dataToEncryptHash: dataToEncryptHash,
      evmContractConditions,
      sessionSigs
    },
    litNodeClient
  );

  console.log("🎉 Lit Protocol decryption successful:", decrypted);
  return decrypted;
} 