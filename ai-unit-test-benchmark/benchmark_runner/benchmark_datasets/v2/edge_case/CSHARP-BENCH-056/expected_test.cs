public class StringServiceTests
{
    [Fact]
    public void GetLength_ShouldReturnZero_WhenValueNull()
    {
        var service = new StringService();

        var result = service.GetLength(null);

        Assert.Equal(0, result);
    }
}