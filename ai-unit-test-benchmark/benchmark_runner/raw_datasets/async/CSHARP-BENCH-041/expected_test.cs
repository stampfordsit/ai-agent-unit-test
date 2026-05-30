public class FileServiceTests
{
    [Fact]
    public async Task SaveFileAsync_ShouldReturnFalse_WhenContentEmpty()
    {
        var service = new FileService();

        var result = await service.SaveFileAsync("");

        Assert.False(result);
    }

    [Fact]
    public async Task SaveFileAsync_ShouldReturnTrue_WhenContentValid()
    {
        var service = new FileService();

        var result = await service.SaveFileAsync("Hello");

        Assert.True(result);
    }
}