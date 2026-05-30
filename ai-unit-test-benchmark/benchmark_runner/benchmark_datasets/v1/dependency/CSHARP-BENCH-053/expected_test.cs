public class DataServiceTests
{
    [Fact]
    public async Task GetDataAsync_ShouldPassCancellationToken()
    {
        var repo = new Mock<IDataRepository>();

        var token = new CancellationToken();

        repo.Setup(x => x.LoadAsync(token))
            .ReturnsAsync("DATA");

        var service = new DataService(repo.Object);

        var result = await service.GetDataAsync(token);

        Assert.Equal("DATA", result);

        repo.Verify(
            x => x.LoadAsync(token),
            Times.Once);
    }
}