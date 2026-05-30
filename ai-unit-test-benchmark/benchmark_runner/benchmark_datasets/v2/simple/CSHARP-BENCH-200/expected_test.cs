public class NumberServiceTests
{
    [Fact]
    public void IsEven_ShouldReturnTrue_WhenNumberEven()
    {
        var service = new NumberService();

        var result = service.IsEven(4);

        Assert.True(result);
    }

    [Fact]
    public void IsEven_ShouldReturnFalse_WhenNumberOdd()
    {
        var service = new NumberService();

        var result = service.IsEven(5);

        Assert.False(result);
    }
}