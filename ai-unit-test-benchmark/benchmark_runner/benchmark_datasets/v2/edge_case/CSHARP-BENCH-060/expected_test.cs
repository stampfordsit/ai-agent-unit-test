public class TemperatureServiceTests
{
    [Fact]
    public void ConvertToCelsius_ShouldThrowOverflow_WhenValueTooHigh()
    {
        var service = new TemperatureService();

        Assert.Throws<OverflowException>(
            () => service.ConvertToCelsius(20000));
    }
}