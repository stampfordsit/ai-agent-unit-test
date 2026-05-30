public class RetryProcessorTests
{
    [Fact]
    public async Task ProcessAsync_ShouldReturnTrue_OnThirdAttempt()
    {
        var processor = new RetryProcessor();

        var result = await processor.ProcessAsync();

        Assert.True(result);
    }
}