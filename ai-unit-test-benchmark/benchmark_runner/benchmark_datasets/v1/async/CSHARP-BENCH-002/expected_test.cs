public class MathServiceTests
{
    [Fact]
    public async Task DivideAsync_ShouldReturnResult_WhenInputValid()
    {
        var service = new MathService();

        var result = await service.DivideAsync(10, 2);

        Assert.Equal(5, result);
    }

    [Fact]
    public async Task DivideAsync_ShouldThrowException_WhenDivideByZero()
    {
        var service = new MathService();

        await Assert.ThrowsAsync<DivideByZeroException>(
            () => service.DivideAsync(10, 0));
    }
}