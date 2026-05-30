[Fact]
public void FormatName_ShouldReturnFullName()
{
    var result = service.FormatName("John", "Doe");

    Assert.Equal("John Doe", result);
}