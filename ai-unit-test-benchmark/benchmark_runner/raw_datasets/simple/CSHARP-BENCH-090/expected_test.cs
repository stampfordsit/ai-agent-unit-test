public class ComparisonServiceTests
{
    [Fact]
    public void GetMax_ShouldReturnFirstValue_WhenFirstGreater()
    {
        var service = new ComparisonService();

        var result = service.GetMax(10, 5);

        Assert.Equal(10, result);
    }

    [Fact]
    public void GetMax_ShouldReturnSecondValue_WhenSecondGreater()
    {
        var service = new ComparisonService();

        var result = service.GetMax(3, 7);

        Assert.Equal(7, result);
    }
}