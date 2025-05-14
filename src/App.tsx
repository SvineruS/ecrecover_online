import { useEffect, useState } from "react";
import { hashMessage, recoverAddress, keccak256, toBytes, toHex, Hex, toPrefixedMessage, } from "viem";
import { privateKeyToAddress, sign, signMessage,  } from "viem/accounts";
import "./App.css";


export default function App() {

  const [sign_privateKey, setSign_privateKey] = useState<Hex>("0x0000000000000000000000000000000000000000000000000000000000000001");
  const [sign_address, setSign_address] = useState<Hex>("0x");
  const [sign_message, setSign_message] = useState<Hex>("0x1111");
  const [sign_hashedMessage, setSign_hashedMessage] = useState<Hex>("0x");
  const [sign_prefixedHashedMessage, setSign_prefixedHashedMessage] = useState<Hex>("0x");
  const [sign_hashedPrefixedHashedMessage, setSign_hashedPrefixedHashedMessage] = useState<Hex>("0x");
  const [sign_signature, setSign_signature] = useState({});

  const [verify_signature, setVerify_signature] = useState<Hex>("0xe7ddc834f4ef35aed89d7b2752ee27c5a8708b6a244c03987b1a2157395d396b51186e9e878bf232bf8dbdba64bc59037810cbb2e845cddc800f37a639218fd21b");
  const [verify_message, setVerify_message] = useState<Hex>("0x1111");
  const [verify_result, setVerify_result] = useState({});


  useEffect(() => {
    setSign_message("0x1111")
  }, []);

  useEffect(() => {
    try {
      const address = privateKeyToAddress(sign_privateKey);
      setSign_address(address);
    } catch (e) {
      // @ts-ignore
      setSign_address("Invalid private key");
    }
  }, [sign_privateKey]);

  useEffect(() => {
    const hashedMessage = keccak256(toBytes(sign_message));
    setSign_hashedMessage(hashedMessage);
  }, [sign_message]);

  useEffect(() => {
    const prefixedHashedMessage = toPrefixedMessage({raw: sign_hashedMessage});
    setSign_prefixedHashedMessage(prefixedHashedMessage);
  }, [sign_hashedMessage]);

  useEffect(() => {
    const hashedPrefixedHashedMessage = keccak256(sign_prefixedHashedMessage);
    setSign_hashedPrefixedHashedMessage(hashedPrefixedHashedMessage);
  }, [sign_prefixedHashedMessage]);


  useEffect(() => {
    createSignature(sign_privateKey)
      .then((e) => setSign_signature(e))
      .catch((e) => setSign_signature(e.toString()))
  }, [sign_privateKey, sign_hashedPrefixedHashedMessage]);


  useEffect(() => {
    verifySignature(verify_message, verify_signature)
      .then((e) => setVerify_result(e))
      .catch((e) => setVerify_result(e.toString()))
  }, [verify_message, verify_signature]);


  const createSignature = async (privateKey: Hex) => {
    const signatures = {
      "hashMessage({ raw: sign_message} ) - 🟡 if len(message) != 32, it's better to hash message before ": hashMessage({ raw: sign_message} ),
      "hashMessage({ raw: sign_hashedMessage} ) - 🟢 hashMessage will prefix message with eth shit and hash the result": hashMessage({ raw: sign_hashedMessage} ),

      "signMessage({message: {raw: message}}) - 🟡 if len(message) != 32, it's better to hash message before": await awaitSafe(signMessage({ privateKey, message: { raw: sign_message } })),
      "signMessage({message: {raw: hashedMessage}}) - 🟢 signMessage will call hashMessage, no need to prefix": await awaitSafe(signMessage({ privateKey, message: { raw: sign_hashedMessage } })),

      "signMessage({message: {raw: prefixedHashedMessage}}) - 🔴 1 hash 2 prefixes (no way)": await awaitSafe(signMessage({ privateKey, message: { raw: sign_prefixedHashedMessage } })),
      "signMessage({message: {raw: hashedPrefixedHashedMessage}}) - 🔴 prefixed twice": await awaitSafe(signMessage({ privateKey, message: { raw: sign_hashedPrefixedHashedMessage } })),
      "signMessage({message: {raw: hashMessage(hashedMessage)}}) - 🔴 same as above": await awaitSafe(signMessage({ privateKey, message: { raw: hashMessage({ raw: sign_hashedMessage} ) } })),
      "signMessage({message: {raw: hashMessage(message)}}) - 🔴 prefixed twice, without hashing": await awaitSafe(signMessage({ privateKey, message: { raw: hashMessage({ raw: sign_message} ) } })),

      // "signMessage({message: message})": await awaitSafe(signMessage({ privateKey, message: sign_message })),
      // "signMessage({message: hashedMessage})": await awaitSafe(signMessage({ privateKey, message: sign_hashedMessage })),
      // "signMessage({message: prefixedHashedMessage})": await awaitSafe(signMessage({ privateKey, message: sign_prefixedHashedMessage })),
      // "signMessage({message: hashedPrefixedHashedMessage})": await awaitSafe(signMessage({ privateKey, message: sign_hashedPrefixedHashedMessage })),


      "sign({hash: message}) - 🟡 missing hash and prefix": await awaitSafe(sign({ hash: sign_message, privateKey, to: 'hex' })),
      "sign({hash: hashedMessage}) - 🟡 missing prefix": await awaitSafe(sign({ hash: sign_hashedMessage, privateKey, to: 'hex' })),
      "sign({hash: prefixedHashedMessage}) - 🔴 missing hash after prefix": await awaitSafe(sign({ hash: sign_prefixedHashedMessage, privateKey, to: 'hex' })),

      "sign({hash: hashedPrefixedHashedMessage}) - 🟢 ok, if you already have hashedPrefixedHashedMessage": await awaitSafe(sign({ hash: sign_hashedPrefixedHashedMessage, privateKey, to: 'hex' })),
      "sign({hash: hashMessage({ raw: sign_hashedMessage})}) - 🟡 can use signMessage instead": await awaitSafe(sign({ hash: hashMessage({ raw: sign_hashedMessage}), privateKey, to: 'hex' })),
    }
    return signatures;
  }

  const verifySignature = async (message: Hex, signature: Hex) => {
    if (!signature) return;

    const hashedMessage = keccak256(toBytes(message));
    const recovered = {
      "recoverAddress({ hash: message}) - 🟡 message not hashed, missing prefix": await awaitSafe(recoverAddress({ hash: message, signature })),
      "recoverAddress({ hash: hashedMessage}) - 🟡 missing prefix": await awaitSafe(recoverAddress({ hash: hashedMessage, signature })),
      "recoverAddress({ hash: hashMessage({ raw: message }))}) - 🟡 message not hashed": await awaitSafe(recoverAddress({ hash: hashMessage({ raw: message }), signature })),
      "recoverAddress({ hash: hashMessage({ raw: hashedMessage }))}) - 🟢 zbs": await awaitSafe(recoverAddress({ hash: hashMessage({ raw: hashedMessage }), signature })),
      "recoverAddress({ hash: hashMessage({ raw: hashMessage({ raw: hashedMessage }) }))}) - 🔴 message prefixed twice": await awaitSafe(recoverAddress({ hash: hashMessage({ raw: hashMessage({ raw: hashedMessage }) }), signature })),
    };
    return recovered;
  };


  // @ts-ignore
  // @ts-ignore
  return (
    <div>
      <div>
        <h2>Sign Message</h2>

        <label>Private Key</label><br/>
        <input value={sign_privateKey} onChange={(e) => setSign_privateKey(e.target.value as Hex)}/>
        <br/>
        <label>Address</label><br/> {sign_address}
        <br/>

        <label>Message (bytes as hex)</label><br/>
        <textarea value={sign_message} onChange={(e) => setSign_message(e.target.value as Hex)}/>
        <br/>

        <label>Hashed Message (bytes as hex) </label><br/>
        <input value={sign_hashedMessage} onChange={(e) => setSign_hashedMessage(e.target.value as Hex)}/>
        <br/>


        <label>Prefixed Hashed Message (bytes as hex) </label><br/>
        <input value={sign_prefixedHashedMessage} onChange={(e) => setSign_prefixedHashedMessage(e.target.value as Hex)}/>
        <br/>

        <label>Hashed Prefixed Hashed Message (bytes as hex) </label><br/>
        <input value={sign_hashedPrefixedHashedMessage} onChange={(e) => setSign_hashedPrefixedHashedMessage(e.target.value as Hex)}/>
        <br/>


        <label>Result</label>
        <pre>{Object.entries(sign_signature).map(([key, address]) => (
          <div key={key}>
            <strong>{key}:</strong><br/>
            {address.toString()}
          </div>
        ))}
        </pre>
        <br/>

      </div>

      <div>
        <h2>Verify Signature</h2>

        <label>Message</label><br/>
        <input value={verify_message} onChange={(e) => setVerify_message(e.target.value as Hex)}/>
        <br/>

        <label>Signature</label><br/>
        <input value={verify_signature} onChange={(e) => setVerify_signature(e.target.value as Hex)}/>
        <br/>

        <label>Result</label>
        <pre>{Object.entries(verify_result).map(([key, address]) => (
          <div key={key}>
            <strong>{key}:</strong><br/>
            {address.toString()}
          </div>
        ))}
        </pre>
        <br/>

      </div>
    </div>
  );
}


async function awaitSafe<T>(promise: Promise<T>): Promise<T | string> {
  try {
    return await promise;
  } catch (e) {
    return e.toString();
  }
}


// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
