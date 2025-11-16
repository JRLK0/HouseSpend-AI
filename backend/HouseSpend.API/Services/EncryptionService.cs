using System.Security.Cryptography;
using System.Text;

namespace HouseSpend.API.Services;

public class EncryptionService : IEncryptionService
{
    private readonly string _encryptionKey;

    public EncryptionService(IConfiguration configuration)
    {
        // Obtener la clave de encriptación desde configuración o generar una por defecto
        _encryptionKey = configuration["Encryption:Key"] ?? "HouseSpend-AI-Encryption-Key-2024-32-Bytes!!";
        
        // Asegurar que la clave tenga exactamente 32 bytes para AES-256
        if (_encryptionKey.Length < 32)
        {
            _encryptionKey = _encryptionKey.PadRight(32, '0');
        }
        else if (_encryptionKey.Length > 32)
        {
            _encryptionKey = _encryptionKey.Substring(0, 32);
        }
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        byte[] iv = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(iv);
        }

        byte[] key = Encoding.UTF8.GetBytes(_encryptionKey);

        using (var aes = Aes.Create())
        {
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using (var encryptor = aes.CreateEncryptor())
            using (var msEncrypt = new MemoryStream())
            {
                msEncrypt.Write(iv, 0, iv.Length);
                using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                using (var swEncrypt = new StreamWriter(csEncrypt))
                {
                    swEncrypt.Write(plainText);
                }
                return Convert.ToBase64String(msEncrypt.ToArray());
            }
        }
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return string.Empty;

        byte[] fullCipher = Convert.FromBase64String(cipherText);
        byte[] iv = new byte[16];
        byte[] cipher = new byte[fullCipher.Length - 16];

        Array.Copy(fullCipher, 0, iv, 0, 16);
        Array.Copy(fullCipher, 16, cipher, 0, fullCipher.Length - 16);

        byte[] key = Encoding.UTF8.GetBytes(_encryptionKey);

        using (var aes = Aes.Create())
        {
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using (var decryptor = aes.CreateDecryptor())
            using (var msDecrypt = new MemoryStream(cipher))
            using (var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
            using (var srDecrypt = new StreamReader(csDecrypt))
            {
                return srDecrypt.ReadToEnd();
            }
        }
    }
}

