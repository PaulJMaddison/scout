using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace ContextLayer.Infrastructure.Auth;

public sealed class PasswordHashingService
{
    private const string FormatMarker = "pbkdf2-sha256";
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int IterationCount = 600_000;

    public string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = KeyDerivation.Pbkdf2(
            password,
            salt,
            KeyDerivationPrf.HMACSHA256,
            IterationCount,
            KeySize);

        return string.Join(
            '$',
            FormatMarker,
            IterationCount,
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        ArgumentException.ThrowIfNullOrWhiteSpace(hashedPassword);

        var segments = hashedPassword.Split('$', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length != 4
            || !string.Equals(segments[0], FormatMarker, StringComparison.Ordinal)
            || !int.TryParse(segments[1], out var iterations))
        {
            return false;
        }

        var salt = Convert.FromBase64String(segments[2]);
        var expectedHash = Convert.FromBase64String(segments[3]);
        var actualHash = KeyDerivation.Pbkdf2(
            password,
            salt,
            KeyDerivationPrf.HMACSHA256,
            iterations,
            expectedHash.Length);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}
