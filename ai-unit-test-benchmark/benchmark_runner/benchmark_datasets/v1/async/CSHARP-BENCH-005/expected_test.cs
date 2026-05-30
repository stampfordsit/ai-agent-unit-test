public class NotificationServiceTests
{
    [Fact]
    public async Task SendAsync_ShouldReturnInvalidEmail_WhenEmailEmpty()
    {
        var service = new NotificationService();

        var result = await service.SendAsync(
            "",
            CancellationToken.None);

        Assert.Equal("INVALID_EMAIL", result);
    }

    [Fact]
    public async Task SendAsync_ShouldReturnSent_WhenEmailValid()
    {
        var service = new NotificationService();

        var result = await service.SendAsync(
            "test@example.com",
            CancellationToken.None);

        Assert.Equal("SENT", result);
    }
}