public class MathServiceTests
{
    [Fact]
    public void Add_ShouldReturnCorrectSum()
    {
        var service = new MathService();

        var result = service.Add(5, 3);

        Assert.Equal(8, result);
    }
}