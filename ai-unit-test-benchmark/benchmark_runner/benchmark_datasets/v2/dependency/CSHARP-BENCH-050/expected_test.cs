public class PaymentServiceTests
{
    [Fact]
    public async Task ProcessAsync_ShouldReturnFalse_WhenAmountInvalid()
    {
        var logger = new Mock<ILoggerService>();

        var service = new PaymentService(logger.Object);

        var result = await service.ProcessAsync(0);

        Assert.False(result);

        logger.Verify(
            x => x.LogErrorAsync("Invalid payment amount"),
            Times.Once);
    }

    [Fact]
    public async Task ProcessAsync_ShouldReturnTrue_WhenAmountValid()
    {
        var logger = new Mock<ILoggerService>();

        var service = new PaymentService(logger.Object);

        var result = await service.ProcessAsync(100);

        Assert.True(result);

        logger.Verify(
            x => x.LogErrorAsync(It.IsAny<string>()),
            Times.Never);
    }
}