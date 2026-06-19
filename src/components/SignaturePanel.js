import React from "react";
import { generateKeys } from "../crypto/rsaService";

function SignaturePanel() {

    const createKeys = () => {

    const keys =generateKeys();

    localStorage.setItem( "publicKey", keys.publicKey);
    localStorage.setItem("privateKey", keys.privateKey);

    alert( "Tạo RSA thành công");
};

    return ( <button onClick={createKeys}> Generate RSA Key </button>
);
}

export default SignaturePanel;