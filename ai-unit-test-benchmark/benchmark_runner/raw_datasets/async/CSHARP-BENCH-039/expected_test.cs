public class DownloadServiceTests
{
    [Fact]
    public async Task DownloadAsync_ShouldReturnOk()
    {
        var service = new DownloadService();

        var result = await service.DownloadAsync();

        Assert.Equal("OK", result);
    }
}