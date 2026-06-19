import forge from "node-forge";

export const generateKeys = () => {

const keypair = forge.pki.rsa.generateKeyPair(2048);

const publicKey = forge.pki.publicKeyToPem( keypair.publicKey);

const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);

return {
    publicKey,
    privateKey
};
};

export const signData = (
privateKeyPem,
data
) => {

const privateKey =
    forge.pki.privateKeyFromPem(
    privateKeyPem
    );

const md = forge.md.sha256.create();

md.update(data, "utf8");

const signature = forge.util.encode64( privateKey.sign(md) );
return signature;
};

export const verifyData = (publicKeyPem,data,signature) => {
const publicKey =forge.pki.publicKeyFromPem(publicKeyPem);
const md = forge.md.sha256.create();
md.update(data, "utf8");
return publicKey.verify( md.digest().bytes(), forge.util.decode64(signature));
};