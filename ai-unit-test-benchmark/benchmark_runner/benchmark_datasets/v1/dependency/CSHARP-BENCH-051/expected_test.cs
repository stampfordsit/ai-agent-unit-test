public class NotificationServiceTests
{
    [Fact]
    public async Task SendWelcomeEmailAsync_ShouldReturnFalse_WhenEmailInvalid()
    {
        var emailService = new Mock<IEmailService>();

        var service = new NotificationService(emailService.Object);

        var result = await service.SendWelcomeEmailAsync("");

        Assert.False(result);

        emailService.Verify(
            x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task SendWelcomeEmailAsync_ShouldSendEmail_WhenEmailValid()
    {
        var emailService = new Mock<IEmailService>();

        var service = new NotificationService(emailService.Object);

        var result = await service.SendWelcomeEmailAsync("test@example.com");

        Assert.True(result);

        emailService.Verify(
            x => x.SendAsync(
                "test@example.com",
                "Welcome to our platform"),
            Times.Once);
    }
}