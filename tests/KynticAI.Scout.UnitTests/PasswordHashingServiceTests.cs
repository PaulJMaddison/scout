using KynticAI.Scout.Infrastructure.Auth;

namespace KynticAI.Scout.UnitTests;

public sealed class PasswordHashingServiceTests
{
    [Fact]
    public void HashPassword_ProducesVerifiableHash()
    {
        var service = new PasswordHashingService();

        var hash = service.HashPassword("DemoAdmin123!");

        Assert.NotEqual("DemoAdmin123!", hash);
        Assert.True(service.VerifyPassword("DemoAdmin123!", hash));
    }

    [Fact]
    public void VerifyPassword_ReturnsFalse_ForMalformedHash()
    {
        var service = new PasswordHashingService();

        var matches = service.VerifyPassword("DemoAdmin123!", "not-a-real-hash");

        Assert.False(matches);
    }
}
