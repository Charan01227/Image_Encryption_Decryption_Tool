// Function to convert user-provided key into CryptoKey object
async function importKeyFromString(keyString) {
    if (keyString.length !== 16) {
        throw new Error("Key must be exactly 16 characters long for 128-bit AES.");
    }
    
    const keyBuffer = new TextEncoder().encode(keyString); // Encode the key as Uint8Array
    return await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

// Function to encrypt the file
async function encryptFile(file, key) {
    const fileData = await file.arrayBuffer(); // Read the file as an array buffer
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate random 12-byte IV for AES-GCM
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        fileData
    );

    // Combine IV (12 bytes) and encrypted data
    const encryptedBlob = new Blob([iv, encryptedData], { type: "application/octet-stream" });
    return encryptedBlob;
}

async function decryptFile(file, key) {
    const fileData = await file.arrayBuffer();
    
    const iv = fileData.slice(0, 12); // First 12 bytes are the IV
    const encryptedData = fileData.slice(12); // The rest is the encrypted content
    
    try {
        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: new Uint8Array(iv) 
            },
            key,
            encryptedData
        );
        
        return new Blob([decryptedData], { type: file.type }); // Maintain the original file type
    } catch (error) {
        console.error("Decryption failed: ", error);
        throw new Error("Decryption failed. Please check the key and try again.");
    }
}

document.getElementById("encryptButton").addEventListener("click", async () => {
    const keyInput = document.getElementById("keyInput").value;
    const fileInput = document.getElementById("fileInput").files[0];

    if (keyInput.length !== 16) {
        alert("Key must be exactly 16 characters long.");
        return;
    }

    if (fileInput) {
        const key = await importKeyFromString(keyInput); 
        const encryptedBlob = await encryptFile(fileInput, key);

        const downloadLink = document.getElementById("downloadEncrypted");
        downloadLink.href = URL.createObjectURL(encryptedBlob);
        downloadLink.download = "encrypted_file.enc";
        downloadLink.style.display = "block";
        downloadLink.textContent = "Download Encrypted File";

        downloadLink.addEventListener('click', () => {
            setTimeout(() => location.reload(), 1000);
        });
    } else {
        alert("Please select a file to encrypt.");
    }
});

document.getElementById("decryptButton").addEventListener("click", async () => {
    const keyInput = document.getElementById("keyInputDecrypt").value;
    const encryptedInput = document.getElementById("encryptedInput").files[0];

    if (keyInput.length !== 16) {
        alert("Key must be exactly 16 characters long.");
        return;
    }

    if (encryptedInput) {
        const key = await importKeyFromString(keyInput); 
        try {
            const decryptedBlob = await decryptFile(encryptedInput, key);

            
            const downloadLink = document.getElementById("downloadDecrypted");
            downloadLink.href = URL.createObjectURL(decryptedBlob);
            downloadLink.download = "decrypted_file." + encryptedInput.name.split('.').pop(); 
            downloadLink.style.display = "block";
            downloadLink.textContent = "Download Decrypted File";

            downloadLink.addEventListener('click', () => {
                setTimeout(() => location.reload(), 1000);
            });
        } catch (error) {
            alert("Decryption failed. Please make sure you provided the correct key.");
        }
    } else {
        alert("Please select an encrypted file to decrypt.");
    }
});
