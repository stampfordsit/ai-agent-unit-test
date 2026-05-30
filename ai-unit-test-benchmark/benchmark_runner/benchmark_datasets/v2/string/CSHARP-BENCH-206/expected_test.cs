public class NameServiceTests
{
    [Fact]
    public void FormatFullName_ShouldReturnFormattedName()
    {
        var service = new NameService();

        var result = service.FormatFullName(
            "John",
            "Doe");

        Assert.Equal("John Doe", result);
    }
}