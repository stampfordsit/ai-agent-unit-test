public class RetryServiceTests
{
    [Fact]
    public async Task ExecuteAsync_ShouldReturnTrue_WhenRetrySucceeds()
    {
        var client = new Mock<IApiClient>();

        client.SetupSequence(x => x.SendAsync())
            .ReturnsAsync(false)
            .ReturnsAsync(false)
            .ReturnsAsync(true);

        var service = new RetryService(client.Object);

        var result = await service.ExecuteAsync();

        Assert.True(result);

        client.Verify(
            x => x.SendAsync(),
            Times.Exactly(3));
    }

    [Fact]
    public async Task ExecuteAsync_ShouldReturnFalse_WhenAllRetriesFail()
    {
        var client = new Mock<IApiClient>();

        client.Setup(x => x.SendAsync())
            .ReturnsAsync(false);

        var service = new RetryService(client.Object);

        var result = await service.ExecuteAsync();

        Assert.False(result);

        client.Verify(
            x => x.SendAsync(),
            Times.Exactly(3));
    }
}