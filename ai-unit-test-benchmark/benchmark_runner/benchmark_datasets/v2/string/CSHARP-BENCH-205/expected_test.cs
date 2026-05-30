public class TextServiceTests
{
    [Fact]
    public void Normalize_ShouldTrimAndLowercaseText()
    {
        var service = new TextService();

        var result = service.Normalize("  HELLO World  ");

        Assert.Equal("hello world", result);
    }
}