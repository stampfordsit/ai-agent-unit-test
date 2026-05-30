public class MathServiceTests
{
    [Fact]
    public void CalculateSquareRoot_ShouldThrowException_WhenValueNegative()
    {
        var service = new MathService();

        Assert.Throws<ArgumentException>(
            () => service.CalculateSquareRoot(-1));
    }
}