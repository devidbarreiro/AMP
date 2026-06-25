import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
const { encodeBase64, decodeBase64 } = util;

export interface EncryptedEnvelope {
  nonce: string;
  ciphertext: string;
  senderPublicKey: string;
}

export function encryptForPeer(
  message: Uint8Array,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array,
): EncryptedEnvelope {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box(message, nonce, recipientPublicKey, senderSecretKey);
  if (!ciphertext) throw new Error('Encryption failed');
  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
    senderPublicKey: encodeBase64(nacl.box.keyPair.fromSecretKey(senderSecretKey).publicKey),
  };
}

export function decryptFromPeer(
  envelope: EncryptedEnvelope,
  recipientSecretKey: Uint8Array,
): Uint8Array {
  const nonce = decodeBase64(envelope.nonce);
  const ciphertext = decodeBase64(envelope.ciphertext);
  const senderPublicKey = decodeBase64(envelope.senderPublicKey);
  const plaintext = nacl.box.open(ciphertext, nonce, senderPublicKey, recipientSecretKey);
  if (!plaintext) throw new Error('Decryption failed — invalid key or tampered message');
  return plaintext;
}
