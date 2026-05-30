public class StringServiceTests
{
    [Fact]
    public void Reverse_ShouldReturnReversedString()
    {
        var service = new StringService();

        var result = service.Reverse("hello");

        Assert.Equal("olleh", result);
    }
}