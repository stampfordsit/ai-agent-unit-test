public class DivideServiceTests
{
    [Fact]
    public void Divide_ShouldThrowException_WhenDivideByZero()
    {
        var service = new DivideService();

        Assert.Throws<DivideByZeroException>(
            () => service.Divide(10, 0));
    }
}